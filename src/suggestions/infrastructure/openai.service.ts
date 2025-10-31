import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAiSuggestionService } from '../domain/ai-suggestion.interface';
import { SuggestionRequest } from '../domain/suggestion-request.vo';
import { SuggestionResponse } from '../domain/suggestion-response.vo';
import { AppConfig } from '@/shared/infrastructure/config/app.config';

@Injectable()
export class OpenAiService implements IAiSuggestionService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const config = this.configService.get('openai', { infer: true });

    if (!config.apiKey) {
      this.logger.warn(
        'OpenAI API key not configured. AI suggestions will not work.',
      );
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model;
  }

  async getSuggestions(
    request: SuggestionRequest,
  ): Promise<SuggestionResponse> {
    this.logger.log(`Generating suggestions for title: "${request.title}"`);

    try {
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

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new InternalServerErrorException('Empty response from OpenAI');
      }

      const parsed = JSON.parse(responseContent);

      return SuggestionResponse.create(
        parsed.suggestedTitle || request.title,
        parsed.suggestedDescription || request.description,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get suggestions from OpenAI: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to generate AI suggestions: ${error.message}`,
      );
    }
  }
}
