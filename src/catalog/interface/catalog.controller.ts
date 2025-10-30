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
} from '@nestjs/common';
import { CatalogService } from '../domain/catalog.service';
import { CreateCatalogItemDto } from './dtos/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dtos/update-catalog-item.dto';
import { CatalogItemResponseDto } from './dtos/catalog-item-response.dto';
import { CatalogItemStatus } from '../domain/catalog-item.entity';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCatalogItemDto): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.createItem({
      title: createDto.title,
      description: createDto.description,
      category: createDto.category,
      tags: createDto.tags || [],
    });
    return CatalogItemResponseDto.fromEntity(item);
  }

  @Get()
  async findAll(@Query('status') status?: CatalogItemStatus): Promise<CatalogItemResponseDto[]> {
    const items = status
      ? await this.catalogService.getItemsByStatus(status)
      : await this.catalogService.getAllItems();

    return items.map(item => CatalogItemResponseDto.fromEntity(item));
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.getItemById(id);
    return CatalogItemResponseDto.fromEntity(item);
  }

  @Put(':id')
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
  async delete(@Param('id') id: string): Promise<void> {
    await this.catalogService.deleteItem(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.approveItem(id);
    return CatalogItemResponseDto.fromEntity(item);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.rejectItem(id);
    return CatalogItemResponseDto.fromEntity(item);
  }

}