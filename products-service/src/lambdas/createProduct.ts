import { APIGatewayEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { NewProduct } from '../schemas';
import { createProduct, createResponse } from './utils';

export const handler = async (event: APIGatewayEvent) => {
  try {
    console.log('>>> createProduct', event);
    const body = event.body ? JSON.parse(event.body) : {};
    const { value, error } = NewProduct.validate(body);
    if (error) return createResponse({ statusCode: 400, body: { message: error.message } });
    
    const { title, description, price, count } = value;
    const id = randomUUID();
    const result = await createProduct(
      {
        id,
        title,
        description,
        price,
      },
      {
        product_id: id,
        count,
      },
      process.env.PRODUCT_TABLE_NAME!,
      process.env.STOCK_TABLE_NAME!,
    );

    return createResponse({ statusCode: 200, body: result });
  } catch (err: any) {
    return createResponse({ statusCode: 500, body: { message: err.message || '' }});
  }
}