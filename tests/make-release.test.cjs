const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../integrations/make/release');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('manifest.json');
function fields(list){return list.flatMap(f=>[f,...fields(f.spec?.filter?f.spec:[]),...fields(f.options?.nested||[])]);}
test('Make release contains only the five approved-scope modules and all RPC references resolve',()=>{
 assert.deepEqual(manifest.modules.map(m=>m.name),['list_objects','get_object','list_object_attributes','get_object_attribute','make_api_call']);
 for(const mod of manifest.modules){
  const params=fields(read(`modules/${mod.name}/parameters.json`));
  for(const p of params){const ref=typeof p.options==='string'?p.options:p.options?.store;if(ref?.startsWith('rpc://'))assert.ok(manifest.rpcs.includes(ref.slice(6)));}
  const comm=read(`modules/${mod.name}/communication.json`);
  if(mod.name!=='make_api_call')assert.equal(comm.method,'GET');
 }
});
test('Make release sanitizes the exact lowercase authentication header on base and connection',()=>{
 for(const file of ['base.json','connections/api-key/communication.json']){
  const c=read(file);assert.ok(c.headers['x-api-key']);assert.ok(c.log.sanitize.includes('request.headers.x-api-key'));assert.match(c.response.error.message,/\[\{\{statusCode\}\}\].*ifempty\(body.message/);
 }
});
test('Get and list resources have identical typed interfaces including attribute variants',()=>{
 for(const [get,list] of [['get_object','list_objects'],['get_object_attribute','list_object_attributes']]){
  assert.deepEqual(read(`modules/${get}/interface.json`),read(`modules/${list}/interface.json`));
  assert.equal(read(`modules/${get}/communication.json`).response.output,'{{body.data}}');
  const all=fields(read(`modules/${get}/interface.json`));assert.ok(all.length>3);assert.ok(all.every(f=>f.type!=='any'));assert.ok(!all.some(f=>['result','data','status'].includes(f.name)));
 }
 const attr=read('modules/get_object_attribute/interface.json');
 for(const name of ['api_name','type','options','cardinality','related_object','related_attribute'])assert.ok(attr.some(f=>f.name===name));
});
test('Search defaults and RPC limits are bounded; universal supports mapped headers and query parameters',()=>{
 for(const name of ['list_objects','list_object_attributes']){const p=read(`modules/${name}/parameters.json`).find(f=>f.name==='limit');assert.equal(p.default,10);assert.equal(p.required,false);}
 for(const name of manifest.rpcs){const c=read(`rpcs/${name}/communication.json`);assert.equal(c.response.limit,100);assert.equal(c.method,'GET');}
 const c=read('modules/make_api_call/communication.json');assert.match(c.qs['{{...}}'],/toCollection/);assert.match(c.headers['{{...}}'],/toCollection/);assert.equal(c.headers['x-api-key'],'{{connection.apiKey}}');
 const p=read('modules/make_api_call/parameters.json').find(f=>f.name==='url');const re=new RegExp(p.validate.pattern);assert.ok(re.test('/data/v1/objects'));assert.ok(!re.test('https://example.com'));assert.ok(!re.test('//example.com'));
});
