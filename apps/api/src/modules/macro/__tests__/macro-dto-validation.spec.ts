import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MacroConfidenceQueryDto } from '../dto/macro-elite.dto';

describe('MacroConfidenceQueryDto validation', () => {
  it('should accept a valid eliteConfidence value', async () => {
    const dto = plainToInstance(MacroConfidenceQueryDto, { eliteConfidence: 70 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.eliteConfidence).toBe(70);
  });

  it('should be valid when eliteConfidence is absent', async () => {
    const dto = plainToInstance(MacroConfidenceQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.eliteConfidence).toBeUndefined();
  });

  it('should accept a fractional 0-1 confidence', async () => {
    const dto = plainToInstance(MacroConfidenceQueryDto, { eliteConfidence: '0.7' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.eliteConfidence).toBe(0.7);
  });

  it('should reject negative values', async () => {
    const dto = plainToInstance(MacroConfidenceQueryDto, { eliteConfidence: -5 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject values above 100', async () => {
    const dto = plainToInstance(MacroConfidenceQueryDto, { eliteConfidence: 150 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-numeric values', async () => {
    const dto = plainToInstance(MacroConfidenceQueryDto, { eliteConfidence: 'abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
