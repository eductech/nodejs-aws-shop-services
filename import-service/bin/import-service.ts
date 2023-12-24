#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Cors } from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';

const BASE_URL = 'import';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'ImportServiceStack', {
  env: { region: 'eu-north-1' },
});

const bucket = new s3.Bucket(stack, 'ImportServiceBucket', {
  bucketName: 'import-service-bucket-eductech',
  cors: [
    {
      allowedHeaders: ['*'],
      allowedMethods: [
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.GET,
        s3.HttpMethods.DELETE,
        s3.HttpMethods.HEAD,
      ],
      allowedOrigins: ['*'],
    }
  ],
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
});

const catalogItemsQueue = sqs.Queue.fromQueueArn(stack, 'ProductQueue', process.env.CATALOG_ITEMS_QUEUE_ARN!);

const createLambda = (name: string, props: NodejsFunctionProps ) => new NodejsFunction(stack, name, {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    IMPORT_BUCKET_NAME: bucket.bucketName,
    CATALOG_ITEMS_QUEUE: catalogItemsQueue.queueUrl,
  },
  ...props,
});

const importProductsFile = createLambda('ImportProductsFileLambda', {
  entry: 'src/lambdas/importProductsFile.ts',
  functionName: 'importProductsFile',
});
bucket.grantReadWrite(importProductsFile);

const importFileParser = createLambda('ImportFileParserLambda', {
  entry: 'src/lambdas/importFileParser.ts',
  functionName: 'importFileParser',
});
bucket.grantReadWrite(importFileParser);
bucket.grantDelete(importFileParser);
catalogItemsQueue.grantSendMessages(importFileParser);

bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3notifications.LambdaDestination(importFileParser), {
  prefix: 'uploaded',
});

const api = new apiGateway.HttpApi(stack, 'ImportApiGateway', {
  corsPreflight: {
    allowHeaders: Cors.DEFAULT_HEADERS,
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
    allowOrigins: ['*'],
  },
});

const basicAuthorizer = lambda.Function.fromFunctionArn(stack, 'BasicAuthorizerLambda', process.env.AUTHORIZER_LAMBDA_ARN!);

const httpLambdaAuthorizer = new HttpLambdaAuthorizer('HttpLambdaAuthorizer', basicAuthorizer, {
  responseTypes: [HttpLambdaResponseType.IAM],
  resultsCacheTtl: cdk.Duration.seconds(0),
});

new lambda.CfnPermission(stack, 'LambdaAuthorizerPermission', {
  action: 'lambda:InvokeFunction',
  functionName: basicAuthorizer.functionName,
  principal: 'apigateway.amazonaws.com',
  sourceAccount: stack.account,
});

api.addRoutes({
  path: `/${BASE_URL}`,
  methods: [apiGateway.HttpMethod.GET],
  integration: new HttpLambdaIntegration('ImportProductsFileIntegration', importProductsFile),
  authorizer: httpLambdaAuthorizer,
});

new cdk.CfnOutput(stack, 'ApiGatewayUrl', {
  value: api.url || '',
});
