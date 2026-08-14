import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PageEngagementDto {
  @IsInt()
  @Min(1)
  page!: number;

  @IsInt()
  @Min(0)
  durationMs!: number;
}

export class HeartbeatDto {
  @IsString()
  viewSessionToken!: string;

  @IsInt()
  @Min(0)
  durationMs!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageEngagementDto)
  pages!: PageEngagementDto[];
}
