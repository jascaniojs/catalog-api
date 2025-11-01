import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-characters-long';
const JWT_EXPIRES_IN = '365d'; // Long-lived for testing

interface ClientConfig {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

const clientConfig: ClientConfig = {
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

interface SeedUser {
  email: string;
  name: string;
  role: 'ADMIN' | 'REGULAR';
}

interface UserRecord {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  EntityType: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  token: string;
  createdAt: string;
}

interface UserOutput {
  userId: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

const users: SeedUser[] = [
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

async function seedUsers(): Promise<void> {
  console.log('🌱 Seeding users with pre-generated tokens...\n');

  const tokens: Record<string, string> = {};
  const usersData: UserOutput[] = [];

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

    const record: UserRecord = {
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
    };

    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE_NAME || 'catalog-users',
      Item: record,
    }));

    tokens[user.role] = token;
    usersData.push({
      userId,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });

    console.log(`✅ Created ${user.role} user: ${user.email}`);
    console.log(`   User ID: ${userId}`);
  }

  // Save users with tokens to users.json
  const usersJsonPath = path.join(__dirname, '..', 'users.json');
  fs.writeFileSync(usersJsonPath, JSON.stringify(usersData, null, 2), 'utf8');
  console.log(`\n💾 Saved user credentials to: ${usersJsonPath}`);

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
