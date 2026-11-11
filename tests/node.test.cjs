const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildRequest } = require('../dist/nodes/shared/request');
const { executeOperations } = require('../dist/nodes/shared/execute');
const { operations, buildProperties } = require('../dist/nodes/shared/properties');
const { UnifyApi } = require('../dist/credentials/UnifyApi.credentials');
const { Unify } = require('../dist/nodes/Unify/Unify.node');
const specs = Object.fromEntries(
	['data', 'sequences', 'tasks'].map((api) => [api, require(`../sources/${api}-openapi.json`)]),
);
const shipped = operations.filter((op) => op.api !== 'analytics');
const get = (id) => shipped.find((op) => op.id === id);

function sample(field) {
	if (field.enum) return field.enum[0];
	if (field.type === 'json') return field.jsonType === 'array' ? ['test-id'] : { test: 'value' };
	if (field.type === 'boolean') return false;
	if (['integer', 'number'].includes(field.type)) return field.minimum ?? 1;
	if (field.format === 'date-time') return '2026-11-11T10:00:00Z';
	return 'test-id';
}
function run(id, pages, overrides = {}, fail = false, count = 1) {
	const op = get(id);
	const params = {
		resource: op.resource,
		operation: id,
		returnAll: true,
		additionalFields: {},
		...overrides,
	};
	for (const field of op.fields.filter((f) => f.required)) params[field.key] ??= sample(field);
	const requests = [];
	const context = {
		getInputData: () => Array.from({ length: count }, () => ({ json: {} })),
		getNodeParameter: (name, _index, fallback) => params[name] ?? fallback,
		getNode: () => ({
			name: 'Unify',
			type: 'n8n-nodes-unifygtm.unify',
			typeVersion: 1,
			parameters: {},
			position: [0, 0],
		}),
		continueOnFail: () => fail,
		helpers: {
			httpRequestWithAuthentication: async function (credential, request) {
				assert.equal(credential, 'unifyApi');
				requests.push(structuredClone(request));
				const response = pages.shift();
				if (response instanceof Error) throw response;
				return response;
			},
		},
	};
	return { result: executeOperations(context, false), requests };
}

test('all 78 shipped operations match the pinned OpenAPI methods, paths and fields', () => {
	assert.equal(shipped.length, 78);
	assert.equal(new Set(shipped.map((op) => op.id)).size, 78);
	for (const op of shipped) {
		const source = specs[op.api].paths[op.path][op.method.toLowerCase()];
		assert.equal(source.operationId, op.id);
		const values = Object.fromEntries(
			op.fields.filter((f) => f.required).map((f) => [f.key, sample(f)]),
		);
		if (op.id === 'upsert_object_record') values.bodyCreate = { name: 'Example' };
		const request = buildRequest(op, values);
		assert.equal(request.method, op.method);
		assert.equal(new URL(request.url).origin, 'https://api.unifygtm.com');
		assert.equal(request.disableFollowRedirect, true);
		assert.ok(!request.url.includes('{'));
		for (const param of source.parameters ?? []) {
			if (param.required && param.in !== 'header')
				assert.ok(op.fields.some((f) => f.name === param.name && f.required));
		}
	}
});

test('node metadata exposes only shipped operations with valid defaults', () => {
	const node = new Unify();
	assert.equal(node.description.credentials[0].name, 'unifyApi');
	const properties = buildProperties(false);
	const selectors = properties.filter((p) => p.name === 'operation');
	assert.equal(selectors.flatMap((p) => p.options).length, 78);
	for (const property of properties.filter((p) => ['resource', 'operation'].includes(p.name))) {
		assert.ok(property.options.some((option) => option.value === property.default));
	}
});

test('credentials use a masked API key and read-only authentication check', () => {
	const credential = new UnifyApi();
	assert.equal(credential.properties[0].typeOptions.password, true);
	assert.equal(credential.authenticate.properties.headers['X-Api-Key'], '={{$credentials.apiKey}}');
	assert.equal(credential.test.request.method, 'GET');
	assert.equal(credential.test.request.url, '/data/v1/objects');
});

test('resource defaults never select a write operation', () => {
	const selectors = buildProperties(false).filter((property) => property.name === 'operation');
	for (const selector of selectors) {
		assert.equal(get(selector.default).method, 'GET', selector.default);
	}
	const defaultFor = (resource) =>
		selectors.find((property) => property.displayOptions.show.resource[0] === resource).default;
	assert.equal(defaultFor('Sequences'), 'list_sequences');
	assert.equal(defaultFor('Tasks'), 'list_tasks');
	assert.equal(defaultFor('Objects'), 'list_objects');
});

test('encodes path identifiers and rejects relative traversal segments', () => {
	const op = get('get_object_record');
	const request = buildRequest(op, { pathObjectName: 'people', pathRecordId: 'a/b?x=1#frag' });
	assert.ok(request.url.endsWith('/a%2Fb%3Fx%3D1%23frag'));
	assert.throws(
		() => buildRequest(op, { pathObjectName: '..', pathRecordId: '1' }),
		/relative path/,
	);
});

