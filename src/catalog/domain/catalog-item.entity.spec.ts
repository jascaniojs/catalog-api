import { CatalogItem, CatalogItemStatus, QualityScore } from './catalog-item.entity';

describe('CatalogItem', () => {
  describe('constructor', () => {
    it('should create a new catalog item with default values', () => {
      const item = new CatalogItem();

      expect(item.id).toBeDefined();
      expect(item.title).toBe('');
      expect(item.description).toBe('');
      expect(item.category).toBe('');
      expect(item.tags).toEqual([]);
      expect(item.status).toBe(CatalogItemStatus.DRAFT);
      expect(item.qualityScore).toBeUndefined();
      expect(item.createdAt).toBeInstanceOf(Date);
      expect(item.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a catalog item with provided data', () => {
      const data = {
        id: 'test-id-123',
        title: 'Test Product',
        description: 'Test description',
        category: 'Electronics',
        tags: ['tag1', 'tag2'],
        status: CatalogItemStatus.APPROVED,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const item = new CatalogItem(data);

      expect(item.id).toBe('test-id-123');
      expect(item.title).toBe('Test Product');
      expect(item.description).toBe('Test description');
      expect(item.category).toBe('Electronics');
      expect(item.tags).toEqual(['tag1', 'tag2']);
      expect(item.status).toBe(CatalogItemStatus.APPROVED);
      expect(item.createdAt).toEqual(new Date('2024-01-01'));
      expect(item.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('should generate a UUID for id when not provided', () => {
      const item = new CatalogItem();
      expect(item.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('updateContent', () => {
    it('should update item content and updatedAt timestamp', () => {
      const item = new CatalogItem({ title: 'Old Title' });
      const originalUpdatedAt = item.updatedAt;

      // Wait a tick to ensure timestamp changes
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      item.updateContent(
        'New Title',
        'New Description',
        'New Category',
        ['new-tag']
      );

      expect(item.title).toBe('New Title');
      expect(item.description).toBe('New Description');
      expect(item.category).toBe('New Category');
      expect(item.tags).toEqual(['new-tag']);
      expect(item.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('setQualityScore', () => {
    it('should set quality score and update timestamp', () => {
      const item = new CatalogItem();
      const score: QualityScore = {
        total: 85,
        breakdown: {
          base: 40,
          titleLength: 20,
          descriptionLength: 15,
          categoryProvided: 10,
          tagsProvided: 0,
          uniqueTitle: 0,
        },
      };

      const originalUpdatedAt = item.updatedAt;
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      item.setQualityScore(score);

      expect(item.qualityScore).toEqual(score);
      expect(item.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should auto-promote to PENDING_APPROVAL when score >= 70 and status is DRAFT', () => {
      const item = new CatalogItem({ status: CatalogItemStatus.DRAFT });
      const score: QualityScore = {
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

      item.setQualityScore(score);

      expect(item.status).toBe(CatalogItemStatus.PENDING_APPROVAL);
    });

    it('should not auto-promote when score < 70', () => {
      const item = new CatalogItem({ status: CatalogItemStatus.DRAFT });
      const score: QualityScore = {
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

      item.setQualityScore(score);

      expect(item.status).toBe(CatalogItemStatus.DRAFT);
    });

    it('should not auto-promote when status is not DRAFT', () => {
      const item = new CatalogItem({ status: CatalogItemStatus.APPROVED });
      const score: QualityScore = {
        total: 80,
        breakdown: {
          base: 40,
          titleLength: 20,
          descriptionLength: 15,
          categoryProvided: 0,
          tagsProvided: 0,
          uniqueTitle: 5,
        },
      };

      item.setQualityScore(score);

      expect(item.status).toBe(CatalogItemStatus.APPROVED);
    });
  });

  describe('canBeApproved', () => {
    it('should return true when quality score >= 70', () => {
      const item = new CatalogItem();
      item.qualityScore = {
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

      expect(item.canBeApproved()).toBe(true);
    });

    it('should return false when quality score < 70', () => {
      const item = new CatalogItem();
      item.qualityScore = {
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

      expect(item.canBeApproved()).toBe(false);
    });

    it('should return false when quality score is not set', () => {
      const item = new CatalogItem();

      expect(item.canBeApproved()).toBe(false);
    });
  });

  describe('markAsApproved', () => {
    it('should change status to APPROVED and update timestamp', () => {
      const item = new CatalogItem({ status: CatalogItemStatus.PENDING_APPROVAL });
      const originalUpdatedAt = item.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      item.markAsApproved();

      expect(item.status).toBe(CatalogItemStatus.APPROVED);
      expect(item.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('markAsRejected', () => {
    it('should change status to REJECTED and update timestamp', () => {
      const item = new CatalogItem({ status: CatalogItemStatus.PENDING_APPROVAL });
      const originalUpdatedAt = item.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      item.markAsRejected();

      expect(item.status).toBe(CatalogItemStatus.REJECTED);
      expect(item.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });
});
