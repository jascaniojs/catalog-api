import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CatalogApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
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

    // Lambda Function (requires pre-built dist folder from webpack)
    const catalogFunction = new lambda.Function(this, 'CatalogFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('dist'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        DYNAMODB_TABLE_NAME: catalogTable.tableName,
        BEDROCK_REGION: this.region,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
      },
    });

    // Grant DynamoDB permissions to Lambda
    catalogTable.grantReadWriteData(catalogFunction);

    // Grant Bedrock permissions to Lambda
    catalogFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
        ],
      })
    );

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

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(catalogFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API Gateway routes
    const apiResource = api.root.addResource('api');
    const catalogResource = apiResource.addResource('catalog');

    // Add all HTTP methods to the catalog resource
    catalogResource.addMethod('GET', lambdaIntegration);
    catalogResource.addMethod('POST', lambdaIntegration);

    // Add proxy resource for sub-paths like /catalog/{id}
    const proxyResource = catalogResource.addResource('{proxy+}');
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

    new cdk.CfnOutput(this, 'DynamoDbTableName', {
      value: catalogTable.tableName,
      description: 'DynamoDB Table Name',
    });
  }
}