import { Injectable } from '@nestjs/common';
import { QualityScore } from './catalog-item.entity';

@Injectable()
export class QualityScoreService {
  calculateScore(
    title: string,
    description: string,
    category: string,
    tags: string[],
    isUniqueTitle: boolean,
  ): QualityScore {
    const breakdown = {
      base: 40, // Always start with 40 points
      titleLength: this.scoreTitleLength(title),
      descriptionLength: this.scoreDescriptionLength(description),
      categoryProvided: category ? 10 : 0,
      tagsProvided: this.scoreTagsProvided(tags),
      uniqueTitle: isUniqueTitle ? 5 : 0,
    };

    const total = Object.values(breakdown).reduce(
      (sum, score) => sum + score,
      0,
    );

    return {
      total,
      breakdown,
    };
  }

  private scoreTitleLength(title: string): number {
    const length = title.length;
    return length >= 12 && length <= 50 ? 20 : 0;
  }

  private scoreDescriptionLength(description: string): number {
    return description.length >= 60 ? 15 : 0;
  }

  private scoreTagsProvided(tags: string[]): number {
    if (tags.length >= 1 && tags.length <= 3) {
      return 10; // 1-3 tags
    } else if (tags.length > 3) {
      return 20; // More than 3 tags
    }
    return 0;
  }
}
