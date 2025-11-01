import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SuggestionsService } from '../domain/suggestions.service';
import { CreateSuggestionDto } from './dtos/create-suggestion.dto';
import { SuggestionResponseDto } from './dtos/suggestion-response.dto';
import { JwtAuthGuard } from '@/auth/interface/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/interface/guards/roles.guard';
import { Roles } from '@/auth/interface/decorators/roles.decorator';
import { UserRole } from '@/auth/domain/user-role.enum';

@ApiTags('suggestions')
@Controller('suggestions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @Roles(UserRole.REGULAR, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get AI-powered suggestions for custom title and description',
  })
  @ApiResponse({
    status: 201,
    description: 'AI suggestions generated successfully',
    type: SuggestionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({
    status: 500,
    description: 'AI service error or API key not configured',
  })
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
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get AI-powered suggestions for an existing catalog item',
  })
  @ApiParam({ name: 'id', description: 'Catalog item ID' })
  @ApiResponse({
    status: 201,
    description: 'AI suggestions generated successfully for the catalog item',
    type: SuggestionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Catalog item not found' })
  @ApiResponse({
    status: 500,
    description: 'AI service error or API key not configured',
  })
  async getSuggestionsForItem(
    @Param('id') id: string,
  ): Promise<SuggestionResponseDto> {
    const response = await this.suggestionsService.getSuggestionsForItem(id);
    return SuggestionResponseDto.fromValueObject(response);
  }
}
