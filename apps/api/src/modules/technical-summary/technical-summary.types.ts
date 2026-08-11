import { Timeframe } from '../indicators/indicator.types';
import { TechnicalGrade } from '../technical-score/technical-score.types';

export interface TechnicalSummary {
  timeframe: Timeframe;
  summary: string;
  overallOpinion: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
  metadata: Record<string, unknown>;
  isValid: boolean;
}
