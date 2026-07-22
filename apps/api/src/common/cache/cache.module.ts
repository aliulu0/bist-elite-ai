import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheInterceptor, ResponseCacheInterceptor } from './cache.interceptor';
import { getCacheConfig, CacheConfig } from './cache.config';

const cacheConfig = getCacheConfig();

const cacheServiceProvider = {
  provide: CacheService,
  useFactory: () => new CacheService(cacheConfig),
};

const cacheInterceptorProvider = {
  provide: CacheInterceptor,
  inject: [CacheService],
  useFactory: (cacheService: CacheService) => new CacheInterceptor(cacheService, cacheConfig),
};

@Global()
@Module({
  providers: [cacheServiceProvider, cacheInterceptorProvider, ResponseCacheInterceptor],
  exports: [CacheService, CacheInterceptor, ResponseCacheInterceptor],
})
export class CacheModule {}
