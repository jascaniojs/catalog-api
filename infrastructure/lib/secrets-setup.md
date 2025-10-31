# Secrets Manager Setup Guide

This guide explains how to set up AWS Secrets Manager secrets for the Catalog API v2 stack.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Deployment environment (dev, staging, prod)

## Secrets to Create

The stack creates placeholder secrets automatically, but you must update them with actual values after deployment.

### 1. JWT Secret

The JWT secret is auto-generated during deployment, but you can update it:

```bash
# Get the secret ARN from stack outputs
aws secretsmanager describe-secret --secret-id CatalogApiStackV2/jwt-secret

# Update if needed (optional - auto-generated is secure)
aws secretsmanager put-secret-value \
  --secret-id CatalogApiStackV2/jwt-secret \
  --secret-string '{"secret":"your-64-char-secret-here"}'
```

### 2. OpenAI API Key

**Required** - Replace placeholder after deployment:

```bash
# Get your OpenAI API key from https://platform.openai.com/api-keys

# Update the secret
aws secretsmanager put-secret-value \
  --secret-id CatalogApiStackV2/openai-api-key \
  --secret-string 'sk-proj-your-openai-api-key-here'
```

### 3. Gemini API Key

**Required** - Replace placeholder after deployment:

```bash
# Get your Gemini API key from https://aistudio.google.com/app/apikey

# Update the secret
aws secretsmanager put-secret-value \
  --secret-id CatalogApiStackV2/gemini-api-key \
  --secret-string 'your-gemini-api-key-here'
```

## Deployment Workflow

1. **Deploy the stack** (creates placeholder secrets):
   ```bash
   npm run cdk:deploy
   ```

2. **Update secrets with real values**:
   ```bash
   # Update OpenAI key
   aws secretsmanager put-secret-value \
     --secret-id CatalogApiStackV2/openai-api-key \
     --secret-string "$OPENAI_API_KEY"

   # Update Gemini key
   aws secretsmanager put-secret-value \
     --secret-id CatalogApiStackV2/gemini-api-key \
     --secret-string "$GEMINI_API_KEY"
   ```

3. **Verify secrets**:
   ```bash
   # List all secrets
   aws secretsmanager list-secrets \
     --query 'SecretList[?starts_with(Name, `CatalogApiStackV2`)].Name'

   # Test retrieval (OpenAI)
   aws secretsmanager get-secret-value \
     --secret-id CatalogApiStackV2/openai-api-key \
     --query 'SecretString' \
     --output text
   ```

4. **Restart Lambda** (to pick up new secrets):
   ```bash
   # Get function name from outputs
   aws lambda update-function-configuration \
     --function-name CatalogApiStackV2-catalog-function \
     --environment Variables={}  # Triggers restart
   ```

## Secret Rotation (Future Enhancement)

For production environments, consider enabling automatic secret rotation:

```bash
aws secretsmanager rotate-secret \
  --secret-id CatalogApiStackV2/jwt-secret \
  --rotation-lambda-arn <rotation-lambda-arn> \
  --rotation-rules AutomaticallyAfterDays=90
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use IAM policies** to restrict secret access
3. **Enable CloudTrail** to audit secret access
4. **Rotate secrets regularly** (especially JWT)
5. **Use different secrets** per environment (dev/staging/prod)

## Cost Considerations

- **Secrets Manager pricing**: $0.40/secret/month + $0.05 per 10,000 API calls
- **Total cost**: ~$1.20/month for 3 secrets + minimal API call costs

## Troubleshooting

### Lambda can't access secrets

Check IAM permissions:
```bash
aws lambda get-function-configuration \
  --function-name CatalogApiStackV2-catalog-function \
  --query 'Role'
```

Ensure the Lambda execution role has `secretsmanager:GetSecretValue` permission.

### Secret not found

Verify secret exists:
```bash
aws secretsmanager describe-secret --secret-id CatalogApiStackV2/openai-api-key
```

### Wrong AWS region

Secrets must be in the same region as Lambda:
```bash
aws secretsmanager list-secrets --region us-east-1
```
