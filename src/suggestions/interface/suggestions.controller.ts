import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SuggestionsService } from '../domain/suggestions.service';
import { CreateSuggestionDto } from './dtos/create-suggestion.dto';
import { SuggestionResponseDto } from './dtos/suggestion-response.dto';
import { JwtAuthGuard } from '../../auth/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/interface/guards/roles.guard';
import { Roles } from '../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/user-role.enum';

@Controller('suggestions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @Roles(UserRole.REGULAR, UserRole.ADMIN)
  async getSuggestions(
    @Body() createDto: CreateSuggestionDto,
  ): Promise<SuggestionResponseDto> {
    const response = await this.suggestionsService.getSuggestionsFromInput(
      createDto.title,
      createDto.description,
    );
    return SuggestionResponseDto.fromValueObject(response);
  }

  @Post(':id')
  @Roles(UserRole.REGULAR, UserRole.ADMIN)
  async getSuggestionsForItem(
    @Param('id') id: string,
  ): Promise<SuggestionResponseDto> {
    const response = await this.suggestionsService.getSuggestionsForItem(id);
    return SuggestionResponseDto.fromValueObject(response);
  }
}
