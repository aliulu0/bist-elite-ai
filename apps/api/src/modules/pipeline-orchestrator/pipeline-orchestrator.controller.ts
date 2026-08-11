import { Controller, Get, Post } from '@nestjs/common';
import { PipelineOrchestratorService } from './pipeline-orchestrator.service';

@Controller('pipeline')
export class PipelineOrchestratorController {
  constructor(private readonly pipeline: PipelineOrchestratorService) {}

  @Get('status')
  async getStatus() {
    return {
      metrics: this.pipeline.getMetrics(),
      stepDurations: this.pipeline.getStepDurations(),
    };
  }

  @Get('metrics')
  async getMetrics() {
    return this.pipeline.getMetrics();
  }

  @Post('run')
  async runPipeline() {
    return this.pipeline.runFullPipeline();
  }

  @Post('reset')
  async reset() {
    this.pipeline.reset();
    return { status: 'reset' };
  }
}
