import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { operations } from './properties';
import { buildRequest, nextPage } from './request';

export async function executeOperations(
	context: IExecuteFunctions,
	analytics: boolean,
): Promise<INodeExecutionData[][]> {
	const output: INodeExecutionData[] = [];
	const credential = analytics ? 'unifyAnalyticsApi' : 'unifyApi';
	for (let itemIndex = 0; itemIndex < context.getInputData().length; itemIndex++) {
		try {
			const id = context.getNodeParameter('operation', itemIndex) as string;
			const resource = context.getNodeParameter('resource', itemIndex) as string;
			const op = operations.find(
				(candidate) =>
					candidate.id === id &&
					candidate.resource === resource &&
					(candidate.api === 'analytics') === analytics,
			);
			if (!op) throw new Error('Select a valid Unify resource and operation');
			const values: Record<string, unknown> = {
				...(context.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject),
			};
			for (const field of op.fields.filter((f) => f.required))
				values[field.key] = context.getNodeParameter(field.key, itemIndex);
			const returnAll =
				op.isList && (context.getNodeParameter('returnAll', itemIndex, false) as boolean);
			const limit =
				op.isList && !returnAll
					? (context.getNodeParameter('limit', itemIndex, 50) as number)
					: Infinity;
			if (op.isList && !returnAll && (!Number.isInteger(limit) || limit < 1))
				throw new Error('Limit must be a positive integer');
			const pageSizeField = op.fields.find((f) => ['limit', 'page_size'].includes(f.name));
			if (op.isList && pageSizeField)
				values[pageSizeField.key] = Math.min(pageSizeField.maximum ?? 100, 100, limit);
			const request = buildRequest(op, values);
			const seen = new Set<string>();
			if (typeof request.qs?.cursor === 'string') seen.add(request.qs.cursor);
			const staged: INodeExecutionData[] = [];
			for (let pageIndex = 0; ; pageIndex++) {
				if (pageIndex >= 1000)
					throw new Error(
						'Pagination exceeded 1,000 pages. Use the query job API or a narrower filter',
					);
				let response: IDataObject;
				try {
					response = (await context.helpers.httpRequestWithAuthentication.call(
						context,
						credential,
						request,
					)) as IDataObject;
				} catch (error) {
					const status = Number(error?.statusCode ?? error?.response?.status ?? error?.httpCode);
					const statusCode =
						Number.isInteger(status) && status >= 100 && status < 600 ? String(status) : undefined;
					const hint =
						status === 401
							? 'Check your Unify credential.'
							: status === 403
								? 'Check your workspace permissions.'
								: status === 429
									? 'Rate limit reached. Retry later.'
									: status === 409
										? 'The operation conflicts with the current resource state. For query results, check that the job has completed.'
										: 'Check the operation parameters and Unify API documentation.';
					// Do not retain the HTTP client error: it can contain request headers and secrets.
					throw new NodeApiError(
						context.getNode(),
						{
							message: `Unify request failed${statusCode ? ` (HTTP ${statusCode})` : ''}. ${hint}`,
						},
						{ itemIndex, httpCode: statusCode },
					);
				}
				if (!op.isList) {
					staged.push({
						json:
							response && typeof response === 'object' && !Array.isArray(response)
								? response
								: { response: response ?? null },
						pairedItem: { item: itemIndex },
					});
					break;
				}
				const rows = response?.[op.arrayKey!];
				if (!Array.isArray(rows))
					throw new Error(`Unify response did not contain the expected ${op.arrayKey} array`);
				for (const row of rows.slice(0, Math.max(0, limit - staged.length))) {
					staged.push({
						json:
							row && typeof row === 'object' && !Array.isArray(row)
								? (row as IDataObject)
								: { value: row },
						pairedItem: { item: itemIndex },
					});
				}
				if (staged.length >= limit || !nextPage(op, response, request, seen)) break;
				if (rows.length === 0)
					throw new Error(
						'Unify returned an empty page with more results; stopped to avoid losing records',
					);
			}
			output.push(...staged);
		} catch (error) {
			if (context.continueOnFail()) {
				output.push({ json: { error: (error as Error).message }, pairedItem: { item: itemIndex } });
				continue;
			}
			if (error instanceof NodeApiError)
				throw new NodeApiError(
					context.getNode(),
					{ message: error.message },
					{ itemIndex, httpCode: error.httpCode ?? undefined },
				);
			throw new NodeOperationError(context.getNode(), error as Error, { itemIndex });
		}
	}
	return [output];
}
