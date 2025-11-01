import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CatalogService } from '../domain/catalog.service';
import { CreateCatalogItemDto } from './dtos/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dtos/update-catalog-item.dto';
import { CatalogItemResponseDto } from './dtos/catalog-item-response.dto';
import { CatalogItemStatus } from '../domain/catalog-item.entity';
import { JwtAuthGuard } from '@/auth/interface/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/interface/guards/roles.guard';
import { Public } from '@/auth/interface/decorators/public.decorator';
import { Roles } from '@/auth/interface/decorators/roles.decorator';
import { UserRole } from '@/auth/domain/user-role.enum';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.REGULAR, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new catalog item' })
  @ApiResponse({
    status: 201,
    description: 'Catalog item successfully created',
    type: CatalogItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async create(
    @Body() createDto: CreateCatalogItemDto,
  ): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.createItem({
      title: createDto.title,
      description: createDto.description,
      category: createDto.category,
      tags: createDto.tags || [],
    });
    return CatalogItemResponseDto.fromEntity(item);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all catalog items with optional status filter' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CatalogItemStatus,
    description: 'Filter items by status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of catalog items',
    type: [CatalogItemResponseDto],
  })
  async findAll(
    @Query('status') status?: CatalogItemStatus,
  ): Promise<CatalogItemResponseDto[]> {
    const items = status
      ? await this.catalogService.getItemsByStatus(status)
      : await this.catalogService.getAllItems();

    return items.map((item) => CatalogItemResponseDto.fromEntity(item));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a catalog item by ID' })
  @ApiParam({ name: 'id', description: 'Catalog item ID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog item found',
    type: CatalogItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Catalog item not found' })
  async findById(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.getItemById(id);
    return CatalogItemResponseDto.fromEntity(item);
  }

  @Put(':id')
  @Roles(UserRole.REGULAR, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a catalog item' })
  @ApiParam({ name: 'id', description: 'Catalog item ID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog item successfully updated',
    type: CatalogItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Catalog item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCatalogItemDto,
  ): Promise<CatalogItemResponseDto> {
    const existingItem = await this.catalogService.getItemById(id);

    const item = await this.catalogService.updateItem(id, {
      title: updateDto.title ?? existingItem.title,
      description: updateDto.description ?? existingItem.description,
      category: updateDto.category ?? existingItem.category,
      tags: updateDto.tags ?? existingItem.tags,
    });

    return CatalogItemResponseDto.fromEntity(item);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a catalog item' })
  @ApiParam({ name: 'id', description: 'Catalog item ID' })
  @ApiResponse({ status: 204, description: 'Catalog item successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Catalog item not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.catalogService.deleteItem(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Approve a catalog item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Catalog item ID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog item approved',
    type: CatalogItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Item cannot be approved due to low quality score',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Catalog item not found' })
  async approve(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<Response> {
    const item = await this.catalogService.approveItem(id);
    if (item.status === CatalogItemStatus.APPROVED) {
      return response.json(CatalogItemResponseDto.fromEntity(item));
    }
    return response
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Item cannot be approved due to low quality score.' });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reject a catalog item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Catalog item ID' })
  @ApiResponse({
    status: 200,
    description: 'Catalog item rejected',
    type: CatalogItemResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Catalog item not found' })
  async reject(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.rejectItem(id);
    return CatalogItemResponseDto.fromEntity(item);
  }
}
