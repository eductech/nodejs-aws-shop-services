import { APIGatewayEvent } from 'aws-lambda';
import { createResponse, query } from './utils';

const handler = async (event: APIGatewayEvent) => {
  try {
    console.log('>>> getProductById', event);

    const { productId } = event.pathParameters || {};
    if (!productId) return createResponse({ statusCode: 404, body: { message: 'product not found' }});

    const product = await query('id', productId, process.env.PRODUCT_TABLE_NAME!);
    if (!product) return createResponse({ statusCode: 404, body: { message: 'product not found' }});

    const stock = await query('product_id', productId, process.env.STOCK_TABLE_NAME!);

    return createResponse({ statusCode: 200, body: { ...product, count: stock?.count || 0 } });
  } catch (err: any) {
    return createResponse({ statusCode: 500, body: { message: err.message || '' }});
  }
}

export { handler };
