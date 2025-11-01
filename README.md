# Catalog API

Serverless catalog management system with AI-powered suggestions and quality scoring.

## Stack

- **Backend:** NestJS + AWS Lambda
- **Database:** DynamoDB
- **Infrastructure:** AWS CDK (TypeScript)
- **AI:** Google Gemini / OpenAI
- **Auth:** JWT with passport

## Project Structure

```
├── src/                    # Application code
├── infrastructure/         # AWS CDK stacks
├── scripts/               # Helper scripts (TypeScript)
├── test/                  # E2E tests
```


## Architecture

Domain-Driven Design organized by feature:

```
src/
├── auth/                   # Authentication & users
├── catalog/                # Catalog items & quality scoring
├── suggestions/            # AI-powered suggestions
└── shared/                 # Infrastructure & config
```

Each domain has:
- `domain/` - Business logic & entities
- `infrastructure/` - DynamoDB repositories
- `interface/` - REST controllers & DTOs

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for local DynamoDB)
- AWS CLI configured

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Add your API keys to .env.local
GEMINI_API_KEY=your-key-here
# or
OPENAI_API_KEY=your-key-here

# Start local DynamoDB and create tables
npm run db:start

# Seed test users
npm run db:seed

# Start dev server
npm run start:dev
```

API runs at http://localhost:3000

### Test Users

After seeding, tokens are saved in `users.json`:
- Admin: `admin@catalog.com`
- User: `user@catalog.com`

### Testing

```bash
npm test              # Unit tests
npm run test:cov      # Coverage report
npm run test:e2e      # Integration tests
```

## API Endpoints

### Catalog
- `GET /api/catalog` - List items
- `POST /api/catalog` - Create item (auth required)
- `GET /api/catalog/:id` - Get item
- `PATCH /api/catalog/:id` - Update item (auth required)
- `DELETE /api/catalog/:id` - Delete item (auth required)

### Approval (Admin only)
- `POST /api/catalog/:id/approve` - Approve item (requires score ≥70)
- `POST /api/catalog/:id/reject` - Reject item

### AI Suggestions
- `POST /api/suggestions` - Get suggestions for title/description
- `POST /api/suggestions/:itemId` - Get suggestions for existing item

**Authentication:** Endpoints marked "auth required" need JWT token in `Authorization: Bearer <token>` header. Get tokens from `users.json` after running `npm run db:seed`.

## Scripts

```bash
npm run db:start      # Start local DynamoDB
npm run db:stop       # Stop local DynamoDB
npm run db:seed       # Seed test users
npm run build         # Build application
npm run build:lambda  # Build for Lambda
npm run cdk:deploy    # Deploy to AWS
npm run cdk:destroy   # Remove AWS resources
```

## AWS Architecture

- **Lambda** (Node.js 20, ARM64) - Runs NestJS application
- **HTTP API Gateway v2** - REST endpoints (71% cheaper than REST API)
- **DynamoDB** - Two tables with single-table design:
    - `catalog-items` - Catalog data with StatusIndex GSI
    - `catalog-users` - User data with RoleIndex GSI
- **Secrets Manager** - Stores JWT secret and AI API keys
- **CloudWatch Logs** - Lambda and API Gateway logs (7-day retention)
- **X-Ray** - Distributed tracing enabled

**Traffic Flow:**
```
Client → HTTP API Gateway → Lambda (NestJS) → DynamoDB
                                            ↓
                                      Secrets Manager (JWT/AI keys)
```


## Deployment

### Build

```bash
npm run build:lambda
```

### Deploy to AWS

```bash
# Bootstrap CDK (first time only)
npm run cdk:bootstrap

# Deploy
npm run cdk:deploy
```

After deployment:

```bash
# Update secrets with real API keys
aws secretsmanager put-secret-value \
  --secret-id CatalogApiStackV2/openai-api-key \
  --secret-string "your-key"

# Seed users in AWS
# (see scripts/seed-users.ts, update .env.aws with table names)
```
