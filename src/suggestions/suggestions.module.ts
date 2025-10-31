import { Module } from '@nestjs/common';
import { SuggestionsController } from './interface/suggestions.controller';
import { SuggestionsService } from './domain/suggestions.service';
import { OpenAiService } from './infrastructure/openai.service';
import { GeminiService } from './infrastructure/gemini.service';
import { AI_SUGGESTION_SERVICE } from './domain/ai-suggestion.interface';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [SuggestionsController],
  providers: [
    SuggestionsService,
    {
      provide: AI_SUGGESTION_SERVICE,
      useClass: GeminiService,
    },
  ],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
