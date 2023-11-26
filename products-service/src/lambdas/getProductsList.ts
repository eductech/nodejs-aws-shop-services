import { APIGatewayEvent } from 'aws-lambda';
import { createResponse, queryAll } from './utils';

const handler = async (
  event: APIGatewayEvent
) => {
  try {
    console.log('>>> getProductsList', event);
    const [products, stocks] = await Promise.all([
      queryAll(process.env.PRODUCT_TABLE_NAME!),
      queryAll(process.env.STOCK_TABLE_NAME!)
    ]);
    const res = (products || []).map((product) => {
      const stock = (stocks || []).find((stock) => stock.product_id === product.id);
      return ({ ...product, count: (stock?.count || 0) });
    });
    return createResponse({ statusCode: 200, body: res });
  } catch (err: any) {
    return createResponse({ statusCode: 500, body: { message: err.message || '' }});
  }
}

export { handler };
