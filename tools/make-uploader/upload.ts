import { Make, MakeError } from '@makehq/sdk';
import type { SDKModuleSectionType } from '@makehq/sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

type Module = { name: string; label: string; description: string; type: string };
const root = fileURLToPath(new URL('../../integrations/make/', import.meta.url));
const source = async (file: string) => readFile(resolve(root, file), 'utf8');
const remoteName = (name: string) => name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(await source('manifest.json')) as { modules: Module[] };
const sections: Array<[SDKModuleSectionType, string]> = [
  ['api', 'communication.json'], ['expect', 'parameters.json'], ['interface', 'interface.json'],
];

// Dry-run validates source without reading credentials or making network requests.
for (const module of manifest.modules) {
  for (const [, file] of sections) JSON.parse(await source(`modules/${module.name}/${file}`));
}
JSON.parse(await source('base.json'));
for (const file of ['communication.json', 'parameters.json']) {
  JSON.parse(await source(`connections/api-key/${file}`));
}
if (!process.argv.includes('--live')) {
  console.log(JSON.stringify({ mode: 'offline', modules: manifest.modules.length, componentFiles: 240 }));
} else {
  const { MAKE_API_KEY: token, MAKE_ZONE: zone, MAKE_APP_NAME: app, MAKE_CONNECTION_NAME: connection,
    MAKE_MODULE_TYPES_JSON: typeConfig, MAKE_UPLOAD_REPORT_DIR: reportDir } = process.env;
  if (!token || !zone || !app || !connection || !typeConfig || !reportDir) {
    throw new Error('Missing explicit upload target, scoped credential, verified type mapping, or report directory');
  }
  if (!/^(eu[12]|us[12])\.make\.com$/.test(zone) || !/^[a-z][a-z0-9-]+$/.test(app)) {
    throw new Error('Invalid Make target');
  }
  const types = JSON.parse(typeConfig) as Record<string, number>;
  if (manifest.modules.some(m => !Number.isInteger(types[m.type]))) throw new Error('Missing verified module type');
  const make = new Make(token, zone, { retry: { maxRetries: 0, onRateLimit: false, onServerError: false } });
  const version = 1;
  let step = 'inventory';
  try {
    const metadata = await make.sdk.apps.get(app, version);
    if (metadata.name !== app || metadata.version !== version || metadata.public !== false || metadata.label !== 'Unify') {
      throw new Error('Target is not the expected private Unify v1 app');
    }
    const connections = await make.sdk.connections.list(app);
    if (!connections.some(c => c.name === connection && c.type === 'basic')) throw new Error('Expected API-key connection missing');
    const existing = await make.sdk.modules.list(app, version);
    if (existing.some(m => !manifest.modules.some(local => remoteName(local.name) === m.name))) throw new Error('Unrecognized existing module; inspect before upload');
    await mkdir(reportDir, { recursive: true, mode: 0o700 });
    const report: { target: { app: string; zone: string; version: number }; completed: string[]; hashes: Record<string, string> } = {
      target: { app, zone, version }, completed: [], hashes: {},
    };
    const checkpoint = async (name: string, value: string) => {
      report.completed.push(name); report.hashes[name] = digest(value);
      await writeFile(resolve(reportDir, 'upload-progress.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
    };
    step = 'base';
    const base = await source('base.json');
    await make.sdk.apps.setSection(app, version, 'base', base);
    if (await make.sdk.apps.getSection(app, version, 'base') !== base) throw new Error('Base readback mismatch');
    await checkpoint('base', base);
    for (const [section, file] of [['api', 'communication.json'], ['parameters', 'parameters.json']] as const) {
      step = `connection/${section}`;
      const value = await source(`connections/api-key/${file}`);
      await make.sdk.connections.setSection(connection, section, value);
      if (await make.sdk.connections.getSection(connection, section) !== value) throw new Error('Connection readback mismatch');
      await checkpoint(step, value);
    }
    for (const module of manifest.modules) {
      const name = remoteName(module.name);
      if (!/^[a-zA-Z][0-9a-zA-Z]{2,47}$/.test(name)) throw new Error('Invalid Make module name');
      step = `${name}/metadata`;
      let saved = existing.find(m => m.name === name);
      if (!saved) saved = await make.sdk.modules.create(app, version, {
        name, label: module.label, description: module.description,
        typeId: types[module.type], moduleInitMode: 'blank',
      });
      if (saved.name !== name || saved.typeId !== types[module.type]) throw new Error('Module identity/type mismatch');
      await make.sdk.modules.update(app, version, name, { connection, label: module.label, description: module.description });
      for (const [section, file] of sections) {
        step = `${module.name}/${section}`;
        const value = await source(`modules/${module.name}/${file}`);
        await make.sdk.modules.setSection(app, version, name, section, value);
        if (await make.sdk.modules.getSection(app, version, name, section) !== value) throw new Error('Module readback mismatch');
        await checkpoint(step, value);
      }
      const full = await make.sdk.modules.get(app, version, name);
      if (full.connection !== connection || full.typeId !== types[module.type] || full.public !== false) throw new Error('Module binding/visibility mismatch');
      console.log(JSON.stringify({ verified: module.name }));
    }
    const finalModules = await make.sdk.modules.list(app, version);
    if (finalModules.length !== manifest.modules.length) throw new Error('Final component count mismatch');
    if ((await make.sdk.apps.get(app, version)).public !== false) throw new Error('App visibility changed');
    console.log(JSON.stringify({ uploadedAndReadBack: finalModules.length, private: true, providerCalls: 0 }));
  } catch (error) {
    // Do not print API response bodies or headers, which may include credentials.
    console.error(JSON.stringify({ failedStep: step, kind: error instanceof MakeError ? 'Make API error' : 'Validation error' }));
    process.exitCode = 1;
  }
}
