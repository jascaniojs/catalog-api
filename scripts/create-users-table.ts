import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  CreateTableCommandInput,
} from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Configuration
const isLocal = process.env.NODE_ENV === 'development' || !!process.env.DYNAMODB_ENDPOINT;
const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
const region = process.env.AWS_REGION || 'us-east-1';
const tableName = process.env.USERS_TABLE_NAME || 'catalog-users';

interface ClientConfig {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

const clientConfig: ClientConfig = {
  region,
};

// For local development with DynamoDB Local, provide dummy credentials
if (endpoint) {
  clientConfig.endpoint = endpoint;
  clientConfig.credentials = {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  };
}

const client = new DynamoDBClient(clientConfig);

const tableSchema: CreateTableCommandInput = {
  TableName: tableName,
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'GSI1PK', AttributeType: 'S' },
    { AttributeName: 'GSI1SK', AttributeType: 'S' },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'RoleIndex',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createTable(): Promise<void> {
  try {
    console.log(`🔍 Checking DynamoDB connection (${isLocal ? 'LOCAL' : 'AWS'})...`);
    if (endpoint) {
      console.log(`   Endpoint: ${endpoint}`);
    }
    console.log(`   Region: ${region}`);

    await client.send(new ListTablesCommand({}));
    console.log('✅ DynamoDB connection successful');

    console.log(`\n🔍 Checking if table "${tableName}" exists...`);
    const exists = await tableExists(tableName);

    if (exists) {
      console.log(`✅ Table "${tableName}" already exists`);
      return;
    }

    console.log(`📋 Creating table "${tableName}"...`);
    await client.send(new CreateTableCommand(tableSchema));
    console.log(`✅ Table "${tableName}" created successfully`);

    console.log('\n📊 Table Schema:');
    console.log('   Primary Key: PK (String), SK (String)');
    console.log('   GSI: RoleIndex (GSI1PK, GSI1SK)');
    console.log('   - Use GSI1PK = "ROLE#ADMIN" to query by role');
    console.log('   - Use GSI1SK for sorting by user ID');
    console.log('\n🎯 Ready for users!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
      console.log('\n💡 If running locally, make sure DynamoDB Local is running:');
      console.log('   docker-compose up -d');
    }

    process.exit(1);
  }
}

console.log('🚀 Users Table Setup');
console.log('=====================');
createTable();
