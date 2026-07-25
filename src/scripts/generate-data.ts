import fs from 'fs';
import path from 'path';
import { generateSyntheticDataset } from '../lib/synthetic/generator';

function main() {
  const outputDir = path.join(process.cwd(), 'data', 'samples');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Standard Dataset (14 subscriptions, hikes, dormants, noise)
  const standardData = generateSyntheticDataset({ seed: 42, monthsCount: 6 });
  const standardPath = path.join(outputDir, 'sample-standard.json');
  fs.writeFileSync(standardPath, JSON.stringify(standardData, null, 2), 'utf-8');
  console.log(`Generated: ${standardPath} (${standardData.transactions.length} txns)`);

  // 2. Tech & SaaS Heavy Dataset
  const saasData = generateSyntheticDataset({ seed: 101, monthsCount: 8 });
  saasData.name = 'SubSense Tech & SaaS Heavy Dataset';
  saasData.description = 'Focused on cloud services, developer tools, AI subscriptions, and infrastructure spend.';
  const saasPath = path.join(outputDir, 'sample-tech-heavy-saas.json');
  fs.writeFileSync(saasPath, JSON.stringify(saasData, null, 2), 'utf-8');
  console.log(`Generated: ${saasPath} (${saasData.transactions.length} txns)`);

  // 3. Lifestyle & OTT Focus Dataset
  const lifestyleData = generateSyntheticDataset({ seed: 777, monthsCount: 5 });
  lifestyleData.name = 'SubSense Lifestyle & Entertainment Dataset';
  lifestyleData.description = 'Focused on streaming services, fitness memberships, food delivery, and media.';
  const lifestylePath = path.join(outputDir, 'sample-lifestyle-ott.json');
  fs.writeFileSync(lifestylePath, JSON.stringify(lifestyleData, null, 2), 'utf-8');
  console.log(`Generated: ${lifestylePath} (${lifestyleData.transactions.length} txns)`);

  console.log('Sample datasets successfully generated in /data/samples/');
}

main();
