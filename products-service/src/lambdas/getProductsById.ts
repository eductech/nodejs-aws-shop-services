import { APIGatewayEvent } from 'aws-lambda';
import { products } from './mocks';
import { createResponse } from './utils';

const handler = async (event: APIGatewayEvent) => {
  try {
    const { productId } = event.pathParameters || {};
    if (!productId) return createResponse({ statusCode: 404, body: { message: 'product not found' }});

    const product = products.find(({ id }) => id === productId);
    if (!product) return createResponse({ statusCode: 404, body: { message: 'product not found' }});

    return createResponse({ statusCode: 200, body: product });
  } catch (err: any) {
    return createResponse({ statusCode: 500, body: { message: err.message || '' }});
  }
}

export { handler };
