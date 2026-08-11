import { Module } from '@nestjs/common';
import { PipelineGateway } from './websocket-gateway';
import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PipelineGateway],
  exports: [PipelineGateway],
})
export class WebSocketGatewayModule {}
