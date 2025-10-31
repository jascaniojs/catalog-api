import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiSuggestionService } from '../domain/ai-suggestion.interface';
import { SuggestionRequest } from '../domain/suggestion-request.vo';
import { SuggestionResponse } from '../domain/suggestion-response.vo';
import { AppConfig } from '@/shared/infrastructure/config/app.config';

@Injectable()
export class GeminiService implements IAiSuggestionService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenerativeAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const config = this.configService.get('gemini', { infer: true });

    if (!config.apiKey) {
      this.logger.warn(
        'Gemini API key not configured. AI suggestions will not work.',
      );
    }

    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
  }

  async getSuggestions(
    request: SuggestionRequest,
  ): Promise<SuggestionResponse> {
    this.logger.log(`Generating suggestions for title: "${request.title}"`);

    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      const systemPrompt = `You are a helpful assistant that improves catalog item titles and descriptions.
Your goal is to make them more descriptive, engaging, and SEO-friendly while maintaining accuracy.
Respond in JSON format with: {"suggestedTitle": "...", "suggestedDescription": "..."}`;

      const userPrompt = `Improve the following catalog item:

Title: ${request.title}
Description: ${request.description}

Provide:
1. A better, more descriptive title (12-50 characters)
2. An improved description (at least 60 characters, clear and engaging, not more than 140 characters)

Return only valid JSON.`;

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });

      const response = result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new InternalServerErrorException('Empty response from Gemini');
      }

      const parsed = JSON.parse(responseText);

      return SuggestionResponse.create(
        parsed.suggestedTitle || request.title,
        parsed.suggestedDescription || request.description,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get suggestions from Gemini: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to generate AI suggestions: ${error.message}`,
      );
    }
  }
}
