import { SQSEvent } from 'aws-lambda';
import { parseRecord, createProduct } from '../utils';
import { REGION } from '../constants';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
    region: REGION,
});

export const handler = async (event: SQSEvent) => {
  console.log('>>> catalogBatchProcess', JSON.stringify(event));
  await Promise.all(event.Records.map(async (record) => {
    try {
        const [product, stock] = parseRecord(record);

        const createdProduct = await createProduct(
            product,
            stock,
            process.env.TABLE_NAME_PRODUCT!,
            process.env.TABLE_NAME_STOCK!
        );

        const res = await snsClient.send(new PublishCommand({
            TopicArn: process.env.TOPIC_ARN!,
            Message: JSON.stringify(createdProduct),
            Subject: 'New items imported',
        }));
        console.log('>>> catalogBatchProcess success', res);
      } catch (err) {
        console.log('>>> catalogBatchProcess error', err);
      }
  }));
};
