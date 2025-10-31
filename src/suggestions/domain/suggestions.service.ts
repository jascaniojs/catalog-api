import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AI_SUGGESTION_SERVICE,
  IAiSuggestionService,
} from './ai-suggestion.interface';
import { SuggestionRequest } from './suggestion-request.vo';
import { SuggestionResponse } from './suggestion-response.vo';
import { CatalogService } from '../../catalog/domain/catalog.service';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    @Inject(AI_SUGGESTION_SERVICE)
    private readonly aiService: IAiSuggestionService,
    private readonly catalogService: CatalogService,
  ) {}

  async getSuggestionsFromInput(
    title: string,
    description: string,
  ): Promise<SuggestionResponse> {
    this.logger.log(`Getting suggestions for custom input: "${title}"`);

    const request = SuggestionRequest.create(title, description);
    return await this.aiService.getSuggestions(request);
  }

  async getSuggestionsForItem(itemId: string): Promise<SuggestionResponse> {
    this.logger.log(`Getting suggestions for catalog item: ${itemId}`);

    // This will throw NotFoundException if item doesn't exist
    const item = await this.catalogService.getItemById(itemId);

    const request = SuggestionRequest.create(item.title, item.description);
    return await this.aiService.getSuggestions(request);
  }
}
