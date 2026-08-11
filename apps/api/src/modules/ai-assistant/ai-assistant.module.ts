import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { QuestionAnalyzerService, AiAssistantService, InvestmentReportService, PortfolioAdvisorService } from './services';

@Module({
  controllers: [AiAssistantController],
  providers: [QuestionAnalyzerService, AiAssistantService, InvestmentReportService, PortfolioAdvisorService],
  exports: [AiAssistantService, InvestmentReportService, PortfolioAdvisorService],
})
export class AiAssistantModule {}
