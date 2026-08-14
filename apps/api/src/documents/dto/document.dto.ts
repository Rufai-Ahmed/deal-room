import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from '@dealroom/shared';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RequestUploadDto {
  @ApiProperty({ maxLength: 255, example: 'series-a-deck.pdf' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ enum: ACCEPTED_MIME_TYPES, example: 'application/pdf' })
  @IsIn(ACCEPTED_MIME_TYPES as unknown as string[])
  mimeType!: string;

  @ApiProperty({ maximum: MAX_UPLOAD_BYTES, example: 486912 })
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes!: number;
}

export class CreateDocumentDto {
  @ApiProperty({ maxLength: 200, example: 'Meridian Series A deck' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Returned by the upload ticket endpoint.' })
  @IsString()
  @MinLength(1)
  fileKey!: string;

  @ApiProperty({ enum: ACCEPTED_MIME_TYPES, example: 'application/pdf' })
  @IsIn(ACCEPTED_MIME_TYPES as unknown as string[])
  mimeType!: string;

  @ApiProperty({ maximum: MAX_UPLOAD_BYTES, example: 486912 })
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes!: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  pageCount?: number;
}

export class RenameDocumentDto {
  @ApiProperty({ maxLength: 200, example: 'Series A deck v2' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;
}
