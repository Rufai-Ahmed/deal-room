import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import type { Response } from 'express';

const SWAGGER_CDN = 'https://cdn.jsdelivr.net';
const SWAGGER_DIST = `${SWAGGER_CDN}/npm/swagger-ui-dist@5`;

/// Shared by the long-running server and the serverless entry point so the two
/// cannot drift apart on security headers or validation rules.
export const configureApp = (app: NestExpressApplication): void => {
  // Vercel and most proxies terminate TLS upstream, so the client address and
  // protocol only arrive via forwarded headers.
  app.set('trust proxy', 1);

  // Swagger UI is the only HTML this API serves and it pulls its assets from a
  // CDN, because swagger-ui-dist ships them as files on disk that do not exist
  // inside a bundled serverless function.
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

  // /s/:token is the address a founder actually sends to an investor, so it
  // stays at the root rather than sitting behind the API prefix.
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

  // SwaggerModule.setup is not used here. It serves swagger-ui-dist from disk,
  // and those files do not exist inside a bundled serverless function, so the
  // page renders unstyled and inert. Its customJs option appends tags after the
  // init script rather than before it, which does not fix the ordering either.
  // Serving the three files directly keeps the load order correct and lets the
  // content security policy stay narrow.
  // The adapter is generic over its own request and response types, which do
  // not line up with the express ones the handlers below actually receive.
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
