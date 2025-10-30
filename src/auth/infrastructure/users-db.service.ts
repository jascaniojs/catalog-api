import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { AppConfig } from '../../shared/infrastructure/config/app.config';

@Injectable()
export class UsersDbService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const config = this.configService.get('aws.dynamodb', { infer: true });

    const clientConfig: any = {
      region: this.configService.get('aws.region', { infer: true }),
    };

    // For local development with DynamoDB Local, provide dummy credentials
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
      clientConfig.credentials = {
        accessKeyId: 'fakeAccessKeyId',
        secretAccessKey: 'fakeSecretAccessKey',
      };
    }

    const dynamoClient = new DynamoDBClient(clientConfig);
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = config.usersTableName;
  }

  async get<T = any>(key: Record<string, any>): Promise<T | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: key,
    }));

    return result.Item as T || null;
  }

  async put<T = any>(item: T): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: item,
    }));
  }

  async scan<T = any>(
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
  ): Promise<T[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.tableName,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ...(expressionAttributeValues && { ExpressionAttributeValues: expressionAttributeValues }),
      ...(expressionAttributeNames && { ExpressionAttributeNames: expressionAttributeNames }),
    }));

    return result.Items as T[] || [];
  }

  getTableName(): string {
    return this.tableName;
  }
}
