import type { INodeProperties } from 'n8n-workflow';
import catalog from './catalog.json';
import type { Field, Operation } from './types';

export const operations = catalog as unknown as Operation[];

function fieldProperty(field: Field): INodeProperties {
	const property: INodeProperties = {
		displayName: field.label + (field.type === 'json' ? ' (JSON)' : ''),
		name: field.key,
		type:
			field.type === 'json'
				? 'json'
				: field.type === 'boolean'
					? 'boolean'
					: ['integer', 'number'].includes(field.type)
						? 'number'
						: 'string',
		default:
			(field.default as string) ??
			(field.type === 'boolean'
				? false
				: ['integer', 'number'].includes(field.type)
					? (field.minimum ?? 0)
					: field.type === 'json'
						? field.jsonType === 'array'
							? '[]'
							: '{}'
						: ''),
		required: field.required,
		description: field.description || `The ${field.label.toLowerCase()} for this operation`,
	};
	if (property.type === 'boolean')
		property.description = `Whether to ${property.description?.replace(/\.$/, '').toLowerCase()}`;
	if (property.type === 'number')
		property.typeOptions = {
			...(field.minimum !== null ? { minValue: field.minimum } : {}),
			...(field.maximum !== null ? { maxValue: field.maximum } : {}),
			...(field.type === 'integer' ? { numberPrecision: 0 } : {}),
		};
	if (field.enum?.length) {
		property.type = 'options';
		property.options = field.enum
			.map((value) => ({ name: String(value), value }))
			.sort((a, b) => a.name.localeCompare(b.name));
		property.default = (field.default as string) ?? field.enum[0];
	}
	return property;
}

export function buildProperties(analytics: boolean): INodeProperties[] {
	const selected = operations.filter((op) => (op.api === 'analytics') === analytics);
	const resources = [...new Set(selected.map((op) => op.resource))].sort();
	const properties: INodeProperties[] = [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: resources.map((resource) => ({ name: resource, value: resource })),
			default: 'Object Records',
		},
	];
	if (analytics) properties[0].default = 'Events';
	for (const resource of resources) {
		const ops = selected
			.filter((op) => op.resource === resource)
			.sort((a, b) => a.label.localeCompare(b.label));
		properties.push({
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resource] } },
			options: ops.map((op) => ({
				name: op.label,
				value: op.id,
				description: op.description.split('. ')[0],
				action: op.label.toLowerCase(),
			})),
			default: '',
		});
		properties[properties.length - 1].default = ops[0].id;
	}
	for (const op of selected) {
		const show = { resource: [op.resource], operation: [op.id] };
		if (
			op.destructive ||
			[
				'create_sequence_enrollment',
				'approve_sequence_enrollment',
				'resume_sequence',
				'resume_sequence_enrollment',
			].includes(op.id)
		) {
			properties.push({
				displayName: op.destructive
					? 'This operation deletes data in your Unify workspace.'
					: 'This operation can start or resume outreach in your Unify workspace.',
				name: 'operationNotice',
				type: 'notice',
				default: '',
				displayOptions: { show },
			});
		}
		const fields = op.fields.filter((f) => !(op.isList && ['limit', 'page_size'].includes(f.name)));
		for (const field of fields.filter((f) => f.required))
			properties.push({ ...fieldProperty(field), displayOptions: { show } });
		if (op.isList) {
			properties.push({
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: { show },
			});
			properties.push({
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: { show: { ...show, returnAll: [false] } },
			});
		}
		const optional = fields
			.filter((f) => !f.required)
			.map(fieldProperty)
			.sort((a, b) => a.displayName.localeCompare(b.displayName));
		if (optional.length)
			properties.push({
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show },
				options: optional,
			});
	}
	return properties;
}
