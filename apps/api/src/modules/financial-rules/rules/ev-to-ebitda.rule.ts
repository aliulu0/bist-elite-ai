import { Injectable } from '@nestjs/common';
import { RuleResult, FinancialData, DEFAULT_THRESHOLDS } from '../rule.types';

@Injectable()
export class EvToEbitdaRule {
  evaluate(data: FinancialData): RuleResult {
    const value = data.enterpriseValueToEBITDA;

    if (value == null) {
      return {
        id: 'ev_to_ebitda',
        name: 'EV / EBITDA (FD/FAVÖK)',
        status: 'WARNING',
        value: null,
        reason: 'EV/EBITDA data not available',
      };
    }

    const { pass, warning } = DEFAULT_THRESHOLDS.evToEbitda;

    if (value <= pass) {
      return {
        id: 'ev_to_ebitda',
        name: 'EV / EBITDA (FD/FAVÖK)',
        status: 'PASS',
        value,
        reason: `EV/EBITDA of ${value.toFixed(2)} is below threshold of ${pass}`,
      };
    }

    if (value <= warning) {
      return {
        id: 'ev_to_ebitda',
        name: 'EV / EBITDA (FD/FAVÖK)',
        status: 'WARNING',
        value,
        reason: `EV/EBITDA of ${value.toFixed(2)} is between ${pass} and ${warning}`,
      };
    }

    return {
      id: 'ev_to_ebitda',
      name: 'EV / EBITDA (FD/FAVÖK)',
      status: 'FAIL',
      value,
      reason: `EV/EBITDA of ${value.toFixed(2)} exceeds threshold of ${warning}`,
    };
  }
}
