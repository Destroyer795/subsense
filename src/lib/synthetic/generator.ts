import { RawTransaction, BankFormat } from '../../types';

export interface SyntheticDatasetOptions {
  seed?: number;
  monthsCount?: number;
  includePriceHikes?: boolean;
  includeDormants?: boolean;
  includeNoise?: boolean;
}

export interface SyntheticDatasetResult {
  name: string;
  description: string;
  generatedAt: string;
  transactions: {
    id: string;
    rawText: string;
    bankHint?: BankFormat;
    expectedMerchant?: string;
    expectedAmount?: number;
    expectedCategory?: string;
    isPlantedHike?: boolean;
    isPlantedDormant?: boolean;
    isNoise?: boolean;
  }[];
}

// Bank notification format templates
const HDFC_TEMPLATES = [
  "Rs.{amount} debited from A/C **4921 on {date} to VPA {merchant} Ref {ref}. Not you? Call 18002586161.",
  "Alert: Rs.{amount} debited from HDFC Bank A/C ending 4921 on {date} towards {merchant} Ref: {ref}.",
  "HDFC Bank: Rs.{amount} paid to {merchant} on {date}. UPI Ref {ref}."
];

const SBI_TEMPLATES = [
  "Txn of Rs.{amount} done on SBI Debit Card **1082 on {date} at {merchant}. Ref No {ref}.",
  "Dear Customer, A/C 9831 debited by Rs.{amount} on {date} transfer to {merchant}. SBI Ref {ref}.",
  "SBI Alert: Rs.{amount} debited towards {merchant} on {date}. Ref: {ref}."
];

const ICICI_TEMPLATES = [
  "ICICI Bank Acct **3019 debited for Rs {amount} on {date}. Info: INF*{merchant}*. UPI: {ref}.",
  "Dear ICICI Customer, your account has been debited with INR {amount} on {date} for payment to {merchant}. Ref {ref}.",
  "Transaction Alert: INR {amount} debited from ICICI A/C on {date} for {merchant}. Ref: {ref}."
];

const AXIS_TEMPLATES = [
  "Axis Bank: Rs.{amount} debited from A/C **8812 on {date} at {merchant}. Ref {ref}.",
  "INR {amount} debited at {merchant} via Axis Bank Card **8812 on {date}. Txn ID {ref}.",
  "Alert! Rs.{amount} spent on Axis A/C ending 8812 on {date} at {merchant}."
];

