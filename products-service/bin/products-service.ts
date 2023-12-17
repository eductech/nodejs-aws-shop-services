#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { BASE_URL, REGION, PRODUCT_TABLE_NAME, STOCK_TABLE_NAME } from '../src/constants';
import { Cors } from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'ProductsServiceStack', { env: { region: REGION } });

const productsTable = TableV2.fromTableName(stack, 'ProductsTable', PRODUCT_TABLE_NAME);
const stocksTable = TableV2.fromTableName(stack, 'StocksTable', STOCK_TABLE_NAME);

const createProductTopic = new sns.Topic(stack, 'CreateProductTopic', {
  topicName: 'create-product-topic'
});

new sns.Subscription(stack, 'CreateProductTopicEmailSubscription', {
  endpoint: process.env.EMAIL!,
  protocol: sns.SubscriptionProtocol.EMAIL,
  topic: createProductTopic,
  filterPolicy: {
    count: sns.SubscriptionFilter.numericFilter({
      greaterThan: 100,
    })
  }
});

new sns.Subscription(stack, 'CreateProductTopicFallbackEmailSubscription', {
  endpoint: process.env.FALLBACK_EMAIL!,
  protocol: sns.SubscriptionProtocol.EMAIL,
  topic: createProductTopic,
  filterPolicy: {
    count: sns.SubscriptionFilter.numericFilter({
      lessThanOrEqualTo: 100,
    }),
  },
});

const createLambda = (name: string, props: NodejsFunctionProps ) => new NodejsFunction(stack, name, {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_TABLE_NAME: productsTable.tableName,
    STOCK_TABLE_NAME: stocksTable.tableName,
    TOPIC_ARN: createProductTopic.topicArn,
  },
  ...props,
});

const getProductsList = createLambda('GetProductsListLambda', {
  entry: 'src/lambdas/getProductsList.ts',
  functionName: 'getProductsList',
});
productsTable.grantReadData(getProductsList);
stocksTable.grantReadData(getProductsList);

const getProductsById = createLambda('GetProductsByIdLambda', {
  entry: 'src/lambdas/getProductsById.ts',
  functionName: 'getProductsById',
});
productsTable.grantReadData(getProductsById);
stocksTable.grantReadData(getProductsById);

const createProduct = createLambda('CreateProductLambda', {
  entry: 'src/lambdas/createProduct.ts',
  functionName: 'createProduct',
});
productsTable.grantWriteData(createProduct);
stocksTable.grantWriteData(createProduct);

const api = new apiGateway.HttpApi(stack, 'ProductsApiGateway', {
  corsPreflight: {
    allowHeaders: Cors.DEFAULT_HEADERS,
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
    allowOrigins: ['*'],
  },
});

api.addRoutes({
  path: `/${BASE_URL}`,
  methods: [apiGateway.HttpMethod.GET],
  integration: new HttpLambdaIntegration('GetProductsListLambdaIntegration', getProductsList)
});

api.addRoutes({
  path: `/${BASE_URL}/{productId}`,
  methods: [apiGateway.HttpMethod.GET],
  integration: new HttpLambdaIntegration('GetProductsByIdIntegration', getProductsById),
});

api.addRoutes({
  path: `/${BASE_URL}`,
  methods: [apiGateway.HttpMethod.POST],
  integration: new HttpLambdaIntegration('CreateProductIntegration', createProduct)
});

const catalogBatchProcess = createLambda('CatalogBatchProcessLambda', {
  entry: 'src/lambdas/catalogBatchProcess.ts',
  functionName: 'catalogBatchProcess',
});
productsTable.grantWriteData(catalogBatchProcess);
stocksTable.grantWriteData(catalogBatchProcess);
createProductTopic.grantPublish(catalogBatchProcess);

const catalogItemsQueue = new sqs.Queue(stack, 'CatalogItemsQueue', {
  queueName: 'catalog-items-queue.fifo',
  fifo: true,
});

catalogBatchProcess.addEventSource(new SqsEventSource(catalogItemsQueue, {
  batchSize: 5,
}));

new cdk.CfnOutput(stack, 'ApiGatewayUrl', {
  value: api.url || '',
});
new cdk.CfnOutput(stack, 'CatalogItemsQueueArn', {
  value: catalogItemsQueue.queueArn,
});
