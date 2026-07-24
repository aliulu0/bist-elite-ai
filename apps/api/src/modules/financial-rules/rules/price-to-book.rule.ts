import { Injectable } from '@nestjs/common';
import { RuleResult, FinancialData, DEFAULT_THRESHOLDS } from '../rule.types';

@Injectable()
export class PriceToBookRule {
  evaluate(data: FinancialData): RuleResult {
    const value = data.priceToBook;

    if (value == null) {
      return {
        id: 'price_to_book',
        name: 'Price to Book (PD/DD)',
        status: 'WARNING',
        value: null,
        reason: 'Price to book data not available',
      };
    }

    const { pass, warning } = DEFAULT_THRESHOLDS.priceToBook;

    if (value <= pass) {
      return {
        id: 'price_to_book',
        name: 'Price to Book (PD/DD)',
        status: 'PASS',
        value,
        reason: `PD/DD of ${value.toFixed(2)} is below threshold of ${pass}`,
      };
    }

    if (value <= warning) {
      return {
        id: 'price_to_book',
        name: 'Price to Book (PD/DD)',
        status: 'WARNING',
        value,
        reason: `PD/DD of ${value.toFixed(2)} is between ${pass} and ${warning}`,
      };
    }

    return {
      id: 'price_to_book',
      name: 'Price to Book (PD/DD)',
      status: 'FAIL',
      value,
      reason: `PD/DD of ${value.toFixed(2)} exceeds threshold of ${warning}`,
    };
  }
}
