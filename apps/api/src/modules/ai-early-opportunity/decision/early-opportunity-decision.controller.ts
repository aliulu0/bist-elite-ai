import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EarlyOpportunityDecisionService } from './early-opportunity-decision.service';
import { EarlyOpportunityDecisionDto } from './early-opportunity-decision.dto';

@ApiTags('ai-early-opportunity-decision')
@Controller('ai-early-opportunity/decision')
export class EarlyOpportunityDecisionController {
  constructor(private readonly decisionService: EarlyOpportunityDecisionService) {}

  @Get(':ticker')
  @ApiOperation({ summary: 'Early opportunity decision for a ticker' })
  async evaluate(@Param('ticker') ticker: string): Promise<EarlyOpportunityDecisionDto> {
    const decision = await this.decisionService.evaluate(ticker);
    return EarlyOpportunityDecisionDto.from(decision);
  }
}
