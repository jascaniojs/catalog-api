import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;
}
