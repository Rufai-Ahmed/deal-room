import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    maxLength: 2000,
    example: 'Can you break out CAC by channel?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ minimum: 1, nullable: true, example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number | null;
}

export class PostViewerCommentDto extends CreateCommentDto {
  @ApiProperty({ description: 'Signed session issued when the view opened.' })
  @IsString()
  viewSessionToken!: string;
}
