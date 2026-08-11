import { Controller, Post, Body, Get, Query, ValidationPipe } from '@nestjs/common';
import { AiAssistantService } from './services/ai-assistant.service';
import { InvestmentReportService } from './services/investment-report.service';
import { PortfolioAdvisorService } from './services/portfolio-advisor.service';
import { ChatRequestDto, InvestmentReportRequestDto, PortfolioAdvisorRequestDto } from './dto';

@Controller('ai')
export class AiAssistantController {
  constructor(
    private readonly assistant: AiAssistantService,
    private readonly reportService: InvestmentReportService,
    private readonly advisor: PortfolioAdvisorService,
  ) {}

  @Post('chat')
  async chat(@Body(ValidationPipe) dto: ChatRequestDto) {
    return this.assistant.chat(dto.message);
  }

  @Get('report')
  async report(@Query(ValidationPipe) query: InvestmentReportRequestDto) {
    const report = await this.reportService.generateReport(query.symbol, query.timeframe || '1d');

    if (query.format === 'markdown') {
      return { report, raw: report.markdown };
    }

    return { report };
  }

  @Get('report/markdown')
  async reportMarkdown(@Query(ValidationPipe) query: InvestmentReportRequestDto) {
    const report = await this.reportService.generateReport(query.symbol, query.timeframe || '1d');
    return { markdown: report.markdown };
  }

  @Post('advisor')
  async getAdvisor(@Body(ValidationPipe) dto: PortfolioAdvisorRequestDto) {
    return this.advisor.analyze(dto.portfolioId);
  }

  @Get('suggestions')
  async suggestions() {
    return {
      stock: ['ASELS neden düştü?', 'THYAO teknik analizi nedir?', 'GARAN için değerlendirme nedir?', 'Bu hisse neden AAA aldı?'],
      portfolio: ['Portföyümü analiz et.', 'Portföy riski nedir?', 'Sektör dağılımım nasıl?', 'Portföy önerileri neler?'],
      macro: ['Makro riskler neler?', 'Piyasa rejimi nedir?', 'Sektör etkileri neler?'],
      scanner: ['Bugün en güvenli hisseler hangileri?', 'Fırsatlar neler?', 'Al sinyali veren hisseler?'],
      ranking: ['En yüksek not alan hisseler?', 'Sıralama nasıl?'],
      risk: ['Portföyümdeki riskler neler?', 'En riskli hisseler hangileri?'],
    };
  }
}
