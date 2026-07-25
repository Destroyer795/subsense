import { distance } from 'fastest-levenshtein';
import { ParsedTransaction, MerchantCluster } from '../../types';

// Normalize string for comparison (uppercase, strip punctuation, remove generic words)
function cleanToken(str: string): string {
  return str
    .toUpperCase()
    .replace(/[\*\.\-_]/g, ' ')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\b(INC|LTD|PVT|LIMITED|INDIA|INDIA P LTD|SERVICES|CORP|PAY|VPA|CO|MEDIA|BILL)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate token similarity overlap score between 0 and 1
function getTokenSimilarity(str1: string, str2: string): number {
  const t1 = cleanToken(str1).split(' ').filter(Boolean);
  const t2 = cleanToken(str2).split(' ').filter(Boolean);

  if (t1.length === 0 || t2.length === 0) return 0;

  let matches = 0;
  for (const w1 of t1) {
    for (const w2 of t2) {
      if (w1 === w2) {
        matches++;
        break;
      }
      if (w1.length > 3 && w2.length > 3 && distance(w1, w2) <= 1) {
        matches += 0.8;
        break;
      }
    }
  }

  const minLen = Math.min(t1.length, t2.length);
  return matches / minLen;
}

// Full similarity metric combining Levenshtein and token overlap
export function areMerchantsSimilar(name1: string, name2: string): boolean {
  const norm1 = cleanToken(name1);
  const norm2 = cleanToken(name2);

  if (!norm1 || !norm2) return false;

  // Exact token match
  if (norm1 === norm2) return true;

  // Prefix match (e.g. NETFLIX vs NETFLIX INDIA)
  if (norm1.startsWith(norm2) || norm2.startsWith(norm1)) return true;

  const t1 = norm1.split(' ').filter(Boolean);
  const t2 = norm2.split(' ').filter(Boolean);

  // Primary brand match (e.g. NETFLIX ENTERTAINMENT vs NETFLIX COM)
  if (t1.length > 0 && t2.length > 0 && t1[0] === t2[0] && t1[0].length >= 4) {
    return true;
  }

  // Token similarity overlap
  const tokenSim = getTokenSimilarity(name1, name2);
  if (tokenSim >= 0.75) return true;

  // Levenshtein edit distance relative to length
  const maxLen = Math.max(norm1.length, norm2.length);
  const levDist = distance(norm1, norm2);
  const levSim = 1 - levDist / maxLen;

  return levSim >= 0.7;
}

export function clusterTransactionsByMerchant(transactions: ParsedTransaction[]): MerchantCluster[] {
  const clusters: MerchantCluster[] = [];

  for (const txn of transactions) {
    if (!txn.merchant || txn.amount <= 0) continue;

    let matchedCluster: MerchantCluster | null = null;
    for (const cluster of clusters) {
      if (
        areMerchantsSimilar(txn.merchant, cluster.normalizedMerchant) ||
        cluster.aliases.some((alias) => areMerchantsSimilar(txn.merchant, alias))
      ) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.transactions.push(txn);
      if (!matchedCluster.aliases.includes(txn.merchant)) {
        matchedCluster.aliases.push(txn.merchant);
      }
      // Update normalized name to cleanest/shortest name
      if (txn.merchant.length < matchedCluster.normalizedMerchant.length && txn.merchant.length >= 3) {
        matchedCluster.normalizedMerchant = txn.merchant;
      }
    } else {
      clusters.push({
        clusterId: `CLUSTER_${clusters.length + 1}`,
        normalizedMerchant: txn.merchant,
        aliases: [txn.merchant],
        transactions: [txn],
      });
    }
  }

  // Sort transactions inside each cluster chronologically
  clusters.forEach((cluster) => {
    cluster.transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

  return clusters;
}
