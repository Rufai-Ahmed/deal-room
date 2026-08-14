import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateShareLinkDto {
  @ApiPropertyOptional({ maxLength: 120, example: 'Northgate Capital' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @ApiPropertyOptional({ example: 'p.osei@northgate.example' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Ask the viewer for an email before revealing the file.',
  })
  @IsOptional()
  @IsBoolean()
  requireEmail?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-30T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}

export class UpdateShareLinkDto extends CreateShareLinkDto {}

export class IdentifyViewerDto {
  @ApiPropertyOptional({ example: 'p.osei@northgate.example' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ maxLength: 120, example: 'Priya Osei' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Issued by the /s/:token redirect. Omit to open a new session.',
  })
  @IsOptional()
  @IsString()
  viewSessionToken?: string;
}
