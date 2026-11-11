import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { Field, Operation } from './types';

export function normalize(field: Field, value: unknown): unknown {
	if (value === undefined) {
		if (field.required) throw new Error(`${field.label} is required`);
		return undefined;
	}
	if (value === null && field.nullable) return null;
	let parsed = value;
	if (field.type === 'json' && typeof value === 'string') {
		let valid = true;
		try {
			parsed = JSON.parse(value);
		} catch {
			valid = false;
		}
		if (!valid) throw new Error(`${field.label} must contain valid JSON`);
	}
	if (field.type === 'json') {
		if (parsed === null || typeof parsed !== 'object')
			throw new Error(`${field.label} must be a JSON object or array`);
		if (field.jsonType === 'array' && !Array.isArray(parsed))
			throw new Error(`${field.label} must be a JSON array`);
		if (field.jsonType === 'object' && Array.isArray(parsed))
			throw new Error(`${field.label} must be a JSON object`);
		if (Array.isArray(parsed)) {
			if (field.maxItems !== null && parsed.length > field.maxItems)
				throw new Error(`${field.label} exceeds ${field.maxItems} items`);
			if (field.minItems !== null && parsed.length < field.minItems)
				throw new Error(`${field.label} needs at least ${field.minItems} items`);
		}
	} else if (['integer', 'number'].includes(field.type)) {
		if (
			typeof parsed !== 'number' ||
			!Number.isFinite(parsed) ||
			(field.type === 'integer' && !Number.isInteger(parsed))
		)
			throw new Error(`${field.label} must be a valid ${field.type}`);
		if (field.minimum !== null && parsed < field.minimum)
			throw new Error(`${field.label} must be at least ${field.minimum}`);
		if (field.maximum !== null && parsed > field.maximum)
			throw new Error(`${field.label} must be at most ${field.maximum}`);
	} else if (field.type === 'boolean') {
		if (typeof parsed !== 'boolean') throw new Error(`${field.label} must be a boolean`);
	} else if (typeof parsed !== 'string') throw new Error(`${field.label} must be a string`);
	if (field.enum && !field.enum.includes(parsed as string))
		throw new Error(`${field.label} is not an allowed option`);
	if (field.required && parsed === '') throw new Error(`${field.label} is required`);
	if (
		field.format === 'date-time' &&
		typeof parsed === 'string' &&
		!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(parsed)
	)
		throw new Error(`${field.label} must be an ISO 8601 timestamp with a timezone`);
	return parsed;
}

export function buildRequest(op: Operation, values: Record<string, unknown>): IHttpRequestOptions {
	let path = op.path;
	const qs: IDataObject = {};
	let body: IDataObject = {};
	for (const field of op.fields) {
		const value = normalize(field, values[field.key]);
		if (value === undefined) continue;
		if (field.location === 'path') {
			if (value === '.' || value === '..')
				throw new Error(`${field.label} cannot be a relative path segment`);
			path = path.replace(`{${field.name}}`, encodeURIComponent(String(value)));
		} else if (field.location === 'query') {
			qs[field.name] = (
				Array.isArray(value) && !field.explode ? value.join(',') : value
			) as IDataObject[string];
		} else if (field.location === 'rawBody') {
			if (Array.isArray(value) || value === null || typeof value !== 'object')
				throw new Error('Request Body must be a JSON object');
			body = value as IDataObject;
		} else body[field.name] = value as IDataObject[string];
	}
	if (op.id === 'upsert_object_record') {
		if (
			!['create', 'create_or_update', 'create_or_update_if_empty'].some(
				(key) => body[key] !== undefined,
			)
		)
			throw new Error('Upsert requires Create, Create Or Update, or Create Or Update If Empty');
		if (!body.match || Object.keys(body.match as object).length === 0)
			throw new Error('Match must include a unique attribute');
	}
	if (path.includes('{')) throw new Error('A required path parameter is missing');
	return {
		method: op.method as IHttpRequestOptions['method'],
		url: op.baseUrl + path,
		qs,
		...(op.hasBody ? { body } : {}),
		json: true,
		arrayFormat: 'repeat',
		timeout: 60000,
		disableFollowRedirect: true,
		headers: { Accept: 'application/json' },
	};
}

export function nextPage(
	op: Operation,
	response: IDataObject,
	request: IHttpRequestOptions,
	seen: Set<string>,
): boolean {
	if (op.pagination === 'cursor') {
		const cursor = response.next_cursor;
		if (cursor === null) return false;
		if (typeof cursor !== 'string' || !cursor)
			throw new Error('Unify returned an invalid pagination cursor');
		if (seen.has(cursor))
			throw new Error('Unify repeated a pagination cursor; stopped to prevent duplicate results');
		seen.add(cursor);
		request.qs = { ...request.qs, cursor };
		return true;
	}
	if (op.pagination === 'page') {
		const { page, page_size: pageSize, total } = response;
		if (
			![page, pageSize, total].every((x) => typeof x === 'number' && Number.isInteger(x)) ||
			Number(page) < 1 ||
			Number(pageSize) < 1 ||
			Number(total) < 0
		)
			throw new Error('Unify returned invalid result pagination metadata');
		if (Number(page) * Number(pageSize) >= Number(total)) return false;
		const marker = String(page);
		if (seen.has(marker)) throw new Error('Unify repeated a result page');
		seen.add(marker);
		request.qs = { ...request.qs, page: Number(page) + 1 };
		return true;
	}
	return false;
}
