const { test } = require('node:test');
const assert = require('node:assert/strict');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const contracts = require('../docs/operation-contracts.json');
const { buildRequest } = require('../dist/nodes/shared/request');
const uuid = '00000000-0000-4000-8000-000000000001';

test('representative write bodies validate against actual OpenAPI schemas', () => {
	const cases = [
		['create_object_record', { pathObjectName: 'people', bodyData: { name: 'Example Person' } }],
		[
			'upsert_object_record',
			{
				pathObjectName: 'people',
				bodyMatch: { email: 'person@example.com' },
				bodyCreateOrUpdate: { name: 'Example Person' },
			},
		],
		[
			'create_sequence_enrollment',
			{ bodySequenceId: uuid, bodyPersonId: uuid, bodyMailboxEmails: ['sender@example.com'] },
		],
		[
			'create_task',
			{
				rawBodyRequestBody: {
					type: 'ACTION_ITEM',
					person_id: uuid,
					note_content: 'Review this example record',
				},
			},
		],
	];
	for (const [id, values] of cases) {
		const op = contracts.find((op) => op.id === id);
		const doc = require(`../sources/${op.api}-openapi.json`);
		const ajv = new Ajv({ strict: false });
		addFormats(ajv);
		ajv.addFormat('decimal', /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/);
		const validate = ajv.compile({ ...op.requestSchema, components: doc.components });
		assert.ok(validate(buildRequest(op, values).body), `${id}: ${JSON.stringify(validate.errors)}`);
	}
});

test('array bounds, repeated filters, false and explicit null survive mapping', () => {
	const enrollment = contracts.find((op) => op.id === 'create_sequence_enrollment');
	assert.throws(
		() =>
			buildRequest(enrollment, { bodySequenceId: uuid, bodyPersonId: uuid, bodyMailboxEmails: [] }),
		/at least 1/,
	);
	assert.throws(
		() =>
			buildRequest(enrollment, {
				bodySequenceId: uuid,
				bodyPersonId: uuid,
				bodyMailboxEmails: Array(11).fill('sender@example.com'),
			}),
		/exceeds 10/,
	);
	const list = contracts.find((op) => op.id === 'list_sequence_enrollments');
	const request = buildRequest(list, { queryStatus: ['PAUSED', 'ACTIVE'] });
	assert.deepEqual(request.qs.status, ['PAUSED', 'ACTIVE']);
	assert.equal(request.arrayFormat, 'repeat');
	const step = contracts.find((op) => op.id === 'retrieve_sequence_step');
	assert.equal(
		buildRequest(step, { pathId: uuid, pathStepId: uuid, queryIncludeDraft: false }).qs
			.include_draft,
		false,
	);
	const task = contracts.find((op) => op.id === 'update_task');
	assert.deepEqual(
		buildRequest(task, { pathId: uuid, rawBodyRequestBody: { due_at: null } }).body,
		{ due_at: null },
	);
});

test('Make component catalog is complete and keeps credentials on the Unify host', () => {
	const manifest = require('../integrations/make/manifest.json');
	const base = require('../integrations/make/base.json');
	assert.equal(manifest.modules.length, 79);
	assert.equal(base.baseUrl, 'https://api.unifygtm.com');
	assert.equal(base.followRedirects, false);
	assert.equal(base.followAllRedirects, false);
	for (const module of manifest.modules) {
		const dir = `../integrations/make/modules/${module.name}`;
		const comm = require(`${dir}/communication.json`);
		const params = require(`${dir}/parameters.json`);
		assert.ok(Array.isArray(require(`${dir}/interface.json`)));
		assert.ok(comm.url.startsWith('/') || comm.url.startsWith('https://api.unifygtm.com/'));
		if (module.type === 'search') {
			assert.ok(params.some((p) => p.name === 'limit'));
			assert.ok(comm.response.iterate);
			assert.ok(comm.response.limit);
		}
		assert.ok(!JSON.stringify(comm).includes('api.unifyintent.com'));
	}
});
