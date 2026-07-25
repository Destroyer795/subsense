import { SubscriptionItem } from '../../types';

export interface MonthlyForecastPoint {
  monthIndex: number;
  monthName: string;
  baselineSpend: number; // Spend if all prices remained flat
  projectedSpend: number; // Spend accounting for detected price hikes
  priceHikeExcess: number; // Cumulative extra rupee loss due to price hikes
  cumulativeTotalSpend: number; // Total cumulative money spent over 12 months
}

export interface LeakForecastSummary {
  forecastData: MonthlyForecastPoint[];
  total12MonthProjectedSpend: number;
  total12MonthExcessHikeWaste: number;
}

const MONTH_NAMES = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];

export function calculate12MonthLeakForecast(subscriptions: SubscriptionItem[]): LeakForecastSummary {
  const forecastData: MonthlyForecastPoint[] = [];

  let cumulativeTotal = 0;
  let cumulativeExcessHike = 0;

  for (let m = 0; m < 12; m++) {
    let monthBaseline = 0;
    let monthProjected = 0;
    let monthExcess = 0;

    subscriptions.forEach((sub) => {
      const currentCost = sub.currentAmount;
      monthBaseline += currentCost;

      // If price hike detected, project higher amount forward
      if (sub.priceDrift.isHikeDetected && sub.priceDrift.hikeDetails) {
        const prevAmount = sub.priceDrift.hikeDetails.previousAmount;
        monthProjected += currentCost;
        const diff = currentCost - prevAmount;
        if (diff > 0) monthExcess += diff;
      } else {
        monthProjected += currentCost;
      }
    });

    cumulativeTotal += monthProjected;
    cumulativeExcessHike += monthExcess;

    forecastData.push({
      monthIndex: m + 1,
      monthName: MONTH_NAMES[m],
      baselineSpend: monthBaseline,
      projectedSpend: monthProjected,
      priceHikeExcess: cumulativeExcessHike,
      cumulativeTotalSpend: cumulativeTotal,
    });
  }

  return {
    forecastData,
    total12MonthProjectedSpend: cumulativeTotal,
    total12MonthExcessHikeWaste: cumulativeExcessHike,
  };
}
