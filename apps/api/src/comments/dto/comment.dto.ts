import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number | null;
}

export class PostViewerCommentDto extends CreateCommentDto {
  @IsString()
  viewSessionToken!: string;
}
