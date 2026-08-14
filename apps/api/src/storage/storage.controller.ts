import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import type { Request, Response } from 'express';
import { LocalStorageDriver } from './local.driver';
import { verifyLocalSignature } from './local-signature';
import { STORAGE_DRIVER } from './storage.types';

@ApiExcludeController()
@Controller('storage/local')
export class StorageController {
  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: LocalStorageDriver,
    @Inject('LOCAL_STORAGE_SECRET') private readonly secret: string,
  ) {}

  @Put()
  async upload(
    @Query('key') key: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    this.assertSignature(key, exp, sig);

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }

    const path = await this.driver.ensureDirectoryFor(key);
    await writeFile(path, Buffer.concat(chunks));

    return { ok: true };
  }

  @Get()
  async download(
    @Query('key') key: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    this.assertSignature(key, exp, sig);

    const path = this.driver.absolutePathFor(key);
    const info = await stat(path).catch(() => null);
    if (!info) {
      throw new NotFoundException('File not found');
    }

    res.setHeader('Content-Length', info.size);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    createReadStream(path).pipe(res);
  }

  private assertSignature(key: string, exp: string, sig: string): void {
    if (!key || !exp || !sig) {
      throw new BadRequestException('Missing signature parameters');
    }
    if (!verifyLocalSignature(key, Number(exp), sig, this.secret)) {
      throw new BadRequestException('Invalid or expired signature');
    }
  }
}
