// noinspection TypeScriptValidateTypes

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface LoadedSecrets {
  jwtSecret?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
}

export class SecretsLoader {
  private static client: SecretsManagerClient | null = null;

  private static getClient(): SecretsManagerClient {
    if (!this.client) {
      const region = process.env.AWS_REGION || 'us-east-1';
      this.client = new SecretsManagerClient({ region });
    }
    return this.client;
  }

  static async loadSecrets(): Promise<LoadedSecrets> {
    const secrets: LoadedSecrets = {};

    // Skip Secrets Manager in local/test environments
    const isLocal =
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test' ||
      !process.env.JWT_SECRET_ARN;

    if (isLocal) {
      console.log(
        '[Config] Running in local/test mode - using environment variables only'
      );
      return secrets;
    }

    console.log('[Config] Loading secrets from AWS Secrets Manager...');

    try {
      await Promise.all([
        this.loadJwtSecret(secrets),
        this.loadOpenAISecret(secrets),
        this.loadGeminiSecret(secrets),
      ]);

      console.log('[Config] Secrets loaded successfully from AWS');
    } catch (error) {
      console.error(
        `[Config] Failed to load secrets: ${error.message}`,
        error.stack
      );
      throw error;
    }

    return secrets;
  }

  private static async loadJwtSecret(secrets: LoadedSecrets): Promise<void> {
    const arn = process.env.JWT_SECRET_ARN;
    if (!arn) return;

    try {
      const response = await this.getClient().send(
        new GetSecretValueCommand({ SecretId: arn })
      );

      if (response.SecretString) {
        const parsed = JSON.parse(response.SecretString);
        secrets.jwtSecret = parsed.secret || parsed.generated;
        console.log('[Config] ✓ JWT secret loaded');
      }
    } catch (error) {
      console.error(`[Config] ✗ Failed to load JWT secret: ${error.message}`);
      throw error;
    }
  }

  private static async loadOpenAISecret(secrets: LoadedSecrets): Promise<void> {
    const arn = process.env.OPENAI_SECRET_ARN;
    if (!arn) return;

    try {
      const response = await this.getClient().send(
        new GetSecretValueCommand({ SecretId: arn })
      );

      if (response.SecretString) {
        secrets.openaiApiKey = response.SecretString;
        console.log('[Config] ✓ OpenAI API key loaded');
      }
    } catch (error) {
      console.warn(
        `[Config] ⚠ Failed to load OpenAI secret: ${error.message}`
      );
      // Don't throw - OpenAI is optional
    }
  }

  private static async loadGeminiSecret(secrets: LoadedSecrets): Promise<void> {
    const arn = process.env.GEMINI_SECRET_ARN;
    if (!arn) return;

    try {
      const response = await this.getClient().send(
        new GetSecretValueCommand({ SecretId: arn })
      );

      if (response.SecretString) {
        secrets.geminiApiKey = response.SecretString;
        console.log('[Config] ✓ Gemini API key loaded');
      }
    } catch (error) {
      console.warn(
        `[Config] ⚠ Failed to load Gemini secret: ${error.message}`
      );
      // Don't throw - Gemini is optional
    }
  }
}
