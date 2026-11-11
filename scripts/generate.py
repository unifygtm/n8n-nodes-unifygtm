"""Generate operation metadata from pinned public Unify OpenAPI specifications."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

def save(path, data):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, indent=2, ensure_ascii=True) + '\n')

def title(name):
    return re.sub(r'([a-z])([A-Z])', r'\1 \2', name).replace('_', ' ').title().replace(' Id', ' ID').replace(' Api', ' API')

def camel(name):
    parts = re.split(r'[^a-zA-Z0-9]+', name)
    return parts[0] + ''.join(s[:1].upper() + s[1:] for s in parts[1:])

def resolve(schema, doc):
    seen = set()
    while '$ref' in schema:
        ref = schema['$ref']
        if ref in seen:
            raise ValueError('Circular top-level reference: ' + ref)
        seen.add(ref)
        schema = {**doc['components']['schemas'][ref.split('/')[-1]], **{k:v for k,v in schema.items() if k != '$ref'}}
    return schema

def simplified(schema, doc):
    schema = resolve(schema, doc)
    variants = schema.get('anyOf', schema.get('oneOf', []))
    non_null = [resolve(v, doc) for v in variants if resolve(v, doc).get('type') != 'null']
    if len(non_null) == 1:
        return {**simplified(non_null[0], doc), **{k:v for k,v in schema.items() if k not in ['anyOf','oneOf']}, 'nullable': len(non_null) != len(variants)}
    return schema

def field(name, schema, doc, location, required=False, description=''):
    s = simplified(schema, doc)
    kind = s.get('type', 'json')
    if kind in ['array','object'] or 'anyOf' in s or 'oneOf' in s:
        kind = 'json'
    return dict(name=name, key=camel(location + '_' + name), location=location,
                required=required, type=kind, label=title(name),
                description=(description or s.get('description','')).replace('\u2014', ',').replace('\n',' '),
                enum=s.get('enum'), minimum=s.get('minimum'), maximum=s.get('maximum'),
                format=s.get('format'), nullable=s.get('nullable',False),
                jsonType=s.get('type') if kind == 'json' else None,
                maxItems=s.get('maxItems'), minItems=s.get('minItems'),
                default=s.get('default'), explode=schema.get('explode', False))

catalog = []
for api in ['data','sequences','tasks','analytics']:
    doc = json.loads((ROOT / 'sources' / (api + '-openapi.json')).read_text())
    for path, methods in doc['paths'].items():
        for method, op in methods.items():
            if method not in ['get','post','patch','put','delete']:
                continue
            resource = op.get('tags', [api])[-1]
            if 'query-jobs' in path and not resource.endswith('Query Jobs'):
                resource += ' Query Jobs'
            fields = []
            for param in op.get('parameters', []):
                if param['in'] == 'header':
                    continue  # Analytics Origin belongs to its credential.
                f = field(param['name'], param['schema'], doc, param['in'], param.get('required',False),param.get('description',''))
                f['explode'] = param.get('explode', param.get('style','form') == 'form')
                if f['name'] == 'page_size':
                    f['maximum'] = 2000  # This connector requests JSON, never NDJSON.
                fields.append(f)
            rb = op.get('requestBody',{})
            schema = resolve(rb.get('content',{}).get('application/json',{}).get('schema',{}),doc)
            if rb:
                if schema.get('properties'):
                    for name, spec in schema['properties'].items():
                        s = resolve(spec, doc)
                        if not s.get('readOnly'):
                            fields.append(field(name, spec, doc, 'body', name in schema.get('required',[])))
                else:
                    fields.append(field('request_body',schema,doc,'rawBody',rb.get('required',False),
                                        'JSON request body. Use the documented schema for this operation.'))
            response = next((r for code,r in op['responses'].items() if code.startswith('2')), {})
            response_schema = resolve(response.get('content',{}).get('application/json',{}).get('schema',{}),doc)
            props = response_schema.get('properties',{})
            array_key = next((k for k,v in props.items() if resolve(v,doc).get('type')=='array'),None)
            is_list = method == 'get' and bool(array_key)
            pagination = 'cursor' if is_list and 'next_cursor' in props else 'page' if is_list and all(x in props for x in ['page','page_size','total']) else None
            catalog.append(dict(id=op['operationId'], api=api, resource=resource, label=title(op['operationId']),
                                description=op.get('description','').replace('\u2014',',').replace('\n',' '),
                                method=method.upper(), path=path, baseUrl=doc['servers'][0]['url'].rstrip('/'),
                                fields=fields, hasBody=bool(rb), bodyRequired=rb.get('required',False),
                                isList=is_list, arrayKey=array_key if is_list else None, pagination=pagination,
                                destructive=method=='delete', requestSchema=schema,
                                responseSchema=response_schema))

save('nodes/shared/catalog.json', [{k:v for k,v in op.items() if k not in ['requestSchema','responseSchema']} for op in catalog])
save('docs/operation-contracts.json',catalog)
table = ['# API coverage','', 'Generated from the pinned public OpenAPI files in `sources/`. The n8n package exposes 78 Data, Sequences and Tasks operations. The three Analytics operations are experimental and excluded from the package. List/search operations return individual records. No polling or webhook triggers are included.', '', '| API | Operation | Method | Path |','| --- | --- | --- | --- |']
for op in catalog:
    table.append('| ' + ' | '.join([op['api'],op['label'],op['method'],'`'+op['path']+'`'])+' |')
(ROOT/'docs/API-COVERAGE.md').write_text('\n'.join(table)+'\n')
print(f'Generated {len(catalog)} operation definitions')
