export function predictCycle(cycles: number[]) {

    if (cycles.length === 0) {
      return {
        cycle_length: 28,
        ovulation_day: 14
      };
    }
  
    const weights = cycles.map((_, i) => i + 1); // cycles récents plus importants
  
    const weightedSum = cycles.reduce((sum, c, i) => sum + c * weights[i], 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
  
    const recentAverage = weightedSum / totalWeight;
  
    const prior = 28;
    const alpha = 0.7;
  
    const predictedCycle = alpha * recentAverage + (1 - alpha) * prior;
  
    const ovulationDay = Math.round(predictedCycle - 14);
  
    return {
      cycle_length: Math.round(predictedCycle),
      ovulation_day: ovulationDay
    };
  }