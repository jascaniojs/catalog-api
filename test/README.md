# Integration Tests

## Overview

Integration tests for the Catalog API that use the **same local DynamoDB Docker container** as development.

## Prerequisites

### 1. Docker Services Running

The tests require the local DynamoDB services to be running via Docker Compose:

```bash
# Start Docker services (if not already running)
npm run db:start

# Verify services are running
docker-compose ps

# Expected output:
# NAME                COMMAND                  SERVICE             STATUS              PORTS
# dynamodb-admin      "tini node dist/dyna…"   dynamodb-admin      running             0.0.0.0:8001->8001/tcp
# dynamodb-local      "java -jar DynamoDBL…"   dynamodb-local      running             0.0.0.0:8000->8000/tcp
```

### 2. Test Users Seeded

The integration tests use the seeded admin and user accounts:

```bash
# Seed test users (if not already done)
npm run db:seed

# This creates users.json with JWT tokens
```

## Docker Configuration

The tests use the same `docker-compose.yml` configuration as development:

- **DynamoDB Local**: `localhost:8000` (amazon/dynamodb-local:latest)
- **DynamoDB Admin**: `localhost:8001` (aaronshaf/dynamodb-admin:latest)
- **Network**: `sam-local` bridge network
- **Mode**: Shared DB, in-memory

## Environment Configuration

Tests load environment variables from `.env.local`:

```bash
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_NAME=catalog-items
DYNAMODB_USERS_TABLE_NAME=catalog-users
AWS_REGION=us-east-1
```

## Running Integration Tests

```bash
# Run all integration tests
npm run test:e2e

# Run with verbose output
npm run test:e2e -- --verbose

# Run specific test file
npm run test:e2e -- catalog.e2e-spec

# Run in watch mode
npm run test:e2e -- --watch
```

## Test Data Cleanup

Each test has automatic cleanup:

```typescript
beforeEach(async () => {
  // Clean up catalog items before each test
  await cleanupCatalogItems();
});
```

This ensures tests are isolated and don't interfere with each other.

## Adding New Tests

When adding new integration tests:

1. Import required modules
2. Use the existing `adminToken` and `userToken` for authentication
3. Clean up test data in `beforeEach` or `afterEach`
4. Test both success and error cases
5. Verify authorization (admin vs user)
6. Check database state changes

Example:
```typescript
it('should do something', async () => {
  // Arrange
  const testData = { ... };

  // Act
  const response = await request(app.getHttpServer())
    .post('/api/catalog')
    .set('Authorization', `Bearer ${userToken}`)
    .send(testData)
    .expect(201);

  // Assert
  expect(response.body).toMatchObject({ ... });

  // Verify in database (optional)
  const dbItem = await dynamoClient.send(new GetCommand({ ... }));
  expect(dbItem.Item).toBeDefined();
});
```
