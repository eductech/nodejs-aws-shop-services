#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const processEnv = {};
dotenv.config({ processEnv });

const app = new cdk.App();

const stack = new cdk.Stack(app, "AuthorizationServiceStack", {
  env: { region: 'eu-north-1' },
});

const basicAuthorizer = new NodejsFunction(stack, 'BasicAuthorizerLambda', {
  entry: 'src/lambdas/basicAuthorizer.ts',
  functionName: 'basicAuthorizer',
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: processEnv,
});

new cdk.CfnOutput(stack, 'basicAuthorizerArn', {
  value: basicAuthorizer.functionArn,
});
