"""Build the five-module Make release separately from the full prototype catalog."""
import json
import pathlib
from copy import deepcopy

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'integrations/make'
DEST = SOURCE / 'release'
doc = json.loads((ROOT / 'sources/data-openapi.json').read_text())

def save(path, value):
    target = DEST / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, indent=2) + '\n')

def load(path):
    return json.loads((SOURCE / path).read_text())

def resolve(schema):
    if '$ref' in schema:
        return resolve(doc['components']['schemas'][schema['$ref'].split('/')[-1]])
    variants = schema.get('anyOf', schema.get('oneOf', []))
    nonnull = [resolve(s) for s in variants if s.get('type') != 'null']
    if len(nonnull) == 1:
        return nonnull[0]
    # Output interfaces expose the union of documented fields, including allOf.
    objects = [s for s in nonnull if s.get('type') == 'object']
    if objects and len(objects) == len(nonnull):
        props = {}
        for s in objects:
            props.update(s.get('properties', {}))
        return {'type': 'object', 'properties': props}
    result = deepcopy(schema)
    for base in schema.get('allOf', []):
        result.setdefault('properties', {}).update(resolve(base).get('properties', {}))
    return result

def label(name):
    return {'api_name':'API name'}.get(name, name.replace('_', ' ').capitalize())

def field(name, schema):
    schema = resolve(schema)
    kind = schema.get('type')
    out = {'name':name, 'label':label(name), 'type':{'string':'text','boolean':'boolean','integer':'number','number':'number','object':'collection','array':'array'}[kind]}
    if kind == 'object':
        out['spec'] = [field(k,v) for k,v in schema.get('properties',{}).items()]
    if kind == 'array':
        item = field('item',schema['items']); item.pop('name'); item.pop('label')
        out['spec'] = item
    return out

error = {'message':"[{{statusCode}}] {{ifempty(body.message, ifempty(body.error.message, 'Unify API request failed. Check the request parameters and permissions.'))}}"}
base = load('base.json')
base['headers'] = {'x-api-key':'{{connection.apiKey}}','Accept':'application/json'}
base['log'] = {'sanitize':['request.headers.x-api-key']}
base['response']['error'] = error
save('base.json',base)
connection = load('connections/api-key/communication.json')
connection['headers'] = {'x-api-key':'{{parameters.apiKey}}'}
connection['log'] = base['log']; connection['response']['error'] = error
save('connections/api-key/communication.json', connection)
params = load('connections/api-key/parameters.json'); params[0]['label'] = 'API key'
save('connections/api-key/parameters.json',params)

names = ['list_objects','get_object','list_object_attributes','get_object_attribute','make_api_call']
labels = ['List objects','Get an object','List object attributes','Get an object attribute','Make an API call']
descriptions = ['Lists object definitions.','Retrieves an object definition.','Lists the attributes of an object.','Retrieves an object attribute definition.','Performs an arbitrary authorized API call.']
manifest = []
object_spec = [field(k,v) for k,v in resolve({'$ref':'#/components/schemas/UObjects.UObject'})['properties'].items()]
attribute_spec = [field(k,v) for k,v in resolve({'$ref':'#/components/schemas/UObjects.UAttribute'})['properties'].items()]
for name, title, description in zip(names,labels,descriptions):
    meta = load(f'modules/{name}/metadata.json')
    meta.update(label=title,description=description)
    if name != 'make_api_call': meta['action'] = 'read'
    manifest.append(meta)
    comm = load(f'modules/{name}/communication.json')
    params = load(f'modules/{name}/parameters.json')
    interface = attribute_spec if 'attribute' in name else object_spec
    if name.startswith('get_'):
        # Same resource shape as list outputs, without the transport envelope.
        comm['response']['output'] = '{{body.data}}'
    elif name.startswith('list_'):
        comm['response']['output'] = '{{item}}'
        comm['response']['limit'] = '{{ifempty(parameters.limit, 10)}}'
    for p in params:
        p.pop('advanced',None)
        if p['name'] == 'limit':
            p.update(default=10,required=False,help='Maximum number of results returned in one execution.')
            p['validate'] = {'min':1,'max':1000}
        elif p['name'] == 'pathObjectName':
            p.update(label='Object',type='select',mode='edit',options='rpc://listObjects',help='Select an object or map its API name.')
        elif p['name'] == 'pathAttributeName':
            p.update(label='Attribute',type='select',mode='edit',options='rpc://listAttributes',help='Select an attribute or map its API name. Choose an object first.')
    if name == 'get_object_attribute':
        attribute = next(p for p in params if p['name'] == 'pathAttributeName')
        params = [p for p in params if p['name'] != 'pathAttributeName']
        params[0]['options'] = {'store':'rpc://listObjects','nested':[attribute]}
    if name == 'make_api_call':
        pairs = [{'name':'key','label':'Key','type':'text','required':True},{'name':'value','label':'Value','type':'text'}]
        params = [
            {'name':'url','label':'URL','type':'text','required':True,'validate':{'pattern':'^/(?!/).*'},'help':'Enter a path relative to https://api.unifygtm.com, for example /data/v1/objects.'},
            {'name':'method','label':'Method','type':'select','required':True,'default':'GET','options':[{'label':m,'value':m} for m in ['GET','POST','PUT','PATCH','DELETE']]},
            {'name':'headers','label':'Headers','type':'array','spec':pairs,'help':'The API key is added automatically. Do not add authentication headers.'},
            {'name':'qs','label':'Query string','type':'array','spec':pairs},
            {'name':'body','label':'Body','type':'text','help':'Enter the JSON request body, if required.'},
        ]
        comm['headers'] = {'Content-Type':'application/json','{{...}}':"{{toCollection(parameters.headers, 'key', 'value')}}",'x-api-key':'{{connection.apiKey}}'}
        comm['qs'] = {'{{...}}':"{{toCollection(parameters.qs, 'key', 'value')}}"}
        interface = load(f'modules/{name}/interface.json'); interface[-1]['label'] = 'Status code'
    for file,data in [('metadata.json',meta),('communication.json',comm),('parameters.json',params),('interface.json',interface)]:
        save(f'modules/{name}/{file}',data)

for name,path in [('listObjects','/data/v1/objects'),('listAttributes','/data/v1/objects/{{encodeURL(parameters.pathObjectName)}}/attributes')]:
    save(f'rpcs/{name}/communication.json',{'url':path,'method':'GET','encodeUrl':False,'response':{'iterate':'{{body.data}}','limit':100,'output':{'label':'{{item.display_name}} ({{item.api_name}})','value':'{{item.api_name}}'}}})
    save(f'rpcs/{name}/parameters.json',[] if name=='listObjects' else [{'name':'pathObjectName','label':'Object API name','type':'text','required':True}])
save('groups.json',[{'label':'Objects','modules':['listObjects','getObject']},{'label':'Object attributes','modules':['listObjectAttributes','getObjectAttribute']},{'label':'Other','modules':['makeApiCall']}])
save('manifest.json',{'name':'unifygtm','label':'Unify','version':1,'status':'review-fixes-awaiting-runtime-validation','modules':manifest,'rpcs':['listObjects','listAttributes']})
print('Generated five release modules and two read-only RPCs; 74 prototypes remain outside the release.')
