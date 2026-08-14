import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/common/password.util';
import { hashIp } from '../src/common/crypto.util';
import { buildDeck, MODEL_SLIDES, SERIES_A_SLIDES } from './seed-deck';

const DEMO_EMAIL = 'founder@dealroom.demo';
const DEMO_PASSWORD = 'deal-room-demo';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const storageRoot = resolve(
  process.cwd(),
  process.env.STORAGE_LOCAL_DIR ?? '.storage',
);

const daysAgo = (days: number, hour = 10, minute = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const usingS3 = process.env.STORAGE_DRIVER === 's3';

const writeDeck = async (
  ownerId: string,
  slides: Parameters<typeof buildDeck>[1],
  company: string,
): Promise<string> => {
  const fileKey = `documents/${ownerId}/${randomUUID()}.pdf`;
  const body = await buildDeck(company, slides);

  if (usingS3) {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
        Body: body,
        ContentType: 'application/pdf',
      }),
    );

    return fileKey;
  }

  const target = join(storageRoot, fileKey);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body);
  return fileKey;
};

const readingPattern = (
  pages: number,
  intensity: number,
): { page: number; durationMs: number }[] =>
  Array.from({ length: pages }, (_, index) => {
    const page = index + 1;
    const weight =
      page === 4 ? 3.4 : page === 11 ? 2.6 : page === 1 ? 1.8 : page > 8 ? 0.6 : 1;
    return {
      page,
      durationMs: Math.round(weight * intensity * 1000),
    };
  }).filter((entry) => entry.durationMs > 0);

