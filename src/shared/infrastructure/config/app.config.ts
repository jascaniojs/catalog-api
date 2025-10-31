export interface AppConfig {
  nodeEnv: string;
  port: number;
  aws: {
    region: string;
    dynamodb: {
      endpoint?: string;
      tableName: string;
      usersTableName: string;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  gemini: {
    apiKey: string;
    model: string;
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
      usersTableName: process.env.USERS_TABLE_NAME || 'catalog-users',
    },
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production-min-32-characters',
    expiresIn: process.env.JWT_EXPIRES_IN || '365d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  },
});
