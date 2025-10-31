import { SuggestionResponse } from '../../domain/suggestion-response.vo';

export class SuggestionResponseDto {
  suggestedTitle: string;
  suggestedDescription: string;

  static fromValueObject(response: SuggestionResponse): SuggestionResponseDto {
    const dto = new SuggestionResponseDto();
    dto.suggestedTitle = response.suggestedTitle;
    dto.suggestedDescription = response.suggestedDescription;
    return dto;
  }
}
