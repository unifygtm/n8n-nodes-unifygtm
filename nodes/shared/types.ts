export interface Field {
	name: string;
	key: string;
	location: string;
	required: boolean;
	type: string;
	label: string;
	description: string;
	enum: (string | number)[] | null;
	minimum: number | null;
	maximum: number | null;
	format: string | null;
	nullable: boolean;
	jsonType: string | null;
	maxItems: number | null;
	minItems: number | null;
	default: unknown;
	explode: boolean;
}
export interface Operation {
	id: string;
	api: string;
	resource: string;
	label: string;
	description: string;
	method: string;
	path: string;
	baseUrl: string;
	fields: Field[];
	hasBody: boolean;
	bodyRequired: boolean;
	isList: boolean;
	arrayKey: string | null;
	pagination: string | null;
	destructive: boolean;
}
