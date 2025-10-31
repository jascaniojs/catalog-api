export class SuggestionRequest {
  constructor(
    public readonly title: string,
    public readonly description: string,
  ) {}

  static create(title: string, description: string): SuggestionRequest {
    return new SuggestionRequest(title, description);
  }
}
