export interface AppConfig {
  nodeEnv: string;
  port: number;
  aws: {
    region: string;
    dynamodb: {
      endpoint?: string;
      tableName: string;
    };
    bedrock: {
      region: string;
      modelId: string;
    };
  };
}

export const appConfig = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    dynamodb: {
      endpoint: process.env.DYNAMODB_ENDPOINT,
      tableName: process.env.DYNAMODB_TABLE_NAME || 'catalog-items',
    },
    bedrock: {
      region: process.env.BEDROCK_REGION || 'us-east-1',
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
    },
  },
});