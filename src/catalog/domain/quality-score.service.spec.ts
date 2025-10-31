import { Test, TestingModule } from '@nestjs/testing';
import { QualityScoreService } from './quality-score.service';

describe('QualityScoreService', () => {
  let service: QualityScoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QualityScoreService],
    }).compile();

    service = module.get<QualityScoreService>(QualityScoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateScore', () => {
    it('should return base score of 40 for minimal input', () => {
      const score = service.calculateScore('', '', '', [], false);

      expect(score.breakdown.base).toBe(40);
      expect(score.total).toBe(40);
    });

    it('should give 20 points for title length between 12-50 characters', () => {
      const goodTitle = 'Valid Title 123'; // 16 characters
      const score = service.calculateScore(goodTitle, '', '', [], false);

      expect(score.breakdown.titleLength).toBe(20);
    });

    it('should give 0 points for title less than 12 characters', () => {
      const shortTitle = 'Short'; // 5 characters
      const score = service.calculateScore(shortTitle, '', '', [], false);

      expect(score.breakdown.titleLength).toBe(0);
    });

    it('should give 0 points for title more than 50 characters', () => {
      const longTitle = 'This is a very long title that exceeds fifty characters'; // 56 characters
      const score = service.calculateScore(longTitle, '', '', [], false);

      expect(score.breakdown.titleLength).toBe(0);
    });

    it('should give 20 points for exactly 12 character title', () => {
      const title = 'Exactly 12!!'; // Exactly 12 characters
      const score = service.calculateScore(title, '', '', [], false);

      expect(score.breakdown.titleLength).toBe(20);
    });

    it('should give 20 points for exactly 50 character title', () => {
      const title = 'This title is exactly fifty characters in total!'; // Exactly 50 characters
      const score = service.calculateScore(title, '', '', [], false);

      expect(score.breakdown.titleLength).toBe(20);
    });

    it('should give 15 points for description >= 60 characters', () => {
      const longDescription = 'This is a detailed description that is longer than sixty characters for scoring purposes';
      const score = service.calculateScore('', longDescription, '', [], false);

      expect(score.breakdown.descriptionLength).toBe(15);
    });

    it('should give 0 points for description < 60 characters', () => {
      const shortDescription = 'Short description';
      const score = service.calculateScore('', shortDescription, '', [], false);

      expect(score.breakdown.descriptionLength).toBe(0);
    });

    it('should give 15 points for exactly 60 character description', () => {
      const description = 'This is exactly sixty characters long for the description!!!'; // Exactly 60
      const score = service.calculateScore('', description, '', [], false);

      expect(score.breakdown.descriptionLength).toBe(15);
    });

    it('should give 10 points when category is provided', () => {
      const score = service.calculateScore('', '', 'Electronics', [], false);

      expect(score.breakdown.categoryProvided).toBe(10);
    });

    it('should give 0 points when category is empty', () => {
      const score = service.calculateScore('', '', '', [], false);

      expect(score.breakdown.categoryProvided).toBe(0);
    });

    it('should give 10 points for 1 tag', () => {
      const score = service.calculateScore('', '', '', ['tag1'], false);

      expect(score.breakdown.tagsProvided).toBe(10);
    });

    it('should give 10 points for 2 tags', () => {
      const score = service.calculateScore('', '', '', ['tag1', 'tag2'], false);

      expect(score.breakdown.tagsProvided).toBe(10);
    });

    it('should give 10 points for 3 tags', () => {
      const score = service.calculateScore('', '', '', ['tag1', 'tag2', 'tag3'], false);

      expect(score.breakdown.tagsProvided).toBe(10);
    });

    it('should give 20 points for more than 3 tags', () => {
      const score = service.calculateScore('', '', '', ['tag1', 'tag2', 'tag3', 'tag4'], false);

      expect(score.breakdown.tagsProvided).toBe(20);
    });

    it('should give 0 points for no tags', () => {
      const score = service.calculateScore('', '', '', [], false);

      expect(score.breakdown.tagsProvided).toBe(0);
    });

    it('should give 5 points for unique title', () => {
      const score = service.calculateScore('', '', '', [], true);

      expect(score.breakdown.uniqueTitle).toBe(5);
    });

    it('should give 0 points for non-unique title', () => {
      const score = service.calculateScore('', '', '', [], false);

      expect(score.breakdown.uniqueTitle).toBe(0);
    });

    it('should calculate total score correctly - perfect score scenario', () => {
      const score = service.calculateScore(
        'Perfect Title Here', // 18 chars - 20 points
        'This is a very detailed and comprehensive description that is definitely longer than sixty characters required', // 15 points
        'Electronics', // 10 points
        ['tag1', 'tag2', 'tag3', 'tag4'], // 20 points (>3 tags)
        true, // 5 points (unique)
      );

      expect(score.breakdown).toEqual({
        base: 40,
        titleLength: 20,
        descriptionLength: 15,
        categoryProvided: 10,
        tagsProvided: 20,
        uniqueTitle: 5,
      });
      expect(score.total).toBe(110); // 40 + 20 + 15 + 10 + 20 + 5
    });

    it('should calculate total score correctly - minimal score scenario', () => {
      const score = service.calculateScore(
        '', // No title - 0 points
        '', // No description - 0 points
        '', // No category - 0 points
        [], // No tags - 0 points
        false, // Not unique - 0 points
      );

      expect(score.breakdown).toEqual({
        base: 40,
        titleLength: 0,
        descriptionLength: 0,
        categoryProvided: 0,
        tagsProvided: 0,
        uniqueTitle: 0,
      });
      expect(score.total).toBe(40); // Only base score
    });

    it('should calculate score for approval threshold (70 points)', () => {
      const score = service.calculateScore(
        'Good Title Here', // 15 chars - 20 points
        'This description is long enough to meet the sixty character requirement', // 15 points
        '', // No category - 0 points
        [], // No tags - 0 points
        false, // Not unique - 0 points
      );

      expect(score.total).toBe(75); // 40 + 20 + 15
      expect(score.total).toBeGreaterThanOrEqual(70);
    });

    it('should calculate score just below approval threshold', () => {
      const score = service.calculateScore(
        'Good Title Here', // 15 chars - 20 points
        'Short description', // < 60 chars - 0 points
        '', // No category - 0 points
        ['tag1'], // 1 tag - 10 points
        false, // Not unique - 0 points
      );

      expect(score.total).toBe(70); // 40 + 20 + 0 + 0 + 10 + 0
    });
  });
});
