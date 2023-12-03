import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, ScanCommand, TransactWriteItemsCommand, QueryCommand } from '@aws-sdk/client-dynamodb';

const REGION = 'eu-north-1';

const createResponse = ({
  statusCode,
  body,
  headers,
}: {
  statusCode: number;
  body: object;
  headers?: object;
}) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
  };
};

const dynamoDb = new DynamoDBClient({
  region: REGION,
});

const query = async (key: string, value: string, TableName: string) => {
  const result = await dynamoDb.send(new QueryCommand({
    TableName,
    KeyConditionExpression: `${key} = :id`,
    ExpressionAttributeValues: { ':id': { S: value } },
  }));
  return result.Items?.[0] ? unmarshall(result.Items[0]) : null;
}

const queryAll = async (tableName: string) => {
  const result = await dynamoDb.send(new ScanCommand({
    TableName: tableName,
  }));
  if (!result.Items) return null;
  return result.Items.map(el => unmarshall(el));
};

const createProduct = async (
  product: object,
  stock: object,
  productTableName: string,
  stockTableName: string,
) => {
  const command = new TransactWriteItemsCommand({
    TransactItems: [
      {
        Put: {
          TableName: productTableName,
          Item: marshall(product),
        }
      },
      {
        Put: {
          TableName: stockTableName,
          Item: marshall(stock),
        }
      }
    ] 
  });
  await dynamoDb.send(command);
  return { product, stock };
}

export { createResponse, query, queryAll, createProduct };
