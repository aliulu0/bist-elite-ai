import { Injectable } from '@nestjs/common';
import { InvestmentGrade, GradeThresholds } from '../ranking.types';

@Injectable()
export class GradeAssigner {
  private readonly thresholds: GradeThresholds;

  constructor(thresholds: GradeThresholds) {
    this.thresholds = thresholds;
  }

  assign(rankingScore: number): InvestmentGrade {
    if (rankingScore >= this.thresholds.aaa) return 'AAA';
    if (rankingScore >= this.thresholds.aa) return 'AA';
    if (rankingScore >= this.thresholds.a) return 'A';
    if (rankingScore >= this.thresholds.bbb) return 'BBB';
    if (rankingScore >= this.thresholds.bb) return 'BB';
    if (rankingScore >= this.thresholds.b) return 'B';
    if (rankingScore >= this.thresholds.c) return 'C';
    return 'REJECT';
  }

  getGradeDescription(grade: InvestmentGrade): string {
    switch (grade) {
      case 'AAA': return 'Exceptional investment opportunity — highest conviction';
      case 'AA': return 'Very strong opportunity — high conviction';
      case 'A': return 'Strong opportunity — above average conviction';
      case 'BBB': return 'Good opportunity — moderate conviction';
      case 'BB': return 'Fair opportunity — lower conviction';
      case 'B': return 'Speculative opportunity — limited conviction';
      case 'C': return 'Highly speculative — minimal conviction';
      case 'REJECT': return 'Does not meet minimum investment criteria';
    }
  }

  getGradeDistribution(grades: InvestmentGrade[]): Record<InvestmentGrade, number> {
    const dist: Record<InvestmentGrade, number> = {
      AAA: 0, AA: 0, A: 0, BBB: 0, BB: 0, B: 0, C: 0, REJECT: 0,
    };
    for (const g of grades) dist[g]++;
    return dist;
  }
}
