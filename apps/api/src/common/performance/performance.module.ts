import { Module, Global } from '@nestjs/common';
import { CompressionInterceptor, ETagInterceptor } from './compression.interceptor';
import { RequestDeduplicationInterceptor } from './request-deduplication.interceptor';
import {
  ConnectionPoolService,
  MemoryMonitorService,
  PerformanceMonitorService,
} from './performance.service';

const performanceMonitorProvider = {
  provide: PerformanceMonitorService,
  useFactory: () => new PerformanceMonitorService(),
};

@Global()
@Module({
  providers: [
    performanceMonitorProvider,
    CompressionInterceptor,
    ETagInterceptor,
    RequestDeduplicationInterceptor,
    ConnectionPoolService,
    MemoryMonitorService,
  ],
  exports: [
    PerformanceMonitorService,
    CompressionInterceptor,
    ETagInterceptor,
    RequestDeduplicationInterceptor,
    ConnectionPoolService,
    MemoryMonitorService,
  ],
})
export class PerformanceModule {}
