import type { Config } from 'jest';
import base from './jest.config';

process.env.SMOKE_TEST = '1';

const config: Config = {
  ...base,
  roots: ['<rootDir>'],
  testRegex: '.*\\.smoke-spec\\.ts$',
  testTimeout: 300_000,
  setupFiles: ['<rootDir>/modules/market-data/__smoke__/env.loader.ts'],
};

export default config;
