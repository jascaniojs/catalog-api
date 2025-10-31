import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Pre-test validation to ensure Docker services are running
 * This runs before all e2e tests to validate the environment
 */
export default async function globalSetup() {
  console.log('\n🔍 Validating test environment...\n');

  try {
    // Check if Docker is running
    await execAsync('docker info');
    console.log('✅ Docker is running');
  } catch (error) {
    console.error('❌ Docker is not running');
    console.error('   Please start Docker and try again');
    process.exit(1);
  }

  try {
    // Check if DynamoDB Local container is running
    const { stdout } = await execAsync('docker ps --filter "name=dynamodb-local" --format "{{.Status}}"');

    if (!stdout.includes('Up')) {
      console.error('❌ DynamoDB Local container is not running');
      console.error('   Run: npm run db:start');
      process.exit(1);
    }
    console.log('✅ DynamoDB Local is running (localhost:8000)');
  } catch (error) {
    console.error('❌ Failed to check DynamoDB Local status');
    console.error('   Run: npm run db:start');
    process.exit(1);
  }

  try {
    // Check if DynamoDB Admin container is running
    const { stdout } = await execAsync('docker ps --filter "name=dynamodb-admin" --format "{{.Status}}"');

    if (!stdout.includes('Up')) {
      console.warn('⚠️  DynamoDB Admin container is not running (optional)');
      console.warn('   Run: docker-compose up -d dynamodb-admin');
    } else {
      console.log('✅ DynamoDB Admin is running (localhost:8001)');
    }
  } catch (error) {
    console.warn('⚠️  Could not check DynamoDB Admin status (optional)');
  }

  try {
    // Verify tables exist
    const { stdout: tablesOutput } = await execAsync(
      'aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1 2>/dev/null'
    );

    const tables = JSON.parse(tablesOutput);

    if (!tables.TableNames.includes('catalog-items')) {
      console.error('❌ catalog-items table not found');
      console.error('   Run: npm run db:create');
      process.exit(1);
    }
    console.log('✅ catalog-items table exists');

    if (!tables.TableNames.includes('catalog-users')) {
      console.error('❌ catalog-users table not found');
      console.error('   Run: npm run db:create:users');
      process.exit(1);
    }
    console.log('✅ catalog-users table exists');
  } catch (error) {
    console.error('❌ Failed to verify DynamoDB tables');
    console.error('   Error:', error.message);
    console.error('   Run: npm run db:start');
    process.exit(1);
  }

  try {
    // Check if users are seeded
    const { stdout: scanOutput } = await execAsync(
      'aws dynamodb scan --table-name catalog-users --endpoint-url http://localhost:8000 --region us-east-1 --max-items 1 2>/dev/null'
    );

    const scanResult = JSON.parse(scanOutput);

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.warn('⚠️  No users found in database');
      console.warn('   Run: npm run db:seed');
      console.warn('   Tests may fail without seeded users');
    } else {
      console.log('✅ Test users are seeded');
    }
  } catch (error) {
    console.warn('⚠️  Could not verify test users');
    console.warn('   Run: npm run db:seed');
  }

  console.log('\n✨ Environment validation complete!\n');
}
