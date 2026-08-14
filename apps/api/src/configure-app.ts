import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import type { Response } from 'express';

const SWAGGER_CDN = 'https://cdn.jsdelivr.net';
const SWAGGER_DIST = `${SWAGGER_CDN}/npm/swagger-ui-dist@5`;

export const configureApp = (app: NestExpressApplication): void => {
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", SWAGGER_CDN],
          'style-src': ["'self'", "'unsafe-inline'", SWAGGER_CDN],
          'img-src': ["'self'", 'data:', SWAGGER_CDN],
        },
      },
    }),
  );
  app.use(compression());

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:4200',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: 's/:token', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const spec = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Deal Room API')
      .setDescription(
        'Document sharing with per-recipient links and view analytics.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );

  const http = app.getHttpAdapter() as unknown as {
    get(path: string, handler: (req: unknown, res: Response) => unknown): void;
  };

  http.get('/api/docs-json', (_req: unknown, res: Response) => res.json(spec));

  http.get('/api/docs-init.js', (_req: unknown, res: Response) =>
    res
      .type('application/javascript')
      .send(
        `window.ui = SwaggerUIBundle({url:'/api/docs-json',dom_id:'#swagger',` +
          `deepLinking:true,presets:[SwaggerUIBundle.presets.apis,` +
          `SwaggerUIStandalonePreset],layout:'BaseLayout'});`,
      ),
  );

  http.get('/api/docs', (_req: unknown, res: Response) =>
    res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Deal Room API</title>
    <link rel="icon" href="/favicon.svg" />
    <link rel="stylesheet" href="${SWAGGER_DIST}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger"></div>
    <script src="${SWAGGER_DIST}/swagger-ui-bundle.js"></script>
    <script src="${SWAGGER_DIST}/swagger-ui-standalone-preset.js"></script>
    <script src="/api/docs-init.js"></script>
  </body>
</html>`),
  );
};
