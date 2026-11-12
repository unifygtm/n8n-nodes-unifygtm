import { isDeepStrictEqual } from 'node:util';
import { Make } from '@makehq/sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../integrations/make/release/', import.meta.url));
const source = (path:string) => readFile(resolve(root,path),'utf8');
const manifest = JSON.parse(await source('manifest.json'));
const remote = (name:string) => name.replace(/_([a-z])/g,(_,c:string)=>c.toUpperCase());
const sections = [['api','communication.json'],['expect','parameters.json'],['interface','interface.json']] as const;
for (const mod of manifest.modules) for (const [,file] of sections) JSON.parse(await source(`modules/${mod.name}/${file}`));
if (!process.argv.includes('--live')) {
  console.log(JSON.stringify({releaseModules:manifest.modules.length,rpcs:manifest.rpcs.length,mode:'offline'}));
} else {
  const app = 'unifygtm-qzxruy', version = 1, connection = app;
  const tokenPath = process.env.MAKE_TOKEN_FILE;
  const backupDir = process.env.MAKE_REVIEW_BACKUP_DIR;
  if (!tokenPath || !backupDir) throw new Error('Explicit credential file and backup directory required');
  const make = new Make((await readFile(tokenPath,'utf8')).trim(),'us2.make.com',{retry:{maxRetries:0}});
  let step = 'inventory';
  try {
    const metadata = await make.sdk.apps.get(app,version);
    if(metadata.label!=='Unify'||metadata.approved) throw new Error('Unexpected target or already approved');
    const existing=await make.sdk.modules.list(app,version);
    const prototypes=existing.filter(m=>!manifest.modules.some((local:{name:string})=>remote(local.name)===m.name));
    if(prototypes.some(m=>m.public)||![0,74].includes(prototypes.length)) throw new Error('Unexpected prototype inventory');
    await mkdir(backupDir,{recursive:true,mode:0o700});
    // Preserve every remote definition before archiving prototypes outside this release.
    // These contain source definitions, never resolved connection credentials.
    const backup:any={app:metadata,modules:[]};
    for(const mod of prototypes){
      step=`backup/${mod.name}`;
      const entry:any={metadata:mod,sections:{}};
      for(const [section] of sections) entry.sections[section]=await make.sdk.modules.getSection(app,version,mod.name,section);
      backup.modules.push(entry);
    }
    await writeFile(resolve(backupDir,'prototype-definitions.json'),JSON.stringify(backup,null,2),{mode:0o600});
    for(const section of ['base'] as const){
      step=section;const value=await source(`${section}.json`);
      await make.sdk.apps.setSection(app,version,section,value);
      if(await make.sdk.apps.getSection(app,version,section)!==value) throw new Error('Readback mismatch');
    }
    for(const [section,file] of [['api','communication.json'],['parameters','parameters.json']] as const){
      step=`connection/${section}`;const value=await source(`connections/api-key/${file}`);
      await make.sdk.connections.setSection(connection,section,value);
      if(await make.sdk.connections.getSection(connection,section)!==value) throw new Error('Readback mismatch');
    }
    const rpcs=await make.sdk.rpcs.list(app,version);
    for(const name of manifest.rpcs){
      step=`rpc/${name}`;
      if(!rpcs.some(r=>r.name===name)) await make.sdk.rpcs.create(app,version,{name,label:name==='listObjects'?'List objects':'List attributes'});
      await make.sdk.rpcs.update(app,version,name,{connection});
      for(const [section,file] of [['api','communication.json'],['parameters','parameters.json']] as const){
        const value=await source(`rpcs/${name}/${file}`);
        await make.sdk.rpcs.setSection(app,version,name,section,value);
        if(await make.sdk.rpcs.getSection(app,version,name,section)!==value) throw new Error('RPC readback mismatch');
      }
    }
    for(const mod of manifest.modules){
      const name=remote(mod.name);step=name;
      await make.sdk.modules.update(app,version,name,{label:mod.label,description:mod.description,connection});
      for(const [section,file] of sections){
        const value=await source(`modules/${mod.name}/${file}`);
        await make.sdk.modules.setSection(app,version,name,section,value);
        if(await make.sdk.modules.getSection(app,version,name,section)!==value) throw new Error('Readback mismatch');
      }
      console.log(JSON.stringify({verified:name}));
    }
    if(prototypes.some((m:any)=>!m.archived)) throw new Error('Archive prototype modules in the Make UI before finalizing this release');
    step='groups';const groupData=JSON.parse(await source('groups.json'));
    if(prototypes.length) groupData.push({label:'Archived prototypes',modules:prototypes.map(m=>m.name)});
    const groups=JSON.stringify(groupData,null,2);await make.sdk.apps.setSection(app,version,'groups',groups);
    if(!isDeepStrictEqual(JSON.parse(await make.sdk.apps.getSection(app,version,'groups')),JSON.parse(groups))) throw new Error('Groups readback mismatch');
    const final=await make.sdk.modules.list(app,version);
    if(final.filter((m:any)=>!m.archived).length!==5||final.filter((m:any)=>!m.archived).some(m=>!m.public)) throw new Error('Unexpected final visibility');
    console.log(JSON.stringify({releaseModules:final.filter((m:any)=>!m.archived).length,archivedPrototypeDefinitions:prototypes.length,providerCalls:0}));
  }catch(error:any){console.error(JSON.stringify({step,status:error.statusCode,message:error.statusCode?'Make API request failed':error.message}));process.exitCode=1;}
}
