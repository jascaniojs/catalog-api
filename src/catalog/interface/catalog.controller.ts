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
import { Response } from 'express';
import { CatalogService } from '../domain/catalog.service';
import { CreateCatalogItemDto } from './dtos/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dtos/update-catalog-item.dto';
import { CatalogItemResponseDto } from './dtos/catalog-item-response.dto';
import { CatalogItemStatus } from '../domain/catalog-item.entity';
import { JwtAuthGuard } from '../../auth/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/interface/guards/roles.guard';
import { Public } from '../../auth/interface/decorators/public.decorator';
import { Roles } from '../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/user-role.enum';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.REGULAR, UserRole.ADMIN)
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
  async findById(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.getItemById(id);
    return CatalogItemResponseDto.fromEntity(item);
  }

  @Put(':id')
  @Roles(UserRole.REGULAR, UserRole.ADMIN)
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
  async delete(@Param('id') id: string): Promise<void> {
    await this.catalogService.deleteItem(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async approve(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<CatalogItemResponseDto | Response>   {
    const item = await this.catalogService.approveItem(id);
    if (item.status === CatalogItemStatus.APPROVED) {
      return CatalogItemResponseDto.fromEntity(item);
    }
    return response
      .status(HttpStatus.NOT_MODIFIED)
      .send({ message: 'Item cannot be approved due to low quality score.' });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async reject(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.rejectItem(id);
    return CatalogItemResponseDto.fromEntity(item);
  }
}