test('validates JSON and required values before a request', () => {
	const op = get('create_object_record');
	assert.throws(() => buildRequest(op, { pathObjectName: 'people', bodyData: '{' }), /valid JSON/);
	assert.throws(
		() => buildRequest(op, { pathObjectName: 'people', bodyData: '[]' }),
		/JSON object/,
	);
	assert.throws(() => buildRequest(op, { pathObjectName: '', bodyData: '{}' }), /required/);
	const result = buildRequest(op, {
		pathObjectName: 'people',
		bodyData: '{"name":"Ada"}',
		queryValidationMode: 'strict',
	});
	assert.deepEqual(result.body, { data: { name: 'Ada' } });
});

test('upsert requires a match and a create-capable field', () => {
	const op = get('upsert_object_record');
	assert.throws(
		() => buildRequest(op, { pathObjectName: 'people', bodyMatch: { id: '1' } }),
		/Upsert requires/,
	);
	assert.throws(
		() => buildRequest(op, { pathObjectName: 'people', bodyMatch: {}, bodyCreate: {} }),
		/unique attribute/,
	);
	assert.deepEqual(
		buildRequest(op, {
			pathObjectName: 'people',
			bodyMatch: { email: 'a@example.com' },
			bodyCreateOrUpdate: { name: 'Ada' },
		}).body,
		{ match: { email: 'a@example.com' }, create_or_update: { name: 'Ada' } },
	);
});

test('cursor pagination preserves filters and emits individual linked items', async () => {
	const { result, requests } = run(
		'list_lists',
		[
			{ data: [{ id: 'a' }], next_cursor: 'second' },
			{ data: [{ id: 'b' }], next_cursor: null },
		],
		{ additionalFields: { queryName: 'Customers' } },
	);
	assert.deepEqual((await result)[0], [
		{ json: { id: 'a' }, pairedItem: { item: 0 } },
		{ json: { id: 'b' }, pairedItem: { item: 0 } },
	]);
	assert.equal(requests[1].qs.cursor, 'second');
	assert.equal(requests[1].qs.name, 'Customers');
});

test('limit is a total output cap, not a per-page cap', async () => {
	const { result, requests } = run(
		'list_lists',
		[
			{ data: [{ id: 1 }, { id: 2 }], next_cursor: 'next' },
			{ data: [{ id: 3 }, { id: 4 }], next_cursor: 'unused' },
		],
		{ returnAll: false, limit: 3 },
	);
	assert.equal((await result)[0].length, 3);
	assert.equal(requests.length, 2);
	assert.equal(requests[0].qs.limit, 3);
});

test('page-number pagination uses response metadata and retains query parameters', async () => {
	const { result, requests } = run('get_object_record_query_job_results', [
		{ data: [{ id: 1 }], total: 2, page: 1, page_size: 1 },
		{ data: [{ id: 2 }], total: 2, page: 2, page_size: 1 },
	]);
	assert.equal((await result)[0].length, 2);
	assert.equal(requests[1].qs.page, 2);
});

test('repeated cursors abort and discard partial output', async () => {
	const { result } = run(
		'list_lists',
		[
			{ data: [{ id: 1 }], next_cursor: 'same' },
			{ data: [{ id: 2 }], next_cursor: 'same' },
		],
		{},
		true,
	);
	const output = (await result)[0];
	assert.equal(output.length, 1);
	assert.match(output[0].json.error, /repeated a pagination cursor/);
});

test('malformed pagination and empty pages fail explicitly', async () => {
	await assert.rejects(run('list_lists', [{ data: [], next_cursor: 'more' }]).result, /empty page/);
	await assert.rejects(
		run('list_lists', [{ data: [{ id: 1 }] }]).result,
		/invalid pagination cursor/,
	);
	await assert.rejects(
		run('get_task_query_job_results', [{ data: [], page: 0, page_size: 10, total: 12 }]).result,
		/invalid result pagination/,
	);
});

test('mutation results preserve partial success details without retrying', async () => {
	const response = {
		data: [
			{ record_id: '1', status: 'SUCCESS' },
			{ record_id: '2', status: 'ERROR' },
		],
		summary: { success: 1, error: 1 },
	};
	const { result, requests } = run('add_list_entries', [response]);
	assert.deepEqual((await result)[0][0].json, response);
	assert.equal(requests.length, 1);
});

test('HTTP errors do not expose secret-bearing error details and writes are not retried', async () => {
	const error = Object.assign(new Error('secret-key-in-request'), {
		statusCode: 429,
		request: { headers: { 'X-Api-Key': 'secret-key-in-request' } },
	});
	const { result, requests } = run('create_list', [error], {}, true);
	const output = (await result)[0];
	assert.match(output[0].json.error, /too many requests|429/);
	assert.ok(!JSON.stringify(output).includes('secret-key-in-request'));
	assert.equal(requests.length, 1);
});

test('multiple input items retain item linkage and empty delete responses are valid', async () => {
	const { result } = run('delete_list', [undefined, undefined], {}, false, 2);
	assert.deepEqual((await result)[0], [
		{ json: { response: null }, pairedItem: { item: 0 } },
		{ json: { response: null }, pairedItem: { item: 1 } },
	]);
});
