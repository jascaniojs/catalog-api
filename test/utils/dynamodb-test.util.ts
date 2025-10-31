import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Create a DynamoDB client configured for local testing
 * Uses the same Docker container as development
 */
export function createTestDynamoDBClient(): DynamoDBDocumentClient {
  const endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
  const region = process.env.AWS_REGION || 'us-east-1';

  const client = new DynamoDBClient({
    region,
    endpoint,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  });

  return DynamoDBDocumentClient.from(client);
}

/**
 * Clean up all items from a DynamoDB table
 * Useful for test isolation - ensures each test starts with a clean state
 */
export async function cleanupTable(
  client: DynamoDBDocumentClient,
  tableName: string,
): Promise<void> {
  try {
    const scanResult = await client.send(
      new ScanCommand({
        TableName: tableName,
      }),
    );

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await client.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              PK: item.PK,
              SK: item.SK,
            },
          }),
        );
      }
    }
  } catch (error) {
    console.error(`Error cleaning up table ${tableName}:`, error.message);
    throw error;
  }
}
