import { ApiProperty } from '@nestjs/swagger';
import { EarlySignal, EarlySignalScannerResult, SignalConvergenceSummary } from './early-signal.types';

export class EarlySignalDto {
  @ApiProperty({ example: 'THYAO:SMART_MONEY:accumulation' })
  id!: string;

  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 'SMART_MONEY', enum: ['PRICE_VOLUME', 'SMART_MONEY', 'FUNDAMENTAL', 'CATALYST', 'MULTI_TIMEFRAME', 'MARKET_STRUCTURE'] })
  category!: string;

  @ApiProperty({ example: 'accumulation' })
  type!: string;

  @ApiProperty({ example: 'EARLY', enum: ['EARLY', 'CONFIRMED'] })
  phase!: string;

  @ApiProperty({ example: 78 })
  strength!: number;

  @ApiProperty({ example: 'Strong', enum: ['Weak', 'Medium', 'Strong', 'Very Strong'] })
  strengthLabel!: string;

  @ApiProperty({ example: 'HIGH', enum: ['HIGH', 'MEDIUM', 'LOW'] })
  priority!: string;

  @ApiProperty({ example: 'Kurumsal birikim 78/100 — akıllı para topluyor.' })
  description!: string;

  @ApiProperty({ type: [String], example: ['smartMoney.accumulationScore'] })
  sourceFields!: string[];

  @ApiProperty()
  detectedAt!: string;

  static from(signal: EarlySignal): EarlySignalDto {
    const dto = new EarlySignalDto();
    dto.id = signal.id;
    dto.ticker = signal.ticker;
    dto.category = signal.category;
    dto.type = signal.type;
    dto.phase = signal.phase;
    dto.strength = signal.strength;
    dto.strengthLabel = signal.strengthLabel;
    dto.priority = signal.priority;
    dto.description = signal.description;
    dto.sourceFields = signal.sourceFields;
    dto.detectedAt = signal.detectedAt;
    return dto;
  }
}

export class SignalConvergenceDto {
  @ApiProperty({ example: 72 })
  convergenceScore!: number;

  @ApiProperty({ example: 8 })
  totalSignals!: number;

  @ApiProperty({ example: 5 })
  strongSignalCount!: number;

  @ApiProperty({ example: 5 })
  earlyCount!: number;

  @ApiProperty({ example: 3 })
  confirmedCount!: number;

  @ApiProperty({ example: 5 })
  categoryCoverage!: number;

  @ApiProperty({ example: 71.4 })
  avgStrength!: number;

  @ApiProperty({ example: 38 })
  confirmedShare!: number;

  @ApiProperty({ type: [EarlySignalDto] })
  strongestSignals!: EarlySignalDto[];

  static from(convergence: SignalConvergenceSummary): SignalConvergenceDto {
    const dto = new SignalConvergenceDto();
    dto.convergenceScore = convergence.convergenceScore;
    dto.totalSignals = convergence.totalSignals;
    dto.strongSignalCount = convergence.strongSignalCount;
    dto.earlyCount = convergence.earlyCount;
    dto.confirmedCount = convergence.confirmedCount;
    dto.categoryCoverage = convergence.categoryCoverage;
    dto.avgStrength = convergence.avgStrength;
    dto.confirmedShare = convergence.confirmedShare;
    dto.strongestSignals = convergence.strongestSignals.map(EarlySignalDto.from);
    return dto;
  }
}

export class EarlySignalScannerResultDto {
  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 'Türk Hava Yolları' })
  company!: string;

  @ApiProperty({ example: 'Ulaştırma' })
  sector!: string;

  @ApiProperty({ type: [EarlySignalDto] })
  signals!: EarlySignalDto[];

  @ApiProperty({ type: SignalConvergenceDto })
  convergence!: SignalConvergenceDto;

  @ApiProperty({ nullable: true, example: 'DATA_VERIFIED' })
  dataQualityStatus!: string | null;

  @ApiProperty()
  scannedAt!: string;

  static from(result: EarlySignalScannerResult): EarlySignalScannerResultDto {
    const dto = new EarlySignalScannerResultDto();
    dto.ticker = result.ticker;
    dto.company = result.company;
    dto.sector = result.sector;
    dto.signals = result.signals.map(EarlySignalDto.from);
    dto.convergence = SignalConvergenceDto.from(result.convergence);
    dto.dataQualityStatus = result.dataQualityStatus;
    dto.scannedAt = result.scannedAt;
    return dto;
  }
}
