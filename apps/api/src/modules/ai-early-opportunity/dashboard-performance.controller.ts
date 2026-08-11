import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { SelfLearningService } from './self-learning/self-learning.service';
import { BacktestService } from '../backtest/backtest.service';
import { PredictionRegistry } from '../prediction/prediction-registry';

interface DashboardPerformanceData {
  aiAccuracy: number;
  predictionSuccess: number;
  avgExpectedReturn: number;
  avgWinRate: number;
  learningProgress: { scanned: number; updated: number; modifiers: number };
}

@ApiTags('Dashboard Performance')
@Controller('dashboard')
export class DashboardPerformanceController {
  constructor(
    private readonly selfLearning: SelfLearningService,
    private readonly backtestService: BacktestService,
    private readonly predictionRegistry: PredictionRegistry,
  ) {}

  @Get('performance')
  @Public()
  @ApiOperation({ summary: 'Get dashboard performance metrics: AI accuracy, prediction success, avg expected return, avg win rate, learning progress' })
  async getPerformance(): Promise<DashboardPerformanceData> {
    // Get learning progress
    const learningReport = await this.selfLearning.runLearningCycle();
    
    // Get backtest metrics for recent predictions
    const allPredictions = this.predictionRegistry.getAll();
    const validPredictions = allPredictions.filter((p: any) => p.isValid);
    
    let totalWinRate = 0;
    let totalExpectedReturn = 0;
    let successCount = 0;
    
    for (const pred of validPredictions.slice(0, 100)) {
      const backtest = pred.backtestAccuracy;
      if (backtest?.isValid) {
        totalWinRate += backtest.winRate;
        totalExpectedReturn += pred.expectedReturn;
        if (backtest.winRate > 0.5) successCount++;
      }
    }
    
    const count = validPredictions.length > 0 ? Math.min(validPredictions.length, 100) : 1;
    
    // Calculate AI accuracy based on backtest validation
    const accuracy = validPredictions.length > 0 
      ? validPredictions.filter((p: any) => p.backtestAccuracy?.isValid && p.backtestAccuracy.winRate > 0.5).length / count
      : 0;
    
    return {
      aiAccuracy: Math.round(accuracy * 10000) / 100,
      predictionSuccess: Math.round((successCount / count) * 10000) / 100,
      avgExpectedReturn: Math.round((totalExpectedReturn / count) * 100) / 100,
      avgWinRate: Math.round((totalWinRate / count) * 10000) / 100,
      learningProgress: {
        scanned: learningReport.scanned,
        updated: learningReport.updated,
        modifiers: learningReport.modifiers.length,
      },
    };
  }
}