import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let configContent: string;

beforeAll(() => {
  configContent = readFileSync(
    resolve(__dirname, '../../vite.config.ts'),
    'utf-8',
  );
});

describe('Vite Proxy Configuration', () => {
  it('should proxy /api to backend on port 3001', () => {
    expect(configContent).toContain("'/api'");
    expect(configContent).toContain('3001');
  });

  it('should proxy /health to backend on port 3001', () => {
    expect(configContent).toContain("'/health'");
    expect(configContent).toContain('3001');
  });

  it('should have exactly 2 proxy routes', () => {
    const proxyMatches = configContent.match(/'\/[a-z]+'/g);
    const proxyRoutes = proxyMatches?.filter(m => m === "'/api'" || m === "'/health'");
    expect(proxyRoutes).toHaveLength(2);
  });

  it('should run dev server on port 5173', () => {
    expect(configContent).toContain('port: 5173');
  });

  it('should expose to network (host: true)', () => {
    expect(configContent).toContain('host: true');
  });

  it('should run preview server on port 3000', () => {
    expect(configContent).toContain('port: 3000');
  });

  it('should have react plugin configured', () => {
    expect(configContent).toContain('react()');
    expect(configContent).toContain('@vitejs/plugin-react');
  });

  it('should have path alias configured', () => {
    expect(configContent).toContain("resolve(");
    expect(configContent).toContain("'@'");
  });

  it('should have vitest configuration', () => {
    expect(configContent).toContain("environment: 'jsdom'");
    expect(configContent).toContain('globals: true');
  });

  it('should have coverage configuration', () => {
    expect(configContent).toContain("provider: 'v8'");
    expect(configContent).toContain("'text'");
  });

  it('should use changeOrigin for proxies', () => {
    expect(configContent).toContain('changeOrigin: true');
  });

  it('should support VITE_API_URL env override', () => {
    expect(configContent).toContain('VITE_API_URL');
  });
});
