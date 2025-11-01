import { SuggestionResponse } from '../../domain/suggestion-response.vo';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestionResponseDto {
  @ApiProperty({
    example: 'Basic Life Support (BLS) for Healthcare Providers - Complete Certification Course',
  })
  suggestedTitle: string;

  @ApiProperty({
    example: 'Comprehensive Basic Life Support (BLS) training designed for healthcare professionals. This course covers high-quality CPR for adults, children, and infants, proper use of automated external defibrillators (AEDs), and relief of choking in responsive and unresponsive victims. Upon completion, participants receive American Heart Association BLS Provider certification valid for two years.',
  })
  suggestedDescription: string;

  static fromValueObject(response: SuggestionResponse): SuggestionResponseDto {
    const dto = new SuggestionResponseDto();
    dto.suggestedTitle = response.suggestedTitle;
    dto.suggestedDescription = response.suggestedDescription;
    return dto;
  }
}
