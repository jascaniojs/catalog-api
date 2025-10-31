export class SuggestionResponse {
  constructor(
    public readonly suggestedTitle: string,
    public readonly suggestedDescription: string,
  ) {}

  static create(
    suggestedTitle: string,
    suggestedDescription: string,
  ): SuggestionResponse {
    return new SuggestionResponse(suggestedTitle, suggestedDescription);
  }
}
