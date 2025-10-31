const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} = require('@aws-sdk/client-dynamodb');

require('dotenv').config({ path: '.env' });


// Configuration
const isLocal = process.env.NODE_ENV === 'development' || process.env.DYNAMODB_ENDPOINT;
const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
const region = process.env.AWS_REGION || 'us-east-1';
const tableName = process.env.DYNAMODB_TABLE_NAME || 'catalog-items';

const clientConfig = {
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

const tableSchema = {
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
      IndexName: 'StatusIndex',
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

async function tableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createTable() {
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
    console.log('   GSI: StatusIndex (GSI1PK, GSI1SK)');
    console.log('   - Use GSI1PK = "STATUS#DRAFT" to query by status');
    console.log('   - Use GSI1SK for sorting by score and date');
    console.log('\n🎯 Ready for catalog items!');
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
      console.log('\n💡 If running locally, make sure DynamoDB Local is running:');
      console.log('   npx dynamodb-local');
      console.log('   or');
      console.log('   docker run -p 8000:8000 amazon/dynamodb-local');
    }

    process.exit(1);
  }
}

console.log('🚀 DynamoDB Table Setup');
console.log('=====================');
createTable();