"""Generate editable Make custom app components, not a Make scenario blueprint."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'integrations/make'
catalog = json.loads((ROOT / 'docs/operation-contracts.json').read_text())
docs = {api: json.loads((ROOT / f'sources/{api}-openapi.json').read_text()) for api in ['data', 'sequences', 'tasks']}

def save(path, value):
    target = DEST / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, indent=2, ensure_ascii=True) + '\n')

def resolve(schema, doc):
    while '$ref' in schema:
        schema = doc['components']['schemas'][schema['$ref'].split('/')[-1]]
    variants = schema.get('anyOf', schema.get('oneOf', []))
    nonnull = [v for v in variants if v.get('type') != 'null']
    return resolve(nonnull[0], doc) if len(nonnull) == 1 else schema

def output_field(name, schema, doc, depth=0):
    schema = resolve(schema, doc)
    kind = schema.get('type')
    result = {'name': name, 'label': name.replace('_', ' ').title().replace(' Id', ' ID'), 'type': {'string':'text', 'integer':'number', 'number':'number', 'boolean':'boolean'}.get(kind,'any')}
    if depth < 4 and kind == 'object' and schema.get('properties'):
        result.update(type='collection', spec=[output_field(k,v,doc,depth+1) for k,v in schema['properties'].items()])
    if depth < 4 and kind == 'array':
        item = output_field('item', schema.get('items', {}), doc, depth+1)
        item.pop('name'); item.pop('label')
        result.update(type='array', spec=item)
    return result

sanitize = {'sanitize': ['request.headers.`X-Api-Key`', 'request.headers.`x-api-key`']}
save('base.json', {'baseUrl':'https://api.unifygtm.com', 'headers':{'X-Api-Key':'{{connection.apiKey}}','Accept':'application/json'}, 'type':'json', 'followRedirect':False, 'followAllRedirect':False, 'log':sanitize, 'response':{'error':{'message':'Unify request failed (HTTP {{statusCode}}). Check the operation parameters, permissions and API documentation.'}}})
save('connections/api-key/parameters.json', [{'name':'apiKey','label':'API Key','type':'password','required':True,'editable':True,'help':'Create a key in Unify Settings > Developers.'}])
save('connections/api-key/communication.json', {'url':'https://api.unifygtm.com/data/v1/objects','method':'GET','headers':{'X-Api-Key':'{{parameters.apiKey}}'}, 'followRedirect':False,'followAllRedirect':False,'response':{'valid':'{{statusCode === 200}}','error':{'message':'Unify authentication failed (HTTP {{statusCode}}).'}},'log':sanitize})

manifest = []
for op in catalog:
    if op['api'] == 'analytics':
        continue
    doc = docs[op['api']]
    directory = 'modules/' + op['id']
    path = op['path']
    params, query = [], {}
    for f in op['fields']:
        if f['location'] not in ['path','query'] or (op['isList'] and f['name'] in ['limit','page_size']):
            continue
        p = {'name':f['key'], 'label':f['label'], 'type':{'boolean':'boolean','integer':'integer','number':'number','json':'array'}.get(f['type'],'text'), 'required':f['required'], 'help':f['description'], 'advanced':not f['required']}
        if f['enum']:
            p.update(type='select',options=[{'label':str(v),'value':v} for v in f['enum']])
        if f['default'] is not None:
            p['default'] = f['default']
        if f['type'] == 'json':
            p['spec'] = {'type':'text'}
            # The public API accepts repeated filters. Single-filter mode avoids
            # relying on undocumented Make query-array serialization.
            p.update(type='text', help=f['description'] + ' This initial Make component accepts one value. Use the API call module for repeated filters.')
            p.pop('spec')
        if f['minimum'] is not None or f['maximum'] is not None:
            p['validate'] = {k:v for k,v in [('min',f['minimum']),('max',f['maximum'])] if v is not None}
        params.append(p)
        if f['location'] == 'path':
            path = path.replace('{'+f['name']+'}', '{{encodeURL(parameters.'+f['key']+')}}')
        else:
            query[f['name']] = '{{parameters.'+f['key']+'}}'
    communication = {'url':path,'method':op['method'],'encodeUrl':False}
    if op['hasBody']:
        params.append({'name':'requestBody','label':'Request Body (JSON)','type':'text','required':op['bodyRequired'],'help':'Enter the complete JSON request body for '+op['id']+'. Preserve JSON types. See docs/operation-contracts.json and the Unify API reference.'})
        communication['body'] = "{{parseJSON(ifempty(parameters.requestBody, '{}'))}}"
    schema = op['responseSchema']
    if op['isList']:
        params.append({'name':'limit','label':'Limit','type':'uinteger','default':50,'required':True,'validate':{'min':1,'max':1000},'help':'Maximum number of records to return in this execution. Make runtime pagination limits also apply.'})
        size = next((f for f in op['fields'] if f['name'] in ['limit','page_size']), None)
        if size:
            query[size['name']] = '{{min(parameters.limit, 100)}}'
        communication['response'] = {'iterate':'{{body.'+op['arrayKey']+'}}','output':'{{item}}','limit':'{{parameters.limit}}'}
        schema = resolve(schema['properties'][op['arrayKey']],doc).get('items', {})
        if op['pagination'] == 'cursor':
            communication['pagination'] = {'qs':{'cursor':'{{body.next_cursor}}'},'condition':'{{body.next_cursor}}'}
        elif op['pagination'] == 'page':
            communication['pagination'] = {'qs':{'page':'{{body.page + 1}}'},'condition':'{{body.page * body.page_size < body.total}}'}
    else:
        communication['response'] = {'output':'{{body}}'}
    if query:
        communication['qs'] = query
    resolved = resolve(schema,doc)
    interface = [output_field(k,v,doc) for k,v in resolved.get('properties',{}).items()]
    if not interface:
        communication['response']['output'] = {'result':communication['response']['output']}
        interface = [{'name':'result','label':'Result','type':'any'}]
    meta = {'name':op['id'],'label':op['label'],'type':'search' if op['isList'] else 'action','connection':'api-key','description':op['label']+' in Unify.','api':op['api'],'sourcePath':op['path']}
    manifest.append(meta)
    for filename, data in [('metadata.json',meta),('communication.json',communication),('parameters.json',params),('interface.json',interface)]:
        save(directory+'/'+filename,data)

universal = {'name':'make_api_call','label':'Make an API Call','type':'universal','connection':'api-key','description':'Performs an arbitrary authorized API call.'}
save('modules/make_api_call/metadata.json',universal)
save('modules/make_api_call/parameters.json', [
    {'name':'url','label':'URL','type':'text','required':True,'help':'Enter a path relative to https://api.unifygtm.com, for example /data/v1/objects. Query parameters can be included in this relative path.'},
    {'name':'method','label':'Method','type':'select','default':'GET','required':True,'options':[{'label':m,'value':m} for m in ['GET','POST','PATCH','PUT','DELETE']]},
    {'name':'body','label':'Body (JSON)','type':'text','help':'Complete JSON request body, if required.'},
])
save('modules/make_api_call/communication.json',{'url':'https://api.unifygtm.com/{{parameters.url}}','method':'{{parameters.method}}','type':'text','headers':{'Content-Type':'application/json'},'body':'{{parameters.body}}','response':{'output':{'body':'{{body}}','headers':'{{headers}}','statusCode':'{{statusCode}}'}}})
save('modules/make_api_call/interface.json',[{'name':'body','label':'Body','type':'any'},{'name':'headers','label':'Headers','type':'collection'},{'name':'statusCode','label':'Status Code','type':'number'}])
manifest.append(universal)
save('manifest.json',{'name':'unifygtm','label':'Unify','version':1,'status':'source-draft-awaiting-runtime-validation','modules':manifest})
print(f'Generated {len(manifest)} Make component sets')
