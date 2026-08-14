import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const INK = rgb(0.063, 0.071, 0.082);
const SOFT = rgb(0.29, 0.28, 0.25);
const PAPER = rgb(0.984, 0.98, 0.973);
const BRAND = rgb(0.078, 0.322, 0.235);

interface Slide {
  eyebrow: string;
  title: string;
  body: string[];
}

/// Stand-in fundraising deck so the seeded demo has something real to render,
/// rather than shipping a binary fixture in the repository.
export const buildDeck = async (
  company: string,
  slides: Slide[],
): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  slides.forEach((slide, index) => {
    const page = pdf.addPage([960, 540]);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: 960,
      height: 540,
      color: PAPER,
    });
    page.drawRectangle({ x: 0, y: 532, width: 960, height: 8, color: BRAND });

    page.drawText(slide.eyebrow.toUpperCase(), {
      x: 64,
      y: 452,
      size: 11,
      font: sans,
      color: SOFT,
    });

    page.drawText(slide.title, {
      x: 64,
      y: 396,
      size: 40,
      font: serif,
      color: INK,
    });

    slide.body.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: 64,
        y: 320 - lineIndex * 30,
        size: 16,
        font: sans,
        color: SOFT,
      });
    });

    page.drawText(company, { x: 64, y: 48, size: 11, font: sans, color: SOFT });
    page.drawText(`${index + 1} / ${slides.length}`, {
      x: 860,
      y: 48,
      size: 11,
      font: sans,
      color: SOFT,
    });
  });

  return pdf.save();
};

export const SERIES_A_SLIDES: Slide[] = [
  {
    eyebrow: 'Series A',
    title: 'Meridian',
    body: ['Infrastructure for cross-border payroll.', 'Raising GBP 6m.'],
  },
  {
    eyebrow: 'Problem',
    title: 'Paying people abroad is still manual',
    body: [
      'Finance teams reconcile four systems per country.',
      'Errors surface a month later, after the money has moved.',
    ],
  },
  {
    eyebrow: 'Solution',
    title: 'One ledger, every jurisdiction',
    body: [
      'A single payroll ledger with local compliance built in.',
      'Reconciliation happens before payment, not after.',
    ],
  },
  {
    eyebrow: 'Traction',
    title: 'GBP 2.4m ARR, growing 14% monthly',
    body: [
      '118 customers across 9 markets.',
      'Net revenue retention of 131%.',
      'Payback period of 11 months.',
    ],
  },
  {
    eyebrow: 'Market',
    title: 'GBP 9bn of payroll spend in scope',
    body: [
      'Mid-market companies with 50 to 2,000 staff abroad.',
      'Expanding into contractor payments in 2027.',
    ],
  },
  {
    eyebrow: 'Business model',
    title: 'Per employee, per month',
    body: [
      'GBP 14 per employee per month.',
      'Gross margin of 78% after payment rails.',
    ],
  },
  {
    eyebrow: 'Competition',
    title: 'Where we win',
    body: [
      'Incumbents sell per country. We sell one contract.',
      'Compliance updates ship weekly, not annually.',
    ],
  },
  {
    eyebrow: 'Unit economics',
    title: 'CAC of GBP 9.2k, LTV of GBP 71k',
    body: [
      'Sales-assisted motion with a self-serve entry tier.',
      'Expansion revenue covers 40% of new bookings.',
    ],
  },
  {
    eyebrow: 'Team',
    title: 'Built payroll before',
    body: [
      'Founders from Wise and ADP.',
      '31 people, 12 in engineering.',
    ],
  },
  {
    eyebrow: 'Roadmap',
    title: 'The next eighteen months',
    body: [
      'Contractor payments in Q1 2027.',
      'Benefits administration in Q3 2027.',
    ],
  },
  {
    eyebrow: 'The ask',
    title: 'GBP 6m to reach GBP 10m ARR',
    body: [
      '60% engineering, 30% go to market, 10% compliance.',
      'Runway of 26 months at plan.',
    ],
  },
  {
    eyebrow: 'Contact',
    title: 'Thank you',
    body: ['founders@meridian.example', 'meridian.example'],
  },
];

export const MODEL_SLIDES: Slide[] = [
  {
    eyebrow: 'Financial model',
    title: 'Three year plan',
    body: ['Base, upside and downside cases.', 'Updated 2 August 2026.'],
  },
  {
    eyebrow: 'Revenue',
    title: 'GBP 2.4m to GBP 18m',
    body: ['Driven by seat expansion, not price rises.'],
  },
  {
    eyebrow: 'Costs',
    title: 'Headcount is 71% of spend',
    body: ['Engineering grows from 12 to 34.'],
  },
  {
    eyebrow: 'Cash',
    title: 'Trough of GBP 1.9m in month 19',
    body: ['Break-even in month 31 on the base case.'],
  },
  {
    eyebrow: 'Sensitivity',
    title: 'What breaks the plan',
    body: ['Churn above 1.8% monthly pushes break-even out by 7 months.'],
  },
  {
    eyebrow: 'Assumptions',
    title: 'Every input in one place',
    body: ['Listed so you can disagree with them precisely.'],
  },
];
