import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app/app.module';
import { configureApp } from './configure-app';

/// Held across invocations so a warm instance skips the Nest bootstrap and the
/// database connection. Only a cold start pays for them.
let cached: express.Express | null = null;

const bootstrap = async (): Promise<express.Express> => {
  if (cached) {
    return cached;
  }

  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );

  configureApp(app);
  await app.init();

  cached = server;
  return server;
};

export default async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  const server = await bootstrap();
  server(req as express.Request, res as express.Response);
};
