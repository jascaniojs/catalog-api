import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ConfigProps } from '../lib/config';
import { StackProps } from 'aws-cdk-lib';

type AwsEnvStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class CatalogApiStackV2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsEnvStackProps) {
    super(scope, id, props);
    const { config } = props;

    // ===================
    // SECRETS MANAGER
    // ===================

    // JWT Secret
    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: `${id}/jwt-secret`,
      description: 'JWT secret for catalog API authentication',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ secret: config.JWT_SECRET }),
        generateStringKey: 'generated',
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    // OpenAI API Key Secret
    const openaiSecret = new secretsmanager.Secret(this, 'OpenAISecret', {
      secretName: `${id}/openai-api-key`,
      description: 'OpenAI API key for catalog suggestions',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        config.OPENAI_API_KEY || 'placeholder-replace-after-deployment'
      ),
    });

    // Gemini API Key Secret
    const geminiSecret = new secretsmanager.Secret(this, 'GeminiSecret', {
      secretName: `${id}/gemini-api-key`,
      description: 'Google Gemini API key for catalog suggestions',
      secretStringValue: cdk.SecretValue.unsafePlainText(config.GEMINI_API_KEY || 'placeholder-replace-after-deployment'),
    });

    // ===================
    // DYNAMODB TABLES
    // ===================

    // Catalog Items Table
    const catalogTable = new dynamodb.Table(this, 'CatalogTable', {
      tableName: `${id}-catalog-items`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    } );

    // GSI for status queries
    catalogTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${id}-catalog-users`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    } );

    // GSI for role queries
    usersTable.addGlobalSecondaryIndex({
      indexName: 'RoleIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ===================
    // CLOUDWATCH LOGS
    // ===================

    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${id}-catalog-function`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/apigateway/${id}-catalog-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ===================
    // LAMBDA FUNCTION
    // ===================

    const catalogFunction = new lambda.Function(this, 'CatalogFunction', {
      functionName: `${id}-catalog-function`,
      runtime: lambda.Runtime.NODEJS_20_X, // Updated to Node 20
      architecture: lambda.Architecture.ARM_64, // ARM64 for cost savings
      handler: 'main.handler',
      code: lambda.Code.fromAsset('dist'),
      timeout: cdk.Duration.seconds(10), // Reduced from 30s for API optimization
      memorySize: 512,
      logGroup: lambdaLogGroup,
      environment: {
        NODE_ENV: config.NODE_ENV || 'production',
        DYNAMODB_TABLE_NAME: catalogTable.tableName,
        USERS_TABLE_NAME: usersTable.tableName,
        JWT_SECRET_ARN: jwtSecret.secretArn,
        OPENAI_SECRET_ARN: openaiSecret.secretArn,
        GEMINI_SECRET_ARN: geminiSecret.secretArn,
        JWT_EXPIRES_IN: config.JWT_EXPIRES_IN || '30d',
        OPENAI_MODEL: config.OPENAI_MODEL || 'gpt-4o-mini',
        GEMINI_MODEL: 'gemini-2.0-flash-exp',
      },
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });

    // Grant DynamoDB permissions
    catalogTable.grantReadWriteData(catalogFunction);
    usersTable.grantReadWriteData(catalogFunction);

    // Grant Secrets Manager permissions
    jwtSecret.grantRead(catalogFunction);
    openaiSecret.grantRead(catalogFunction);
    geminiSecret.grantRead(catalogFunction);

    // ===================
    // HTTP API (v2)
    // ===================

    const httpApi = new apigatewayv2.HttpApi(this, 'CatalogHttpApi', {
      apiName: `${id}-catalog-api`,
      description: 'Serverless catalog management system (HTTP API v2)',
      corsPreflight: {
        allowOrigins: ['*'], // Configure specific origins in production
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      catalogFunction
    );

    // Add default route with proxy
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // ===================
    // RATE LIMITING - HTTP API Throttling
    // ===================
    // Using built-in API Gateway throttling instead (account-level limits)

    const defaultStage = httpApi.defaultStage?.node.defaultChild as apigatewayv2.CfnStage;
    if (defaultStage) {
      // Configure throttling settings for HTTP API v2
      defaultStage.defaultRouteSettings = {
        throttlingBurstLimit: 200, // Maximum concurrent requests
        throttlingRateLimit: 100,  // Requests per second (account-wide)
      };

      // Enable detailed access logging
      defaultStage.accessLogSettings = {
        destinationArn: apiLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          integrationErrorMessage: '$context.integrationErrorMessage',
        }),
      };
    }

    // Grant API Gateway permission to write to CloudWatch Logs
    apiLogGroup.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    // ===================
    // OUTPUTS
    // ===================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url || 'N/A',
      description: 'HTTP API Gateway endpoint URL',
      exportName: `${id}-api-url`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: httpApi.apiId,
      description: 'HTTP API Gateway ID',
      exportName: `${id}-api-id`,
    });

    new cdk.CfnOutput(this, 'FunctionName', {
      value: catalogFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `${id}-function-name`,
    });

    new cdk.CfnOutput(this, 'FunctionArn', {
      value: catalogFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `${id}-function-arn`,
    });

    new cdk.CfnOutput(this, 'CatalogTableName', {
      value: catalogTable.tableName,
      description: 'Catalog DynamoDB Table Name',
      exportName: `${id}-catalog-table`,
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'Users DynamoDB Table Name',
      exportName: `${id}-users-table`,
    });

    new cdk.CfnOutput(this, 'JwtSecretArn', {
      value: jwtSecret.secretArn,
      description: 'JWT Secret ARN',
      exportName: `${id}-jwt-secret-arn`,
    });

    new cdk.CfnOutput(this, 'OpenAISecretArn', {
      value: openaiSecret.secretArn,
      description: 'OpenAI API Key Secret ARN',
      exportName: `${id}-openai-secret-arn`,
    });

    new cdk.CfnOutput(this, 'GeminiSecretArn', {
      value: geminiSecret.secretArn,
      description: 'Gemini API Key Secret ARN',
      exportName: `${id}-gemini-secret-arn`,
    });
  }
}
