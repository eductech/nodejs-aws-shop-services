import { APIGatewayEvent } from 'aws-lambda';
import { createResponse } from './utils';
import { products } from './mocks';

const handler = async (
  event: APIGatewayEvent
) => {
  try {
    return createResponse({ statusCode: 200, body: products });
  } catch (err: any) {
    return createResponse({ statusCode: 500, body: { message: err.message || '' }});
  }
}

export { handler };
