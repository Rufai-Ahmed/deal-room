import { detectBot } from './bot-detection';

describe('detectBot', () => {
  const humanAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ];

  it.each(humanAgents)('treats a real browser as a person: %s', (agent) => {
    expect(detectBot(agent)).toEqual({ isBot: false, reason: null });
  });

  const previewAgents: [string, string][] = [
    [
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'Slack link preview',
    ],
    ['WhatsApp/2.23.20.0 A', 'WhatsApp link preview'],
    ['facebookexternalhit/1.1', 'Facebook link preview'],
    ['LinkedInBot/1.0 (compatible; Mozilla/5.0)', 'LinkedIn link preview'],
    ['TelegramBot (like TwitterBot)', 'Telegram link preview'],
    ['Mozilla/5.0 (compatible; Discordbot/2.0)', 'Discord link preview'],
    ['SkypeUriPreview Preview/0.5', 'Skype link preview'],
    ['Microsoft Office Word 2014', 'Microsoft Office link scan'],
    ['Mozilla/5.0 (compatible; proofpoint-urldefense)', 'Proofpoint URL defence scan'],
  ];

  it.each(previewAgents)('flags %s', (agent, reason) => {
    expect(detectBot(agent)).toEqual({ isBot: true, reason });
  });

  it('flags search engine crawlers', () => {
    const verdict = detectBot(
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    );
    expect(verdict.isBot).toBe(true);
  });

  it('treats a missing user agent as automated', () => {
    expect(detectBot(undefined).isBot).toBe(true);
    expect(detectBot('   ').isBot).toBe(true);
  });

  it('matches regardless of casing', () => {
    expect(detectBot('SLACKBOT-LINKEXPANDING 1.0').isBot).toBe(true);
  });
});
