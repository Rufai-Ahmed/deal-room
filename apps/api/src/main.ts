import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { configureApp } from './configure-app';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  Logger.log(`Deal Room API listening on http://localhost:${port}/api`);
};

void bootstrap();
