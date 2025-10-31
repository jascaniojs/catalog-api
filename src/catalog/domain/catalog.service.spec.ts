import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogItemRepository } from '../infrastructure/catalog-item.repository';
import { QualityScoreService } from './quality-score.service';
import { CatalogItem, CatalogItemStatus } from './catalog-item.entity';

describe('CatalogService', () => {
  let service: CatalogService;
  let repository: jest.Mocked<CatalogItemRepository>;
  let qualityScoreService: jest.Mocked<QualityScoreService>;

  const mockRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByStatus: jest.fn(),
    existsByTitle: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockQualityScoreService = {
    calculateScore: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: CatalogItemRepository,
          useValue: mockRepository,
        },
        {
          provide: QualityScoreService,
          useValue: mockQualityScoreService,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    repository = module.get(CatalogItemRepository) as jest.Mocked<CatalogItemRepository>;
    qualityScoreService = module.get(QualityScoreService) as jest.Mocked<QualityScoreService>;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createItem', () => {
    const createData = {
      title: 'Test Product',
      description: 'This is a test description that is longer than sixty characters for scoring',
      category: 'Electronics',
      tags: ['test', 'product'],
    };

    const mockScore = {
      total: 85,
      breakdown: {
        base: 40,
        titleLength: 0,
        descriptionLength: 15,
        categoryProvided: 10,
        tagsProvided: 10,
        uniqueTitle: 5,
      },
    };

    it('should create a new catalog item with unique title', async () => {
      repository.existsByTitle.mockResolvedValue(false);
      qualityScoreService.calculateScore.mockReturnValue(mockScore);
      repository.save.mockImplementation(async (item) => item);

      const result = await service.createItem(createData);

      expect(repository.existsByTitle).toHaveBeenCalledWith(createData.title);
      expect(qualityScoreService.calculateScore).toHaveBeenCalledWith(
        createData.title,
        createData.description,
        createData.category,
        createData.tags,
        true, // isUniqueTitle
      );
      expect(result.title).toBe(createData.title);
      expect(result.description).toBe(createData.description);
      expect(result.category).toBe(createData.category);
      expect(result.tags).toEqual(createData.tags);
      expect(result.qualityScore).toEqual(mockScore);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create item with non-unique title', async () => {
      repository.existsByTitle.mockResolvedValue(true);
      qualityScoreService.calculateScore.mockReturnValue({
        ...mockScore,
        total: 80,
        breakdown: { ...mockScore.breakdown, uniqueTitle: 0 },
      });
      repository.save.mockImplementation(async (item) => item);

      await service.createItem(createData);

      expect(qualityScoreService.calculateScore).toHaveBeenCalledWith(
        createData.title,
        createData.description,
        createData.category,
        createData.tags,
        false, // isUniqueTitle = false
      );
    });

    it('should auto-promote to PENDING_APPROVAL when score >= 70', async () => {
      repository.existsByTitle.mockResolvedValue(false);
      qualityScoreService.calculateScore.mockReturnValue({ ...mockScore, total: 75 });
      repository.save.mockImplementation(async (item) => item);

      const result = await service.createItem(createData);

      expect(result.status).toBe(CatalogItemStatus.PENDING_APPROVAL);
    });

    it('should stay DRAFT when score < 70', async () => {
      repository.existsByTitle.mockResolvedValue(false);
      qualityScoreService.calculateScore.mockReturnValue({ ...mockScore, total: 65 });
      repository.save.mockImplementation(async (item) => item);

      const result = await service.createItem(createData);

      expect(result.status).toBe(CatalogItemStatus.DRAFT);
    });
  });

  describe('getItemById', () => {
    it('should return item when found', async () => {
      const mockItem = new CatalogItem({ id: 'test-id', title: 'Test' });
      repository.findById.mockResolvedValue(mockItem);

      const result = await service.getItemById('test-id');

      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getItemById('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getItemById('non-existent')).rejects.toThrow(
        'Catalog item with ID non-existent not found'
      );
    });
  });

  describe('getAllItems', () => {
    it('should return all items', async () => {
      const mockItems = [
        new CatalogItem({ id: '1', title: 'Item 1' }),
        new CatalogItem({ id: '2', title: 'Item 2' }),
      ];
      repository.findAll.mockResolvedValue(mockItems);

      const result = await service.getAllItems();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when no items exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.getAllItems();

      expect(result).toEqual([]);
    });
  });

  describe('getItemsByStatus', () => {
    it('should return items filtered by status', async () => {
      const mockItems = [
        new CatalogItem({ id: '1', status: CatalogItemStatus.APPROVED }),
        new CatalogItem({ id: '2', status: CatalogItemStatus.APPROVED }),
      ];
      repository.findByStatus.mockResolvedValue(mockItems);

      const result = await service.getItemsByStatus(CatalogItemStatus.APPROVED);

      expect(repository.findByStatus).toHaveBeenCalledWith(CatalogItemStatus.APPROVED);
      expect(result).toEqual(mockItems);
    });
  });

  describe('updateItem', () => {
    const existingItem = new CatalogItem({
      id: 'test-id',
      title: 'Old Title',
      description: 'Old description',
      category: 'Old category',
      tags: ['old'],
    });

    const updateData = {
      title: 'New Title',
      description: 'New description that is longer than sixty characters for scoring purposes',
      category: 'New category',
      tags: ['new', 'tags'],
    };

    const mockScore = {
      total: 80,
      breakdown: {
        base: 40,
        titleLength: 0,
        descriptionLength: 15,
        categoryProvided: 10,
        tagsProvided: 10,
        uniqueTitle: 5,
      },
    };

    it('should update item content and recalculate score', async () => {
      repository.findById.mockResolvedValue(existingItem);
      repository.existsByTitle.mockResolvedValue(false);
      qualityScoreService.calculateScore.mockReturnValue(mockScore);
      repository.update.mockImplementation(async (item) => item);

      const result = await service.updateItem('test-id', updateData);

      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(repository.existsByTitle).toHaveBeenCalledWith(updateData.title, 'test-id');
      expect(qualityScoreService.calculateScore).toHaveBeenCalledWith(
        updateData.title,
        updateData.description,
        updateData.category,
        updateData.tags,
        true,
      );
      expect(result.title).toBe(updateData.title);
      expect(result.description).toBe(updateData.description);
      expect(result.category).toBe(updateData.category);
      expect(result.tags).toEqual(updateData.tags);
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.updateItem('non-existent', updateData)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle non-unique title on update', async () => {
      repository.findById.mockResolvedValue(existingItem);
      repository.existsByTitle.mockResolvedValue(true);
      qualityScoreService.calculateScore.mockReturnValue({
        ...mockScore,
        breakdown: { ...mockScore.breakdown, uniqueTitle: 0 },
      });
      repository.update.mockImplementation(async (item) => item);

      await service.updateItem('test-id', updateData);

      expect(qualityScoreService.calculateScore).toHaveBeenCalledWith(
        updateData.title,
        updateData.description,
        updateData.category,
        updateData.tags,
        false, // isUniqueTitle = false
      );
    });
  });

  describe('deleteItem', () => {
    it('should delete existing item', async () => {
      const mockItem = new CatalogItem({ id: 'test-id' });
      repository.findById.mockResolvedValue(mockItem);
      repository.delete.mockResolvedValue(undefined);

      await service.deleteItem('test-id');

      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(repository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException when item does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deleteItem('non-existent')).rejects.toThrow(
        NotFoundException
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('approveItem', () => {
    it('should approve item when quality score >= 70', async () => {
      const mockItem = new CatalogItem({
        id: 'test-id',
        status: CatalogItemStatus.PENDING_APPROVAL,
      });
      mockItem.qualityScore = {
        total: 75,
        breakdown: {
          base: 40,
          titleLength: 20,
          descriptionLength: 15,
          categoryProvided: 0,
          tagsProvided: 0,
          uniqueTitle: 0,
        },
      };

      repository.findById.mockResolvedValue(mockItem);
      repository.update.mockImplementation(async (item) => item);

      const result = await service.approveItem('test-id');

      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(result.status).toBe(CatalogItemStatus.APPROVED);
      expect(repository.update).toHaveBeenCalled();
    });

    it('should not approve item when quality score < 70', async () => {
      const mockItem = new CatalogItem({
        id: 'test-id',
        status: CatalogItemStatus.PENDING_APPROVAL,
      });
      mockItem.qualityScore = {
        total: 65,
        breakdown: {
          base: 40,
          titleLength: 0,
          descriptionLength: 15,
          categoryProvided: 10,
          tagsProvided: 0,
          uniqueTitle: 0,
        },
      };

      repository.findById.mockResolvedValue(mockItem);

      const result = await service.approveItem('test-id');

      expect(result.status).toBe(CatalogItemStatus.PENDING_APPROVAL);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when item does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.approveItem('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('rejectItem', () => {
    it('should reject item', async () => {
      const mockItem = new CatalogItem({
        id: 'test-id',
        status: CatalogItemStatus.PENDING_APPROVAL,
      });

      repository.findById.mockResolvedValue(mockItem);
      repository.update.mockImplementation(async (item) => item);

      const result = await service.rejectItem('test-id');

      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(result.status).toBe(CatalogItemStatus.REJECTED);
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.rejectItem('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
