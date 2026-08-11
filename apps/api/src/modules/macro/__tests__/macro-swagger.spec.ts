import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MacroController } from '../macro.controller';
import { MacroService } from '../macro.service';

describe('Macro OpenAPI document', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MacroController],
      providers: [{ provide: MacroService, useValue: {} }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate an OpenAPI document with the new macro routes', () => {
    const config = new DocumentBuilder().setTitle('BIST Elite API').build();
    const document = SwaggerModule.createDocument(app, config);

    expect(document.paths['/macro/elite-score']).toBeDefined();
    expect(document.paths['/macro/trend']).toBeDefined();
    expect(document.paths['/macro/confidence']).toBeDefined();
    expect(document.paths['/macro/recommendation']).toBeDefined();
    expect(document.paths['/macro/dashboard']).toBeDefined();
    expect(document.paths['/macro/decision-history']).toBeDefined();
  });

  it('should document the confidence query parameter', () => {
    const config = new DocumentBuilder().setTitle('BIST Elite API').build();
    const document = SwaggerModule.createDocument(app, config);

    const parameters = (document.paths['/macro/confidence'].get as any).parameters ?? [];
    const eliteConfidenceParam = parameters.find((p: any) => p.name === 'eliteConfidence');
    expect(eliteConfidenceParam).toBeDefined();
    expect(eliteConfidenceParam.required).toBe(false);
  });
});
