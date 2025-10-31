import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import {ConfigProps} from "../lib/config";
import {StackProps} from "aws-cdk-lib";

type AwsEnvStackProps = StackProps & {
    config: Readonly<ConfigProps>;
};


export class CatalogApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsEnvStackProps) {
    super(scope, id, props);
    const { config } = props;
    // Catalog DynamoDB Table
    const catalogTable = new dynamodb.Table(this, 'CatalogTable', {
      tableName: 'catalog-items',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // Global Secondary Index for status queries
    catalogTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Users DynamoDB Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'catalog-users',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // Global Secondary Index for role queries
    usersTable.addGlobalSecondaryIndex({
      indexName: 'RoleIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Lambda Function (requires pre-built dist folder from webpack)

      const LambdaEnv = {
          NODE_ENV: config.NODE_ENV || 'production',
          DYNAMODB_TABLE_NAME: catalogTable.tableName,
          DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,
          USERS_TABLE_NAME: usersTable.tableName,
          JWT_SECRET: config.JWT_SECRET ,
          JWT_EXPIRES_IN: '30d',
      };
      if(config.NODE_ENV === 'development' && config.DYNAMODB_ENDPOINT){
          LambdaEnv.DYNAMODB_ENDPOINT = config.DYNAMODB_ENDPOINT;
      }
    const catalogFunction = new lambda.Function(this, 'CatalogFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('dist'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: LambdaEnv,
    });

    // Grant DynamoDB permissions to Lambda
    catalogTable.grantReadWriteData(catalogFunction);
    usersTable.grantReadWriteData(catalogFunction);


    // API Gateway
    const api = new apigateway.RestApi(this, 'CatalogApi', {
      restApiName: 'Catalog API',
      description: 'Serverless catalog management system',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Lambda integration with proxy mode (passes all headers, body, etc.)
    const lambdaIntegration = new apigateway.LambdaIntegration(catalogFunction, {
      proxy: true,
    });
    // API Gateway routes - Use catch-all proxy for all paths
    // This allows NestJS to handle all routing internally
    const proxyResource = api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', lambdaIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'CatalogApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'CatalogFunctionName', {
      value: catalogFunction.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'CatalogTableName', {
      value: catalogTable.tableName,
      description: 'Catalog DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'Users DynamoDB Table Name',
    });
  }
}