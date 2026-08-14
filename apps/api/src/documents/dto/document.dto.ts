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
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsIn(ACCEPTED_MIME_TYPES as unknown as string[])
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes!: number;
}

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1)
  fileKey!: string;

  @IsIn(ACCEPTED_MIME_TYPES as unknown as string[])
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  pageCount?: number;
}

export class RenameDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;
}
