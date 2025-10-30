const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-characters-long';
const JWT_EXPIRES_IN = '365d'; // Long-lived for testing

const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  };
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const users = [
  {
    email: 'admin@catalog.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  {
    email: 'user@catalog.com',
    name: 'Regular User',
    role: 'REGULAR',
  },
];

async function seedUsers() {
  console.log('🌱 Seeding users with pre-generated tokens...\n');

  const tokens = {};

  for (const user of users) {
    const userId = uuidv4();

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: userId,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE_NAME || 'catalog-users',
      Item: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        GSI1PK: `ROLE#${user.role}`,
        GSI1SK: `USER#${userId}`,
        EntityType: 'User',
        userId,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
        createdAt: new Date().toISOString(),
      },
    }));

    tokens[user.role] = token;
    console.log(`✅ Created ${user.role} user: ${user.email}`);
    console.log(`   User ID: ${userId}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔑 TEST TOKENS - Copy these to use in your requests:\n');
  console.log('ADMIN_TOKEN=' + tokens.ADMIN);
  console.log('\nUSER_TOKEN=' + tokens.REGULAR);
  console.log('='.repeat(80) + '\n');

  console.log('🎉 User seeding complete!\n');
  console.log('📝 Test with curl:');
  console.log('# Public endpoint (no token needed):');
  console.log('curl http://localhost:3000/api/catalog\n');
  console.log('# Create item (requires authentication):');
  console.log('curl -X POST http://localhost:3000/api/catalog \\');
  console.log('  -H "Authorization: Bearer $REGULAR_TOKEN" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"title":"Test","description":"A test description that is long enough","category":"Test","tags":["test"]}\'\n');
  console.log('# Admin-only endpoint:');
  console.log('curl -X DELETE http://localhost:3000/api/catalog/:id \\');
  console.log('  -H "Authorization: Bearer $ADMIN_TOKEN"');
}

seedUsers().catch(console.error);
