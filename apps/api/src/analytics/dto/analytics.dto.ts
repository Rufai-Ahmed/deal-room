import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class PageEngagementDto {
  @ApiProperty({ minimum: 1, example: 4 })
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ minimum: 0, example: 30000 })
  @IsInt()
  @Min(0)
  durationMs!: number;
}

export class HeartbeatDto {
  @ApiProperty({ description: 'Signed session issued when the view opened.' })
  @IsString()
  viewSessionToken!: string;

  @ApiProperty({ minimum: 0, example: 45000 })
  @IsInt()
  @Min(0)
  durationMs!: number;

  @ApiProperty({ type: [PageEngagementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageEngagementDto)
  pages!: PageEngagementDto[];
}
