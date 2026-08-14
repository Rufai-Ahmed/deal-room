import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; database: string }> {
    const database = await this.prisma
      .$queryRaw`SELECT 1`.then(() => 'up')
      .catch(() => 'down');

    return { status: database === 'up' ? 'ok' : 'degraded', database };
  }
}
