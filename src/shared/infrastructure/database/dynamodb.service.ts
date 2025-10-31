import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { AppConfig } from '../config/app.config';

@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    tableName?: string,
  ) {
    const config = this.configService.get('aws.dynamodb', { infer: true });

    const clientConfig: { region: string; endpoint?: string; credentials?: any } = {
      region: this.configService.get('aws.region', { infer: true }),
    };

    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
      clientConfig.credentials = {
        accessKeyId: 'fakeAccessKeyId',
        secretAccessKey: 'fakeSecretAccessKey',
      };
    }

    const dynamoClient = new DynamoDBClient(clientConfig);
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    // Use provided table name or default to catalog items table
    this.tableName = tableName || config.tableName;
  }

  async get<T = any>(key: Record<string, any>): Promise<T | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: key,
      }),
    );

    return (result.Item as T) || null;
  }

  async put<T = any>(item: T): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );
  }

  async update(
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues?: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
  ): Promise<any> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: 'ALL_NEW',
      }),
    );

    return result.Attributes;
  }

  async delete(key: Record<string, any>): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: key,
      }),
    );
  }

  async query<T = any>(
    keyConditionExpression: string,
    expressionAttributeValues?: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
    indexName?: string,
  ): Promise<T[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ...(indexName && { IndexName: indexName }),
      }),
    );

    return (result.Items as T[]) || [];
  }

  async scan<T = any>(
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
  ): Promise<T[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        ...(filterExpression && { FilterExpression: filterExpression }),
        ...(expressionAttributeValues && {
          ExpressionAttributeValues: expressionAttributeValues,
        }),
        ...(expressionAttributeNames && {
          ExpressionAttributeNames: expressionAttributeNames,
        }),
      }),
    );

    return (result.Items as T[]) || [];
  }

  getTableName(): string {
    return this.tableName;
  }
}
