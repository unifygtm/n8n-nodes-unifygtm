import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { buildProperties } from '../shared/properties';
import { executeOperations } from '../shared/execute';

export class Unify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Unify',
		name: 'unify',
		icon: { light: 'file:unify.svg', dark: 'file:unify.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Work with Unify records, lists, sequences and tasks',
		defaults: { name: 'Unify' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'unifyApi', required: true }],
		properties: buildProperties(false),
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperations(this, false);
	}
}
