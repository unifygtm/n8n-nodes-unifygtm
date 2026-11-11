import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class UnifyApi implements ICredentialType {
	name = 'unifyApi';
	displayName = 'Unify API';
	documentationUrl = 'https://docs.unifygtm.com/developers/api/data/overview';
	icon = 'file:../nodes/Unify/unify.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Create an API key in Unify Settings > Developers',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { 'X-Api-Key': '={{$credentials.apiKey}}' } },
	};
	test: ICredentialTestRequest = {
		request: { baseURL: 'https://api.unifygtm.com', url: '/data/v1/objects', method: 'GET' },
	};
}
