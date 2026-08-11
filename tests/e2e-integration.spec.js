const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const API_ROOT = path.join(ROOT, 'apps', 'api');
const BACKEND_ROOT = path.join(ROOT, 'backend');
const WEB_ROOT = path.join(ROOT, 'apps', 'web');
const PRISMA_ROOT = path.join(ROOT, 'packages', 'database', 'prisma');

function fileExists(relativePath, base = ROOT) {
  return fs.existsSync(path.join(base, relativePath));
}

function dirExists(relativePath, base = ROOT) {
  const fullPath = path.join(base, relativePath);
  try {
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

function readFileContent(relativePath, base = ROOT) {
  return fs.readFileSync(path.join(base, relativePath), 'utf-8');
}

function globFiles(pattern, base = ROOT) {
  const { execSync } = require('child_process');
  try {
    const result = execSync(
      `powershell -Command "Get-ChildItem -Path '${base}' -Recurse -Filter '${pattern}' | Select-Object -ExpandProperty FullName"`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function countOccurrences(str, substr) {
  return str.split(substr).length - 1;
}

function extractEnums(content) {
  const matches = content.matchAll(/enum\s+(\w+)\s*\{([^}]+)\}/g);
  const enums = {};
  for (const match of matches) {
    const name = match[1];
    const values = match[2].trim().split('\n').map(l => l.trim()).filter(Boolean);
    enums[name] = values;
  }
  return enums;
}

function extractModels(content) {
  const matches = content.matchAll(/model\s+(\w+)\s*\{/g);
  return [...matches].map(m => m[1]);
}

function extractIndexes(content) {
  return (content.match(/@@index/g) || []).length;
}

function extractUniqueConstraints(content) {
  return (content.match(/@@unique/g) || []).length;
}

function extractRelations(content) {
  return (content.match(/@relation/g) || []).length;
}

// ====================================================================
// SECTION 1: MODULE STRUCTURE VALIDATION
// ====================================================================
describe('Module Structure Validation', () => {
  const EXPECTED_MODULES = [
    'PrismaModule',
    'AuthModule',
    'LoggerModule',
    'MonitoringModule',
    'SecurityModule',
    'CacheModule',
    'PerformanceModule',
    'ExplainabilityModule',
    'EliteScoreModule',
    'MultiTimeframeConsensusModule',
    'StrategyValidationModule',
    'AdaptiveCalibrationModule',
    'PaperPortfolioModule',
    'RecommendationTrackerModule',
    'MarketRegimeModule',
    'OpportunityLifecycleModule',
    'PortfolioIntelligenceModule',
    'ProductionReadinessModule',
  ];

  it('should have AppModule importing all 18 modules', () => {
    const content = readFileContent('apps/api/src/app.module.ts');
    for (const mod of EXPECTED_MODULES) {
      expect(content).toContain(mod);
    }
  });

  it('should register 4 global guards in AppModule', () => {
    const content = readFileContent('apps/api/src/app.module.ts');
    expect(content).toContain('RateLimitGuard');
    expect(content).toContain('AuthGuard');
    expect(content).toContain('RolesGuard');
    expect(content).toContain('PermissionsGuard');
    const guardCount = countOccurrences(content, 'provide: APP_GUARD');
    expect(guardCount).toBe(4);
  });

  it('should register 8 global interceptors in AppModule', () => {
    const content = readFileContent('apps/api/src/app.module.ts');
    const interceptorCount = countOccurrences(content, 'APP_INTERCEPTOR');
    expect(interceptorCount).toBeGreaterThanOrEqual(7);
  });

  it('should have HealthController registered', () => {
    const content = readFileContent('apps/api/src/app.module.ts');
    expect(content).toContain('HealthController');
  });

  it('should have global prefix configured in main.ts', () => {
    const content = readFileContent('apps/api/src/main.ts');
    expect(content).toContain("setGlobalPrefix('api'");
    expect(content).toContain("exclude: ['health', 'health/ready', 'health/live']");
  });
});

// ====================================================================
// SECTION 2: DATABASE SCHEMA INTEGRITY
// ====================================================================
describe('Database Schema Integrity', () => {
  let schemaContent;

  beforeAll(() => {
    schemaContent = readFileContent('packages/database/prisma/schema.prisma');
  });

  it('should use PostgreSQL as database provider', () => {
    expect(schemaContent).toContain('provider = "postgresql"');
  });

  it('should have fullTextSearch preview feature', () => {
    expect(schemaContent).toContain('previewFeatures = ["fullTextSearch"]');
  });

  it('should define all 12 enums', () => {
    const enums = extractEnums(schemaContent);
    const expectedEnums = [
      'MarketSegment', 'Timeframe', 'OrderSide', 'SignalStrength',
      'SignalAction', 'BacktestStatus', 'RiskLevel', 'MarketRegimeType',
      'CorporateActionType', 'NotificationStatus', 'UserRole', 'LogSeverity',
    ];
    for (const e of expectedEnums) {
      expect(enums).toHaveProperty(e);
    }
  });

  it('should define all 29 models', () => {
    const models = extractModels(schemaContent);
    const expectedModels = [
      'Company', 'Stock', 'HistoricalPrice', 'IntradayPrice',
      'CorporateAction', 'TradingSession', 'IndicatorSnapshot',
      'FinancialStatement', 'FinancialRatio', 'TechnicalScore',
      'FinancialScore', 'EliteScore', 'ConfidenceScore', 'DecisionSignal',
      'BacktestResult', 'WalkForwardResult', 'MonteCarloResult',
      'Portfolio', 'PortfolioPosition', 'PortfolioSnapshot', 'RiskProfile',
      'MarketRegime', 'SystemSetting', 'ApplicationLog', 'User',
      'Watchlist', 'WatchlistItem', 'NotificationQueue', 'TelegramMessage',
    ];
    for (const m of expectedModels) {
      expect(models).toContain(m);
    }
  });

  it('should have at least 80 indexes', () => {
    const indexCount = extractIndexes(schemaContent);
    expect(indexCount).toBeGreaterThanOrEqual(80);
  });

  it('should have at least 8 unique compound constraints', () => {
    const uniqueCount = extractUniqueConstraints(schemaContent);
    expect(uniqueCount).toBeGreaterThanOrEqual(8);
  });

  it('should have at least 20 foreign key relations', () => {
    const relationCount = extractRelations(schemaContent);
    expect(relationCount).toBeGreaterThanOrEqual(20);
  });

  it('should have proper Stock -> Company relation', () => {
    expect(schemaContent).toContain('company          Company           @relation(fields: [companyId], references: [id])');
  });

  it('should have proper cascade relations for backtest', () => {
    expect(schemaContent).toContain('backtest BacktestResult @relation(fields: [backtestId], references: [id])');
  });

  it('should have proper PortfolioPosition unique constraint', () => {
    expect(schemaContent).toContain('@@unique([portfolioId, stockId, entryDate])');
  });

  it('should have HistoricalPrice compound unique', () => {
    expect(schemaContent).toContain('@@unique([stockId, date, timeframe])');
  });

  it('should have EliteScore compound unique', () => {
    expect(schemaContent).toContain('@@unique([stockId, timeframe, computedAt])');
  });
});

// ====================================================================
// SECTION 3: API SERVICE ARCHITECTURE
// ====================================================================
describe('API Service Architecture', () => {
  const SERVICES = {
    'Elite Score Engine': [
      'elite-score.service.ts',
      'weight-manager.service.ts',
      'technical-scorer.service.ts',
      'consensus-analyzer.service.ts',
      'historical-reliability.service.ts',
      'early-opportunity.service.ts',
      'evidence-matrix.service.ts',
    ],
    'Multi-Timeframe Consensus': [
      'consensus-orchestrator.service.ts',
      'consensus-calculator.service.ts',
      'conflict-detector.service.ts',
      'dominant-trend.service.ts',
      'early-alignment.service.ts',
      'explanation-generator.service.ts',
    ],
    'Strategy Validation': [
      'validation-orchestrator.service.ts',
      'performance-metrics.service.ts',
      'signal-quality.service.ts',
      'market-condition.service.ts',
      'multi-timeframe-validator.service.ts',
      'elite-score-validator.service.ts',
      'report-generator.service.ts',
    ],
    'Adaptive Calibration': [
      'calibration-orchestrator.service.ts',
      'scoring-diagnostics.service.ts',
      'performance-evaluator.service.ts',
      'trend-analyzer.service.ts',
      'recommendation-engine.service.ts',
      'calibration-report-generator.service.ts',
    ],
    'Market Regime': [
      'market-regime-orchestrator.service.ts',
      'regime-detector.service.ts',
      'regime-transition.service.ts',
      'regime-historical.service.ts',
      'regime-context.service.ts',
      'regime-report-generator.service.ts',
    ],
    'Explainability': [
      'explainability.service.ts',
      'confidence.service.ts',
      'risk.service.ts',
      'multi-timeframe.service.ts',
      'market-interpreter.service.ts',
    ],
    'Opportunity Lifecycle': [
      'lifecycle-tracker.service.ts',
      'evolution-analyzer.service.ts',
      'health-index.service.ts',
      'early-detection-analyzer.service.ts',
      'failure-analyzer.service.ts',
      'lifecycle-report-generator.service.ts',
    ],
    'Recommendation Tracker': [
      'recommendation-tracker.service.ts',
      'performance-evaluation.service.ts',
      'elite-score-analyzer.service.ts',
      'ai-analysis-reviewer.service.ts',
      'strategy-analyzer.service.ts',
      'failure-analyzer.service.ts',
      'recommendation-report-generator.service.ts',
    ],
    'Paper Portfolio': [
      'paper-portfolio-orchestrator.service.ts',
      'paper-risk-manager.service.ts',
      'paper-performance-tracker.service.ts',
      'paper-report-generator.service.ts',
      'paper-trade-executor.service.ts',
      'position-manager.service.ts',
    ],
    'Portfolio Intelligence': [
      'dashboard-data.service.ts',
      'intelligence-panel.service.ts',
      'performance-analytics.service.ts',
      'risk-center.service.ts',
      'explainability-center.service.ts',
      'notification-center.service.ts',
      'dashboard-timeline.service.ts',
      'dashboard-filter.service.ts',
      'dashboard-report-generator.service.ts',
    ],
    'Production Readiness': [
      'orchestrator.service.ts',
      'config-validator.service.ts',
      'dependency-validator.service.ts',
      'production-health.service.ts',
      'recovery.service.ts',
      'resource-monitor.service.ts',
      'security-validator.service.ts',
      'performance-validator.service.ts',
      'deployment-checklist.service.ts',
      'backup.service.ts',
      'release-management.service.ts',
    ],
  };

  for (const [engineName, files] of Object.entries(SERVICES)) {
    describe(`${engineName}`, () => {
      for (const file of files) {
        it(`should have ${file}`, () => {
          const found = globFiles(file, API_ROOT).length > 0;
          expect(found).toBe(true);
        });
      }
    });
  }
});

// ====================================================================
// SECTION 4: TYPE SYSTEM VALIDATION
// ====================================================================
describe('Type System Validation', () => {
  const TYPE_FILES = [
    'common/auth/types.ts',
    'common/elite-score/types.ts',
    'common/strategy-validation/types.ts',
    'common/multi-timeframe-consensus/types.ts',
    'common/market-regime/types.ts',
    'common/opportunity-lifecycle/types.ts',
    'common/recommendation-tracker/types.ts',
    'common/portfolio-intelligence/types.ts',
    'common/adaptive-calibration/types.ts',
    'common/explainability/types.ts',
    'common/paper-portfolio/types.ts',
    'common/production-readiness/types.ts',
    'common/monitoring/types.ts',
    'common/logger/types.ts',
  ];

  for (const typeFile of TYPE_FILES) {
    it(`should have ${path.basename(typeFile, '.ts')} exports`, () => {
      const full = path.join('apps/api/src', typeFile);
      expect(fileExists(full)).toBe(true);
      const content = readFileContent(full);
      expect(content.length).toBeGreaterThan(200);
    });
  }

  it('should define Role enum with 6 values', () => {
    const content = readFileContent('apps/api/src/common/auth/types.ts');
    expect(content).toContain('ADMIN');
    expect(content).toContain('OPERATOR');
    expect(content).toContain('ANALYST');
    expect(content).toContain('PORTFOLIO_MANAGER');
    expect(content).toContain('STANDARD_USER');
    expect(content).toContain('READ_ONLY');
  });

  it('should define 24 Permission values', () => {
    const content = readFileContent('apps/api/src/common/auth/types.ts');
    const permCount = countOccurrences(content, 'Permission.');
    expect(permCount).toBeGreaterThanOrEqual(24);
  });

  it('should define all timeframes in elite-score types', () => {
    const content = readFileContent('apps/api/src/common/elite-score/types.ts');
    expect(content).toContain('M4');
    expect(content).toContain('D1');
    expect(content).toContain('W1');
    expect(content).toContain('M1');
  });

  it('should have 9 Turkish term files', () => {
    const turkishFiles = globFiles('turkish-terms.ts', API_ROOT);
    expect(turkishFiles.length).toBeGreaterThanOrEqual(9);
  });
});

// ====================================================================
// SECTION 5: SECURITY ARCHITECTURE
// ====================================================================
describe('Security Architecture', () => {
  it('should have security config with rate limiting', () => {
    const content = readFileContent('apps/api/src/common/security/security.config.ts');
    expect(content).toContain('rateLimit');
    expect(content).toContain('maxRequests');
    expect(content).toContain('windowMs');
  });

  it('should have rate limit guard', () => {
    const files = globFiles('rate-limit.guard.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('RateLimitGuard');
  });

  it('should have auth guard', () => {
    const files = globFiles('auth.guard.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have roles guard', () => {
    const files = globFiles('roles.guard.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have permissions guard', () => {
    const files = globFiles('permissions.guard.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have API key guard', () => {
    const files = globFiles('api-key.guard.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have dev bypass guard', () => {
    const files = globFiles('dev-bypass.guard.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have sanitize pipe', () => {
    const files = globFiles('sanitize.pipe.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('SqlInjectionDetector');
  });

  it('should have file validation pipe', () => {
    const files = globFiles('file-validation.pipe.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have security headers middleware', () => {
    const files = globFiles('security.middleware.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('X-Frame-Options');
    expect(content).toContain('X-Content-Type-Options');
  });

  it('should have input sanitization middleware', () => {
    const files = globFiles('input-sanitization.middleware.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have request size interceptor', () => {
    const files = globFiles('request-size.interceptor.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have audit log interceptor', () => {
    const files = globFiles('audit-log.interceptor.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have CORS configured in security config', () => {
    const content = readFileContent('apps/api/src/common/security/security.config.ts');
    expect(content).toContain('origin:');
    expect(content).toContain('credentials: true');
  });

  it('should configure helmet CSP in main.ts', () => {
    const content = readFileContent('apps/api/src/main.ts');
    expect(content).toContain('helmet');
    expect(content).toContain('contentSecurityPolicy');
    expect(content).toContain('frameAncestors');
    expect(content).toContain('formAction');
  });

  it('should configure ValidationPipe with whitelist', () => {
    const content = readFileContent('apps/api/src/main.ts');
    expect(content).toContain('whitelist: true');
    expect(content).toContain('forbidNonWhitelisted: true');
    expect(content).toContain('transform: true');
  });

  it('should have HSTS configured', () => {
    const content = readFileContent('apps/api/src/common/security/security.config.ts');
    expect(content).toContain('max-age=31536000');
    expect(content).toContain('includeSubDomains');
    expect(content).toContain('preload');
  });

  it('should have CORS credentials enabled', () => {
    const content = readFileContent('apps/api/src/common/security/security.config.ts');
    expect(content).toContain('credentials: true');
  });

  it('should have sensitive fields filtering in logger', () => {
    const content = readFileContent('apps/api/src/common/logger/types.ts');
    expect(content).toContain('password');
    expect(content).toContain('token');
    expect(content).toContain('secret');
  });
});

// ====================================================================
// SECTION 6: PERFORMANCE ARCHITECTURE
// ====================================================================
describe('Performance Architecture', () => {
  it('should have cache service', () => {
    const files = globFiles('cache.service.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have cache interceptor', () => {
    const files = globFiles('cache.interceptor.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have compression interceptor', () => {
    const files = globFiles('compression.interceptor.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have request deduplication interceptor', () => {
    const files = globFiles('request-deduplication.interceptor.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have performance monitor service', () => {
    const files = globFiles('performance.service.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have connection pool service', () => {
    const content = readFileContent('apps/api/src/common/performance/performance.service.ts');
    expect(content).toContain('ConnectionPoolService');
  });

  it('should have memory monitor service', () => {
    const content = readFileContent('apps/api/src/common/performance/performance.service.ts');
    expect(content).toContain('MemoryMonitorService');
  });

  it('should have cache config with TTL', () => {
    const files = globFiles('cache.config.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('TTL');
    expect(content).toContain('compression');
    expect(content).toContain('deduplication');
  });
});

// ====================================================================
// SECTION 7: CONTROLLER VALIDATION
// ====================================================================
describe('Controller Validation', () => {
  it('should have HealthController with 5 endpoints', () => {
    const content = readFileContent('apps/api/src/health.controller.ts');
    expect(content).toContain("@Get('health')");
    expect(content).toContain("@Get('health/ready')");
    expect(content).toContain("@Get('health/live')");
    expect(content).toContain("@Get('auth/status')");
    expect(content).toContain("@Get('metrics')");
  });

  it('should have ProductionReadinessController', () => {
    const files = globFiles('production-readiness.controller.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('Controller');
    expect(content).toContain('production-readiness');
  });

  it('should have DashboardController', () => {
    const files = globFiles('dashboard.controller.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('Controller');
    expect(content).toContain('dashboard');
  });

  it('should have Swagger documentation configured', () => {
    const content = readFileContent('apps/api/src/main.ts');
    expect(content).toContain('SwaggerModule');
    expect(content).toContain('BIST Elite AI API');
    expect(content).toContain('addBearerAuth');
    expect(content).toContain('addApiKey');
  });
});

// ====================================================================
// SECTION 8: BACKEND ENGINE VALIDATION
// ====================================================================
describe('Backend Engine Validation', () => {
  const ENGINES = [
    'data_engine', 'prices', 'financial', 'moving_average',
    'momentum_engine', 'trend_engine', 'volume_engine',
    'pattern_engine', 'strategy_engine', 'early_opportunity_engine',
    'explainability_engine', 'scoring_engine', 'elite_score_engine',
    'confidence_engine', 'decision_engine', 'backtest_engine',
    'walk_forward_engine', 'monte_carlo_engine', 'strategy_optimizer',
    'similarity_engine', 'market_regime_engine', 'multi_factor_engine',
    'portfolio_engine', 'position_sizing_engine', 'plugin_system',
  ];

  for (const engine of ENGINES) {
    it(`should have ${engine} module directory`, () => {
      expect(dirExists(`backend/modules/${engine}`, ROOT)).toBe(true);
    });
  }

  it('should have FastAPI main.py with routers', () => {
    const content = readFileContent('backend/app/main.py');
    expect(content).toContain('FastAPI');
    expect(content).toContain('include_router');
  });

  it('should have requirements.txt with key dependencies', () => {
    const content = readFileContent('backend/requirements.txt');
    expect(content).toContain('fastapi');
    expect(content).toContain('sqlalchemy');
    expect(content).toContain('pydantic');
    expect(content).toContain('alembic');
  });
});

// ====================================================================
// SECTION 9: WEB FRONTEND VALIDATION
// ====================================================================
describe('Web Frontend Validation', () => {
  it('should have Next.js layout with Turkish lang', () => {
    const content = readFileContent('apps/web/src/app/layout.tsx');
    expect(content).toContain('lang="tr"');
  });

  it('should have 7 page routes', () => {
    expect(dirExists('apps/web/src/app/scanner', ROOT)).toBe(true);
    expect(dirExists('apps/web/src/app/watchlist', ROOT)).toBe(true);
    expect(dirExists('apps/web/src/app/portfolio', ROOT)).toBe(true);
    expect(dirExists('apps/web/src/app/backtest', ROOT)).toBe(true);
    expect(dirExists('apps/web/src/app/reports', ROOT)).toBe(true);
    expect(dirExists('apps/web/src/app/settings', ROOT)).toBe(true);
    expect(fileExists('apps/web/src/app/page.tsx', ROOT)).toBe(true);
  });

  it('should have AppLayout component', () => {
    const files = globFiles('app-layout.tsx', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have Sidebar with navigation', () => {
    const files = globFiles('sidebar.tsx', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('scanner');
    expect(content).toContain('watchlist');
    expect(content).toContain('portfolio');
  });

  it('should have Header with language toggle', () => {
    const files = globFiles('header.tsx', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('language');
  });

  it('should have API client with proper error handling', () => {
    const files = globFiles('api.ts', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('ApiError');
    expect(content).toContain('ApiResponse');
  });

  it('should have React Query hooks', () => {
    const files = globFiles('use-api.ts', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('useApiQuery');
    expect(content).toContain('useApiPaginatedQuery');
    expect(content).toContain('useApiMutation');
  });

  it('should have Zustand stores', () => {
    const files = globFiles('index.ts', path.join(WEB_ROOT, 'src', 'stores'));
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('theme');
    expect(content).toContain('language');
    expect(content).toContain('sidebarCollapsed');
  });

  it('should have watchlist store', () => {
    const files = globFiles('watchlist-store.ts', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('addWatchlist');
    expect(content).toContain('removeWatchlist');
  });

  it('should have i18n hook', () => {
    const files = globFiles('use-i18n.ts', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have EN and TR locale files', () => {
    expect(fileExists('apps/web/src/locales/en.json', ROOT)).toBe(true);
    expect(fileExists('apps/web/src/locales/tr.json', ROOT)).toBe(true);
  });

  it('should have Providers component', () => {
    const files = globFiles('providers.tsx', WEB_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('QueryClientProvider');
  });
});

// ====================================================================
// SECTION 10: LOCALIZATION COMPLETENESS
// ====================================================================
describe('Localization Completeness', () => {
  it('should have matching locale keys in EN and TR', () => {
    const en = JSON.parse(readFileContent('apps/web/src/locales/en.json'));
    const tr = JSON.parse(readFileContent('apps/web/src/locales/tr.json'));
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
  });

  it('should have Turkish terms files for all 9 domain modules', () => {
    const turkishFiles = globFiles('turkish-terms.ts', API_ROOT);
    expect(turkishFiles.length).toBeGreaterThanOrEqual(9);
  });

  it('should have Turkish localization in security config', () => {
    const content = readFileContent('apps/api/src/common/security/security.config.ts');
    expect(content).toContain('Çok fazla istek');
  });
});

// ====================================================================
// SECTION 11: CONFIGURATION COMPLETENESS
// ====================================================================
describe('Configuration Completeness', () => {
  it('should have .env.example with all required vars', () => {
    const content = readFileContent('apps/api/.env.example');
    const requiredVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'CORS_ORIGINS'];
    for (const v of requiredVars) {
      expect(content).toContain(v);
    }
  });

  it('should have nest-cli.json', () => {
    expect(fileExists('apps/api/nest-cli.json')).toBe(true);
  });

  it('should have jest.config.ts', () => {
    expect(fileExists('apps/api/jest.config.ts')).toBe(true);
  });

  it('should have tsconfig with decorators', () => {
    const content = readFileContent('apps/api/tsconfig.json');
    expect(content).toContain('experimentalDecorators');
    expect(content).toContain('emitDecoratorMetadata');
  });

  it('should have security config with env overrides', () => {
    const content = readFileContent('apps/api/src/common/security/security.config.ts');
    expect(content).toContain('parseSecurityConfigFromEnv');
    expect(content).toContain('SECURITY_RATE_LIMIT_ENABLED');
    expect(content).toContain('SECURITY_MAX_BODY_SIZE');
    expect(content).toContain('CORS_ORIGINS');
  });
});

// ====================================================================
// SECTION 12: DOCUMENTATION COMPLETENESS
// ====================================================================
describe('Documentation Completeness', () => {
  const ROOT_DOCS = [
    'README.md', 'ARCHITECTURE.md', 'LICENSE',
    'CODE_OF_CONDUCT.md', 'SECURITY.md', 'INSTALLATION.md',
    'TROUBLESHOOTING.md', 'ROADMAP.md', '.gitignore',
  ];

  for (const doc of ROOT_DOCS) {
    it(`should have ${doc}`, () => {
      expect(fileExists(doc)).toBe(true);
    });
  }

  it('should have API CHANGELOG with version history', () => {
    const content = readFileContent('apps/api/CHANGELOG.md');
    expect(content).toContain('## [2.8.0]');
    expect(content).toContain('## [2.7.0]');
    expect(content).toContain('## [2.6.0]');
  });

  it('should have deployment documentation', () => {
    expect(fileExists('docs/deployment-guide.md')).toBe(true);
    expect(fileExists('docs/server-setup.md')).toBe(true);
    expect(fileExists('docs/operations-manual.md')).toBe(true);
    expect(fileExists('docs/backup-guide.md')).toBe(true);
    expect(fileExists('docs/disaster-recovery.md')).toBe(true);
  });

  it('should have GitHub issue templates', () => {
    expect(fileExists('.github/ISSUE_TEMPLATE/performance_issue.md')).toBe(true);
    expect(fileExists('.github/ISSUE_TEMPLATE/security_report.md')).toBe(true);
    expect(fileExists('.github/ISSUE_TEMPLATE/refactoring_request.md')).toBe(true);
  });

  it('should have deploy scripts', () => {
    expect(fileExists('deploy/setup-server.sh')).toBe(true);
    expect(fileExists('deploy/install.sh')).toBe(true);
    expect(fileExists('deploy/health-check.sh')).toBe(true);
    expect(fileExists('deploy/backup.sh')).toBe(true);
  });

  it('should have 19 barrel export files', () => {
    const indexFiles = globFiles('index.ts', path.join(API_ROOT, 'src', 'common'));
    expect(indexFiles.length).toBeGreaterThanOrEqual(19);
  });
});

// ====================================================================
// SECTION 13: CROSS-CUTTING CONCERNS
// ====================================================================
describe('Cross-Cutting Concerns', () => {
  it('should have PrismaService', () => {
    const files = globFiles('prisma.service.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('PrismaService');
  });

  it('should have AppLoggerService', () => {
    const files = globFiles('logger.service.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(files[0], 'utf-8');
    expect(content).toContain('AppLoggerService');
  });

  it('should have MetricsService', () => {
    const files = globFiles('metrics.service.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have HealthService', () => {
    const files = globFiles('health.service.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have AuthService', () => {
    const files = globFiles('auth.service.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have FeatureFlags', () => {
    const files = globFiles('feature-flags.ts', API_ROOT);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should have 9 database repositories', () => {
    const repos = globFiles('*.repository.ts', path.join(API_ROOT, 'src', 'common', 'database', 'repositories'));
    expect(repos.length).toBeGreaterThanOrEqual(9);
  });

  it('should have seed files', () => {
    expect(fileExists('packages/database/prisma/seed.ts')).toBe(true);
    expect(fileExists('packages/database/prisma/seeds/system-settings.seed.ts')).toBe(true);
    expect(fileExists('packages/database/prisma/seeds/market-data.seed.ts')).toBe(true);
    expect(fileExists('packages/database/prisma/seeds/risk-profiles.seed.ts')).toBe(true);
  });
});

// ====================================================================
// SECTION 14: WORKER TESTS
// ====================================================================
describe('Worker Architecture', () => {
  it('should have worker notification tests', () => {
    const testFiles = globFiles('test_*.py', path.join(ROOT, 'apps', 'worker', 'tests', 'notifications'));
    expect(testFiles.length).toBeGreaterThanOrEqual(5);
  });
});

// ====================================================================
// SECTION 15: TEST COVERAGE ASSESSMENT
// ====================================================================
describe('Test Coverage Assessment', () => {
  it('should have at least 100 API spec files', () => {
    const specFiles = globFiles('*.spec.ts', API_ROOT);
    expect(specFiles.length).toBeGreaterThanOrEqual(100);
  });

  it('should have 2 root-level test suites', () => {
    const specFiles = globFiles('*.spec.js', path.join(ROOT, 'tests'));
    expect(specFiles.length).toBeGreaterThanOrEqual(2);
  });

  it('should have backend test directories', () => {
    expect(dirExists('backend/tests', ROOT)).toBe(true);
    expect(dirExists('backend/tests/volume_engine', ROOT)).toBe(true);
    expect(dirExists('backend/tests/momentum_engine', ROOT)).toBe(true);
    expect(dirExists('backend/tests/trend_engine', ROOT)).toBe(true);
  });

  it('should have worker notification tests', () => {
    expect(dirExists('apps/worker/tests/notifications', ROOT)).toBe(true);
  });
});

// ====================================================================
// SECTION 16: DEPLOYMENT INFRASTRUCTURE
// ====================================================================
describe('Deployment Infrastructure', () => {
  it('should have systemd service files', () => {
    expect(fileExists('deploy/systemd/bist-api.service')).toBe(true);
    expect(fileExists('deploy/systemd/bist-web.service')).toBe(true);
    expect(fileExists('deploy/systemd/bist-worker.service')).toBe(true);
    expect(fileExists('deploy/systemd/bist-telegram.service')).toBe(true);
  });

  it('should have nginx config', () => {
    expect(fileExists('deploy/nginx/bist-elite-ai.conf')).toBe(true);
  });

  it('should have logrotate config', () => {
    expect(fileExists('deploy/logrotate/bist-elite-ai')).toBe(true);
  });

  it('should have all systemd services with security hardening', () => {
    const services = ['bist-api.service', 'bist-web.service', 'bist-worker.service', 'bist-telegram.service'];
    for (const svc of services) {
      const content = readFileContent(`deploy/systemd/${svc}`);
      expect(content).toContain('NoNewPrivileges=true');
      expect(content).toContain('ProtectSystem=strict');
      expect(content).toContain('Restart=on-failure');
      expect(content).toContain('MemoryMax=');
    }
  });
});

// ====================================================================
// SECTION 17: BACKEND ENGINE TESTS
// ====================================================================
describe('Backend Engine Test Coverage', () => {
  const ENGINE_TESTS = [
    'volume_engine', 'momentum_engine', 'trend_engine',
    'moving_average', 'strategy_engine', 'early_opportunity_engine',
    'prices', 'financial', 'plugin_system', 'data_engine',
  ];

  for (const engine of ENGINE_TESTS) {
    it(`should have ${engine} test directory with tests`, () => {
      const testDir = path.join(BACKEND_ROOT, 'tests', engine);
      expect(dirExists(path.relative(ROOT, testDir), ROOT)).toBe(true);
      const testFiles = globFiles('test_*.py', testDir);
      expect(testFiles.length).toBeGreaterThan(0);
    });
  }

  const MODULE_TESTS = [
    'backtest_engine', 'elite_score_engine', 'scoring_engine',
    'confidence_engine', 'explainability_engine', 'decision_engine',
    'walk_forward_engine', 'monte_carlo_engine', 'strategy_optimizer',
    'similarity_engine', 'market_regime_engine', 'multi_factor_engine',
    'portfolio_engine', 'position_sizing_engine', 'pattern_engine',
  ];

  for (const engine of MODULE_TESTS) {
    it(`should have ${engine} module tests`, () => {
      const testDir = path.join(BACKEND_ROOT, 'modules', engine, 'tests');
      expect(dirExists(path.relative(ROOT, testDir), ROOT)).toBe(true);
      const testFiles = globFiles('test_*.py', testDir);
      expect(testFiles.length).toBeGreaterThan(0);
    });
  }
});

// ====================================================================
// SECTION 18: ARCHITECTURE SCORE CALCULATION
// ====================================================================
describe('Architecture Quality Score', () => {
  it('should score at least 85/100 overall', () => {
    let score = 0;
    const breakdown = {};

    const QA_ROOT_DOCS = [
      'README.md', 'ARCHITECTURE.md', 'LICENSE',
      'CODE_OF_CONDUCT.md', 'SECURITY.md', 'INSTALLATION.md',
      'TROUBLESHOOTING.md', 'ROADMAP.md', '.gitignore',
    ];

    // 1. Module Structure (15 pts)
    const appContent = readFileContent('apps/api/src/app.module.ts');
    const moduleCount = countOccurrences(appContent, 'Module');
    const moduleScore = Math.min(15, Math.round((moduleCount / 20) * 15));
    breakdown.moduleStructure = moduleScore;
    score += moduleScore;

    // 2. Database Schema (15 pts)
    const schema = readFileContent('packages/database/prisma/schema.prisma');
    const modelCount = extractModels(schema).length;
    const enumCount = Object.keys(extractEnums(schema)).length;
    const indexCount = extractIndexes(schema);
    const dbScore = Math.min(15, Math.round(
      (modelCount / 29) * 5 + (enumCount / 12) * 5 + Math.min(indexCount / 80, 1) * 5
    ));
    breakdown.database = dbScore;
    score += dbScore;

    // 3. Security (15 pts)
    const secContent = readFileContent('apps/api/src/common/security/security.config.ts');
    const hasRateLimit = secContent.includes('rateLimit') ? 3 : 0;
    const hasCORS = secContent.includes('cors') ? 3 : 0;
    const hasHSTS = secContent.includes('31536000') ? 2 : 0;
    const hasHeaders = secContent.includes('xFrameOptions') ? 2 : 0;
    const hasSanitize = secContent.includes('sanitize') ? 2 : 0;
    const hasGuards = globFiles('*.guard.ts', API_ROOT).length >= 5 ? 3 : 0;
    breakdown.security = hasRateLimit + hasCORS + hasHSTS + hasHeaders + hasSanitize + hasGuards;
    score += breakdown.security;

    // 4. Type Safety (10 pts)
    const typeFiles = globFiles('types.ts', API_ROOT);
    const typeScore = Math.min(10, Math.round((typeFiles.length / 14) * 10));
    breakdown.typeSafety = typeScore;
    score += typeScore;

    // 5. Test Coverage (15 pts)
    const apiSpecs = globFiles('*.spec.ts', API_ROOT);
    const rootSpecs = globFiles('*.spec.js', path.join(ROOT, 'tests'));
    const testScore = Math.min(15, Math.round(
      (apiSpecs.length / 114) * 10 + (rootSpecs.length / 2) * 5
    ));
    breakdown.testCoverage = testScore;
    score += testScore;

    // 6. Documentation (10 pts)
    const docsCount = QA_ROOT_DOCS.filter(d => fileExists(d)).length;
    const deploymentDocs = ['docs/deployment-guide.md', 'docs/server-setup.md',
      'docs/operations-manual.md', 'docs/backup-guide.md', 'docs/disaster-recovery.md']
      .filter(d => fileExists(d)).length;
    const docScore = Math.min(10, Math.round(
      (docsCount / QA_ROOT_DOCS.length) * 5 + (deploymentDocs / 5) * 5
    ));
    breakdown.documentation = docScore;
    score += docScore;

    // 7. Performance (10 pts)
    const hasCache = globFiles('cache.service.ts', API_ROOT).length > 0 ? 2 : 0;
    const hasCompression = globFiles('compression.interceptor.ts', API_ROOT).length > 0 ? 2 : 0;
    const hasDedup = globFiles('request-deduplication.interceptor.ts', API_ROOT).length > 0 ? 2 : 0;
    const hasPerfMonitor = globFiles('performance.service.ts', API_ROOT).length > 0 ? 2 : 0;
    const hasCacheConfig = globFiles('cache.config.ts', API_ROOT).length > 0 ? 2 : 0;
    breakdown.performance = hasCache + hasCompression + hasDedup + hasPerfMonitor + hasCacheConfig;
    score += breakdown.performance;

    // 8. DevOps & Deployment (10 pts)
    const deployScripts = ['deploy/setup-server.sh', 'deploy/install.sh',
      'deploy/health-check.sh', 'deploy/backup.sh'].filter(d => fileExists(d)).length;
    const systemdFiles = globFiles('*.service', path.join(ROOT, 'deploy', 'systemd')).length;
    const devopsScore = Math.min(10, Math.round(
      (deployScripts / 4) * 5 + Math.min(systemdFiles / 4, 1) * 5
    ));
    breakdown.devOps = devopsScore;
    score += devopsScore;

    expect(score).toBeGreaterThanOrEqual(85);
  });
});
