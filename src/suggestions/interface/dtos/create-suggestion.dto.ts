import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuggestionDto {
  @ApiProperty({
    example: 'BLS Training',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Basic life support training for healthcare workers.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;
}
