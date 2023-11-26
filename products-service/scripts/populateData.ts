import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { products, stocks } from '../src/lambdas/mocks';
import { REGION, PRODUCT_TABLE_NAME, STOCK_TABLE_NAME } from '../src/constants';

const client = new DynamoDBClient({
    region: REGION,
});

const addData = async (tableName: string, items: any[]) => {
    return client.send(new TransactWriteItemsCommand({
        TransactItems: items.map((item) => ({
            Put: {
                TableName: tableName,
                Item: marshall(item),
            },
        })),
    }));
};

const populate = async () => {
    console.log('>>> starting db population');
    try {
        await Promise.all([
            addData(PRODUCT_TABLE_NAME, products),
            addData(STOCK_TABLE_NAME, stocks),
        ]);
        console.log('>>> db population succeed');
    } catch (error) {
        console.log('>>> db population failed', error);
    }
};

populate();
