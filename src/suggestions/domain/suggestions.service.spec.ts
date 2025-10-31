import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { AI_SUGGESTION_SERVICE } from './ai-suggestion.interface';
import { CatalogService } from '../../catalog/domain/catalog.service';
import { SuggestionRequest } from './suggestion-request.vo';
import { SuggestionResponse } from './suggestion-response.vo';
import { CatalogItem } from '../../catalog/domain/catalog-item.entity';

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let aiService: any;
  let catalogService: jest.Mocked<CatalogService>;

  const mockAiService = {
    getSuggestions: jest.fn(),
  };

  const mockCatalogService = {
    getItemById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        {
          provide: AI_SUGGESTION_SERVICE,
          useValue: mockAiService,
        },
        {
          provide: CatalogService,
          useValue: mockCatalogService,
        },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
    aiService = module.get(AI_SUGGESTION_SERVICE);
    catalogService = module.get(CatalogService) as jest.Mocked<CatalogService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSuggestionsFromInput', () => {
    const title = 'Test Product';
    const description = 'This is a test description';
    const mockResponse = SuggestionResponse.create(
      'Enhanced Test Product',
      'This is an enhanced test description with more details',
    );

    it('should get suggestions for custom input', async () => {
      aiService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await service.getSuggestionsFromInput(title, description);

      expect(aiService.getSuggestions).toHaveBeenCalledTimes(1);
      expect(aiService.getSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          description,
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create SuggestionRequest with provided title and description', async () => {
      aiService.getSuggestions.mockResolvedValue(mockResponse);

      await service.getSuggestionsFromInput(title, description);

      const callArgs = aiService.getSuggestions.mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(SuggestionRequest);
      expect(callArgs.title).toBe(title);
      expect(callArgs.description).toBe(description);
    });

    it('should handle empty title', async () => {
      aiService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await service.getSuggestionsFromInput('', description);

      expect(aiService.getSuggestions).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty description', async () => {
      aiService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await service.getSuggestionsFromInput(title, '');

      expect(aiService.getSuggestions).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from AI service', async () => {
      const error = new Error('AI service unavailable');
      aiService.getSuggestions.mockRejectedValue(error);

      await expect(
        service.getSuggestionsFromInput(title, description),
      ).rejects.toThrow('AI service unavailable');
    });
  });

  describe('getSuggestionsForItem', () => {
    const itemId = 'test-item-id';
    const mockItem = new CatalogItem({
      id: itemId,
      title: 'Existing Product',
      description: 'Existing product description',
      category: 'Electronics',
      tags: ['test', 'product'],
    });
    const mockResponse = SuggestionResponse.create(
      'Enhanced Existing Product',
      'Enhanced existing product description with more details',
    );

    it('should get suggestions for existing catalog item', async () => {
      catalogService.getItemById.mockResolvedValue(mockItem);
      aiService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await service.getSuggestionsForItem(itemId);

      expect(catalogService.getItemById).toHaveBeenCalledWith(itemId);
      expect(aiService.getSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockItem.title,
          description: mockItem.description,
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create SuggestionRequest from catalog item', async () => {
      catalogService.getItemById.mockResolvedValue(mockItem);
      aiService.getSuggestions.mockResolvedValue(mockResponse);

      await service.getSuggestionsForItem(itemId);

      const callArgs = aiService.getSuggestions.mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(SuggestionRequest);
      expect(callArgs.title).toBe(mockItem.title);
      expect(callArgs.description).toBe(mockItem.description);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      catalogService.getItemById.mockRejectedValue(
        new NotFoundException(`Catalog item with ID ${itemId} not found`),
      );

      await expect(service.getSuggestionsForItem(itemId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getSuggestionsForItem(itemId)).rejects.toThrow(
        `Catalog item with ID ${itemId} not found`,
      );
      expect(aiService.getSuggestions).not.toHaveBeenCalled();
    });

    it('should propagate errors from catalog service', async () => {
      const error = new Error('Database connection error');
      catalogService.getItemById.mockRejectedValue(error);

      await expect(service.getSuggestionsForItem(itemId)).rejects.toThrow(
        'Database connection error',
      );
      expect(aiService.getSuggestions).not.toHaveBeenCalled();
    });

    it('should propagate errors from AI service', async () => {
      catalogService.getItemById.mockResolvedValue(mockItem);
      const error = new Error('AI service rate limit exceeded');
      aiService.getSuggestions.mockRejectedValue(error);

      await expect(service.getSuggestionsForItem(itemId)).rejects.toThrow(
        'AI service rate limit exceeded',
      );
    });

    it('should handle item with empty description', async () => {
      const itemWithEmptyDescription = new CatalogItem({
        id: itemId,
        title: 'Product Title Only',
        description: '',
      });
      catalogService.getItemById.mockResolvedValue(itemWithEmptyDescription);
      aiService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await service.getSuggestionsForItem(itemId);

      expect(aiService.getSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Product Title Only',
          description: '',
        }),
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
