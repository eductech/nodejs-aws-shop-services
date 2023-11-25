#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

const BASE_URL = 'products';
const REGION = 'eu-north-1';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'ProductsServiceStack', { env: { region: REGION } });

const createLambda = (name: string, props: NodejsFunctionProps ) => new NodejsFunction(stack, name, {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: REGION,
  },
  ...props,
})

const getProductsList = createLambda('GetProductsListLambda', {
  entry: 'src/lambdas/getProductsList.ts',
  functionName: 'getProductsList',
});

const getProductsById = createLambda('GetProductsByIdLambda', {
  entry: 'src/lambdas/getProductsById.ts',
  functionName: 'getProductsById',
});

const api = new apiGateway.HttpApi(stack, 'ProductsApiGateway', {
  corsPreflight: {
    allowHeaders: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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

new cdk.CfnOutput(stack, 'ApiGatewayUrl', {
  value: api.url || '',
});
