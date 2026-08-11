import './common/validation/load-env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SchedulerEngine } from './modules/scheduler/scheduler.engine';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const engine = app.get(SchedulerEngine);
  engine.start();

  const status = engine.getStatus();
  const activeJobs = status.jobs.filter((j) => j.enabled).length;
  console.log(`Scheduler started with ${activeJobs} active jobs`);

  const shutdown = async () => {
    console.log('Scheduler shutting down...');
    engine.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Scheduler failed to start:', err);
  process.exit(1);
});