function getRandomBankFormat(index: number): { format: BankFormat; template: string } {
  const formats: BankFormat[] = ['HDFC', 'SBI', 'ICICI', 'AXIS'];
  const format = formats[index % formats.length];
  let templates = HDFC_TEMPLATES;
  if (format === 'SBI') templates = SBI_TEMPLATES;
  if (format === 'ICICI') templates = ICICI_TEMPLATES;
  if (format === 'AXIS') templates = AXIS_TEMPLATES;
  return {
    format,
    template: templates[index % templates.length]
  };
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function generateRef(): string {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

export function generateSyntheticDataset(options: SyntheticDatasetOptions = {}): SyntheticDatasetResult {
  const monthsCount = options.monthsCount || 6;
  const rawItems: SyntheticDatasetResult['transactions'] = [];
  const now = new Date(2026, 6, 1); // July 2026 anchor

  // Planted Recurring Subscriptions Specification
  const subscriptions = [
    // 1. Netflix (OTT) - Price hike planted
    {
      merchantVariants: ['NETFLIX.COM', 'NETFLIX INDIA', 'NETFLIX*ENTERTAINMENT'],
      category: 'OTT & Streaming',
      baseAmount: 649,
      hikeAmount: 799,
      hikeMonthIndex: 3, // Hike after month 3
      intervalDays: 30,
      isDormant: false,
    },
    // 2. Spotify Premium (OTT)
    {
      merchantVariants: ['Spotify India', 'SPOTIFY*PREMIUM', 'SPOTIFY MEDIA'],
      category: 'OTT & Streaming',
      baseAmount: 119,
      intervalDays: 30,
      isDormant: false,
    },
    // 3. GitHub Copilot (Developer & SaaS) - Price hike planted
    {
      merchantVariants: ['GITHUB INC', 'GITHUB*SUBSCRIPTION', 'GITHUB.COM'],
      category: 'Developer & SaaS',
      baseAmount: 800, // ~10 USD
      hikeAmount: 1200,
      hikeMonthIndex: 4,
      intervalDays: 30,
      isDormant: false,
    },
    // 4. OpenAI ChatGPT Plus (Developer & SaaS)
    {
      merchantVariants: ['OPENAI *CHATGPT', 'OPENAI*SUBSCRIPTION', 'OpenAI Inc'],
      category: 'Developer & SaaS',
      baseAmount: 1999,
      intervalDays: 30,
      isDormant: false,
    },
    // 5. Cult.fit Pass (Fitness & Health) - Dormant (No login in months, user should cancel)
    {
      merchantVariants: ['CULT FIT GYM', 'CULTFIT*MEMBERSHIP', 'CUREFIT HEALTH'],
      category: 'Fitness & Health',
      baseAmount: 1750,
      intervalDays: 30,
      isDormant: true,
    },
    // 6. Google One Storage (Cloud Storage)
    {
      merchantVariants: ['GOOGLE *STORAGE', 'Google LLC Google One', 'GOOGLE*CLOUD'],
      category: 'Cloud Storage',
      baseAmount: 130,
      intervalDays: 30,
      isDormant: false,
    },
    // 7. Apple iCloud+ (Cloud Storage) - Price hike planted
    {
      merchantVariants: ['APPLE.COM/BILL', 'APPLE*SERVICES', 'Apple India P Ltd'],
      category: 'Cloud Storage',
      baseAmount: 75,
      hikeAmount: 219,
      hikeMonthIndex: 2,
      intervalDays: 30,
      isDormant: false,
    },
    // 8. Swiggy One (Food & Dining)
    {
      merchantVariants: ['SWIGGY ONE', 'BUNDL TECHNOLOGIES', 'SWIGGY*MEMBERSHIP'],
      category: 'Food & Dining',
      baseAmount: 299,
      intervalDays: 90, // Quarterly
      isDormant: false,
    },
    // 9. Zomato Gold (Food & Dining) - Dormant
    {
      merchantVariants: ['ZOMATO GOLD', 'ZOMATO MEDIA LTD', 'ZOMATO*LIMITED'],
      category: 'Food & Dining',
      baseAmount: 199,
      intervalDays: 90,
      isDormant: true,
    },
    // 10. PlayStation Plus (Gaming & Media)
    {
      merchantVariants: ['PLAYSTATION NETWORK', 'SONY INTERACTIVE', 'SONY*PLAYSTATION'],
      category: 'Gaming & Media',
      baseAmount: 499,
      intervalDays: 30,
      isDormant: false,
    },
    // 11. Notion Team Workspace (Developer & SaaS)
    {
      merchantVariants: ['NOTION LABS', 'NOTION*SUBSCRIPTION', 'NOTION.SO'],
      category: 'Developer & SaaS',
      baseAmount: 960,
      intervalDays: 30,
      isDormant: true,
    },
    // 12. Youtube Premium (OTT & Streaming)
    {
      merchantVariants: ['YOUTUBE PREMIUM', 'GOOGLE*YOUTUBE', 'YOUTUBE*MEMBERSHIP'],
      category: 'OTT & Streaming',
      baseAmount: 149,
      intervalDays: 30,
      isDormant: false,
    },
    // 13. Times Prime Membership (Utilities & Services)
    {
      merchantVariants: ['TIMES PRIME', 'TIMES INTERNET', 'TIMESPRIME*MEMBERSHIP'],
      category: 'Utilities & Services',
      baseAmount: 1199,
      intervalDays: 365, // Annual
      isDormant: false,
    },
    // 14. Adobe Creative Cloud (Developer & SaaS)
    {
      merchantVariants: ['ADOBE *SYSTEMS', 'ADOBE CREATIVE CLOUD', 'ADOBE*SUBSCRIPTION'],
      category: 'Developer & SaaS',
      baseAmount: 1675,
      intervalDays: 30,
      isDormant: false,
    }
  ];

  let txnIdCounter = 1;

  // Generate monthly occurrences for each subscription
  subscriptions.forEach((sub, subIdx) => {
    for (let m = monthsCount - 1; m >= 0; m--) {
      // Calculate date
      const txnDate = new Date(now.getFullYear(), now.getMonth() - m, 12 + (subIdx % 5));
      const formattedDate = formatDate(txnDate);

      // Determine amount (checking for price hikes)
      let amount = sub.baseAmount;
      let isHike = false;
      if (sub.hikeAmount && (monthsCount - m) > sub.hikeMonthIndex) {
        amount = sub.hikeAmount;
        isHike = true;
      }

      // Pick merchant alias randomly for fuzzy testing
      const merchant = sub.merchantVariants[(m + subIdx) % sub.merchantVariants.length];
      const bankInfo = getRandomBankFormat(txnIdCounter);

      const rawText = bankInfo.template
        .replace('{amount}', amount.toFixed(2))
        .replace('{date}', formattedDate)
        .replace('{merchant}', merchant)
        .replace('{ref}', generateRef());

      rawItems.push({
        id: `TXN_${String(txnIdCounter++).padStart(4, '0')}`,
        rawText,
        bankHint: bankInfo.format,
        expectedMerchant: sub.merchantVariants[0],
        expectedAmount: amount,
        expectedCategory: sub.category,
        isPlantedHike: isHike,
        isPlantedDormant: sub.isDormant,
        isNoise: false
      });
    }
  });

  // Add Noise / One-off Non-Recurring Transactions
  const noiseItems = [
    { merchant: 'AMAZON PAY INDIA', amount: 3450, category: 'Shopping' },
    { merchant: 'STARBUCKS COFFEE', amount: 480, category: 'Food & Dining' },
    { merchant: 'UBER INDIA RIDES', amount: 312, category: 'Transport' },
    { merchant: 'PHARMEASY PHARMA', amount: 1250, category: 'Health' },
    { merchant: 'BOOKMYSHOW TICKETS', amount: 840, category: 'Entertainment' },
    { merchant: 'DECATHLON SPORTS', amount: 2499, category: 'Shopping' },
  ];

  noiseItems.forEach((noise, idx) => {
    const txnDate = new Date(now.getFullYear(), now.getMonth() - (idx % 4), 18 + idx);
    const bankInfo = getRandomBankFormat(txnIdCounter);
    const rawText = bankInfo.template
      .replace('{amount}', noise.amount.toFixed(2))
      .replace('{date}', formatDate(txnDate))
      .replace('{merchant}', noise.merchant)
      .replace('{ref}', generateRef());

    rawItems.push({
      id: `TXN_${String(txnIdCounter++).padStart(4, '0')}`,
      rawText,
      bankHint: bankInfo.format,
      expectedMerchant: noise.merchant,
      expectedAmount: noise.amount,
      expectedCategory: noise.category,
      isNoise: true
    });
  });

  // Shuffle transactions to mimic real un-ordered SMS log
  const shuffled = rawItems.sort(() => (options.seed ? Math.sin(txnIdCounter++) - 0.5 : Math.random() - 0.5));

  return {
    name: 'SubSense Standard Demo Dataset (Indian Bank SMS/Statements)',
    description: 'Realistic dataset with 14 recurring subscriptions, 3 price hikes, 3 dormant candidates, and random noise across HDFC, SBI, ICICI, Axis SMS templates.',
    generatedAt: new Date().toISOString(),
    transactions: shuffled
  };
}
