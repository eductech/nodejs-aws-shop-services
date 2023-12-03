import { createResponse } from '../utils';
import { NewImport } from '../schemas';
import { APIGatewayEvent } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './utils';

export const handler = async (
  event: APIGatewayEvent
) => {
  try {
    console.log('importProductsFile event', event);
    const { value, error } = NewImport.validate(event.queryStringParameters || {});
    if (error) return createResponse({ statusCode: 400, body: { message: error.message } });
    if (!value.name.endsWith('.csv')) return createResponse({ statusCode: 400, body: { message: 'wrong file extension' } });

    const objectKey = `uploaded/${value.name}`;
    const url = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
            Bucket: process.env.IMPORT_BUCKET_NAME!,
            Key: objectKey,
            ContentType: 'text/csv',
        }),
        { expiresIn: 24 * 60 }
    );

    return createResponse({ statusCode: 200, body: { url }});
  } catch (err: any) {
    console.log('importProductsFile error', err);
    return createResponse({ statusCode: 500, body: { message: err.message }});
  }
}