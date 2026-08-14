import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read directly rather than through prisma's env() helper, which throws on
    // a missing variable. Only migrate and introspect need a database; the
    // client generator does not, and CI generates without one.
    url: process.env.DATABASE_URL,
  },
});
