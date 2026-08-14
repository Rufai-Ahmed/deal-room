import { isbot } from 'isbot';

const LINK_PREVIEW_AGENTS: ReadonlyArray<[string, string]> = [
  ['slackbot', 'Slack link preview'],
  ['slack-imgproxy', 'Slack link preview'],
  ['whatsapp', 'WhatsApp link preview'],
  ['facebookexternalhit', 'Facebook link preview'],
  ['twitterbot', 'X link preview'],
  ['linkedinbot', 'LinkedIn link preview'],
  ['telegrambot', 'Telegram link preview'],
  ['discordbot', 'Discord link preview'],
  ['skypeuripreview', 'Skype link preview'],
  ['microsoftpreview', 'Microsoft link preview'],
  ['bingpreview', 'Microsoft link preview'],
  ['outlook', 'Outlook safe-link scan'],
  ['office', 'Microsoft Office link scan'],
  ['proofpoint', 'Proofpoint URL defence scan'],
  ['mimecast', 'Mimecast URL protection scan'],
  ['barracuda', 'Barracuda link protection scan'],
  ['googledocs', 'Google link preview'],
  ['embedly', 'Embedly link preview'],
];

export interface BotVerdict {
  isBot: boolean;
  reason: string | null;
}

export const detectBot = (userAgent: string | undefined): BotVerdict => {
  if (!userAgent || userAgent.trim().length === 0) {
    return { isBot: true, reason: 'No user agent supplied' };
  }

  const normalised = userAgent.toLowerCase();

  const preview = LINK_PREVIEW_AGENTS.map(
    ([needle, reason]) => [normalised.indexOf(needle), reason] as const,
  )
    .filter(([index]) => index >= 0)
    .sort((a, b) => a[0] - b[0])[0];

  if (preview) {
    return { isBot: true, reason: preview[1] };
  }

  if (isbot(userAgent)) {
    return { isBot: true, reason: 'Automated crawler' };
  }

  return { isBot: false, reason: null };
};
