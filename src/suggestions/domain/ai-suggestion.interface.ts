import { SuggestionRequest } from './suggestion-request.vo';
import { SuggestionResponse } from './suggestion-response.vo';

/**
 * AI Suggestion Service Interface
 *
 * This abstraction allows easy swapping between different AI providers
 * (OpenAI, Anthropic, Google, etc.) without changing business logic.
 */
export interface IAiSuggestionService {
  /**
   * Generate improved title and description suggestions based on input
   * @param request - The original title and description
   * @returns Suggested improvements with optional reasoning
   */
  getSuggestions(request: SuggestionRequest): Promise<SuggestionResponse>;
}

export const AI_SUGGESTION_SERVICE = Symbol('IAiSuggestionService');