const main = async (): Promise<void> => {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const founder = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Ada Whitfield',
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
  });

  const deckKey = await writeDeck(founder.id, SERIES_A_SLIDES, 'Meridian');
  const modelKey = await writeDeck(founder.id, MODEL_SLIDES, 'Meridian');

  const deck = await prisma.document.create({
    data: {
      ownerId: founder.id,
      name: 'Meridian Series A deck',
      fileKey: deckKey,
      mimeType: 'application/pdf',
      sizeBytes: 486_912,
      pageCount: SERIES_A_SLIDES.length,
      createdAt: daysAgo(21),
    },
  });

  const model = await prisma.document.create({
    data: {
      ownerId: founder.id,
      name: 'Financial model 2026-2028',
      fileKey: modelKey,
      mimeType: 'application/pdf',
      sizeBytes: 214_388,
      pageCount: MODEL_SLIDES.length,
      createdAt: daysAgo(12),
    },
  });

  const northgate = await prisma.shareLink.create({
    data: {
      documentId: deck.id,
      token: 'nQx7pV2mKd4LsA9wRbTfXg',
      recipientName: 'Northgate Capital',
      recipientEmail: 'p.osei@northgate.example',
      requireEmail: true,
      allowDownload: false,
      createdAt: daysAgo(20),
    },
  });

  const brightwater = await prisma.shareLink.create({
    data: {
      documentId: deck.id,
      token: 'Hm3kY8zQaW6rTpLnEv1Bdc',
      recipientName: 'Brightwater Ventures',
      recipientEmail: 'sam@brightwater.example',
      requireEmail: true,
      allowDownload: true,
      createdAt: daysAgo(14),
    },
  });

  const ellis = await prisma.shareLink.create({
    data: {
      documentId: deck.id,
      token: 'Zt5wCqNr9xJm2VhKuD7Ysb',
      recipientName: 'Ellis & Co',
      recipientEmail: 'j.ellis@ellisco.example',
      requireEmail: true,
      allowDownload: false,
      revokedAt: daysAgo(4),
      createdAt: daysAgo(18),
    },
  });

  await prisma.shareLink.create({
    data: {
      documentId: model.id,
      token: 'Ld6vTbXk3QpRz8mNfWc2Ah',
      recipientName: 'Northgate Capital',
      recipientEmail: 'p.osei@northgate.example',
      requireEmail: true,
      allowDownload: false,
      expiresAt: daysAgo(2),
      createdAt: daysAgo(11),
    },
  });

  const salt = process.env.IP_HASH_SALT ?? 'seed-salt';
  const CHROME =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36';
  const SAFARI_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

  const views: {
    link: string;
    openedAt: Date;
    durationMs: number;
    email: string | null;
    name: string | null;
    ip: string;
    ua: string;
    device: string;
    browser: string;
    os: string;
    country: string;
    isBot?: boolean;
    botReason?: string;
    pages?: { page: number; durationMs: number }[];
  }[] = [
    {
      link: northgate.id,
      openedAt: daysAgo(19, 9, 12),
      durationMs: 0,
      email: null,
      name: null,
      ip: '203.0.113.24',
      ua: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      device: 'desktop',
      browser: 'Slackbot',
      os: 'Unknown',
      country: 'GB',
      isBot: true,
      botReason: 'Slack link preview',
    },
    {
      link: northgate.id,
      openedAt: daysAgo(19, 9, 41),
      durationMs: 486_000,
      email: 'p.osei@northgate.example',
      name: 'Priya Osei',
      ip: '203.0.113.24',
      ua: CHROME,
      device: 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      country: 'GB',
      pages: readingPattern(SERIES_A_SLIDES.length, 32),
    },
    {
      link: northgate.id,
      openedAt: daysAgo(6, 21, 18),
      durationMs: 254_000,
      email: 'p.osei@northgate.example',
      name: 'Priya Osei',
      ip: '203.0.113.24',
      ua: SAFARI_IOS,
      device: 'mobile',
      browser: 'Mobile Safari',
      os: 'iOS',
      country: 'GB',
      pages: readingPattern(SERIES_A_SLIDES.length, 17),
    },
    {
      link: brightwater.id,
      openedAt: daysAgo(13, 14, 5),
      durationMs: 0,
      email: null,
      name: null,
      ip: '198.51.100.7',
      ua: 'WhatsApp/2.23.20.0 A',
      device: 'desktop',
      browser: 'WhatsApp',
      os: 'Unknown',
      country: 'US',
      isBot: true,
      botReason: 'WhatsApp link preview',
    },
    {
      link: brightwater.id,
      openedAt: daysAgo(13, 14, 22),
      durationMs: 91_000,
      email: 'sam@brightwater.example',
      name: 'Sam Reyes',
      ip: '198.51.100.7',
      ua: CHROME,
      device: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      country: 'US',
      pages: readingPattern(SERIES_A_SLIDES.length, 6),
    },
    {
      link: ellis.id,
      openedAt: daysAgo(17, 11, 3),
      durationMs: 612_000,
      email: 'j.ellis@ellisco.example',
      name: 'Joanna Ellis',
      ip: '192.0.2.55',
      ua: CHROME,
      device: 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      country: 'GB',
      pages: readingPattern(SERIES_A_SLIDES.length, 41),
    },
  ];

  for (const view of views) {
    const created = await prisma.documentView.create({
      data: {
        shareLinkId: view.link,
        openedAt: view.openedAt,
        lastSeenAt: new Date(view.openedAt.getTime() + view.durationMs),
        durationMs: view.durationMs,
        viewerEmail: view.email,
        viewerName: view.name,
        ipHash: hashIp(view.ip, salt),
        userAgent: view.ua,
        isBot: view.isBot ?? false,
        botReason: view.botReason ?? null,
        device: view.device,
        browser: view.browser,
        os: view.os,
        country: view.country,
      },
    });

    if (view.pages?.length) {
      await prisma.pageView.createMany({
        data: view.pages.map((page) => ({
          viewId: created.id,
          page: page.page,
          durationMs: page.durationMs,
        })),
      });
    }
  }

  await prisma.comment.createMany({
    data: [
      {
        shareLinkId: northgate.id,
        body: 'Strong deck. Can you break out net revenue retention by cohort rather than blended? Slide 4 is doing a lot of work.',
        page: 4,
        authorEmail: 'p.osei@northgate.example',
        authorName: 'Priya Osei',
        createdAt: daysAgo(19, 10, 2),
      },
      {
        shareLinkId: northgate.id,
        body: 'Fair challenge. Cohort split is in the model, tab 3. I have shared that with you as well.',
        page: 4,
        authorUserId: founder.id,
        authorName: 'Ada Whitfield',
        createdAt: daysAgo(19, 12, 40),
      },
      {
        shareLinkId: brightwater.id,
        body: 'What is the churn assumption behind the month 31 break-even?',
        page: 11,
        authorEmail: 'sam@brightwater.example',
        authorName: 'Sam Reyes',
        createdAt: daysAgo(13, 15, 1),
      },
    ],
  });

  console.log(`Seeded demo founder ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  ${deck.name}: 3 links, ${views.length} recorded opens`);
  console.log(
    `  storage: ${usingS3 ? `s3 bucket ${process.env.S3_BUCKET}` : storageRoot}`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
