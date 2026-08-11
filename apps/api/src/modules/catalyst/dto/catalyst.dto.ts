import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CatalystCategory,
  CatalystEvent,
  CatalystResult,
  ExpectedImpact,
  TimeHorizon,
} from '../catalyst.types';
import { AiResearchSource, ResearchImportance } from '../../ai-research/ai-research.types';

export class CatalystEventDto {
  @ApiProperty({ example: 'cat-THYAO.IS-0-1a2b' })
  id!: string;

  @ApiProperty({ example: 'THYAO.IS' })
  ticker!: string;

  @ApiProperty({ example: 'tender_win', enum: ['tender_win', 'dividend', 'minor_news'] })
  category!: CatalystCategory;

  @ApiProperty({ example: 'Yeni ihale kazanıldı' })
  title!: string;

  @ApiProperty({ example: 'Şirket yeni bir kamu ihalesi kazandı.' })
  description!: string;

  @ApiProperty({ example: 'high', enum: ['low', 'medium', 'high', 'critical'] })
  importance!: ResearchImportance;

  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty({ example: 92 })
  verificationScore!: number;

  @ApiProperty({ example: '2026-08-07T10:00:00.000Z' })
  date!: string;

  @ApiProperty({ example: 'KAP' })
  source!: string;

  @ApiProperty({ example: 'kap' })
  provider!: string;

  @ApiPropertyOptional({ example: 'https://kap.org.tr/1' })
  url?: string;

  @ApiProperty({ example: 'very_bullish', enum: ['very_bullish', 'bullish', 'neutral', 'bearish', 'very_bearish'] })
  expectedImpact!: ExpectedImpact;

  @ApiProperty({ example: '1_week', enum: ['immediate', '1_day', '1_week', '1_month', '3_months', '6_months'] })
  timeHorizon!: TimeHorizon;

  @ApiProperty({ example: 0.91 })
  confidence!: number;

  @ApiProperty({ example: 95 })
  catalystScore!: number;

  @ApiProperty({ example: ['ihale kazan'] })
  keywords!: string[];

  static from(event: CatalystEvent): CatalystEventDto {
    return { ...event };
  }
}

export class CatalystResultDto {
  @ApiProperty({ example: 'THYAO.IS' })
  ticker!: string;

  @ApiProperty({ example: 94, description: 'Katalizör puanı (0-100)' })
  catalystScore!: number;

  @ApiProperty({ example: 91, description: 'Güven oranı (%)' })
  confidence!: number;

  @ApiProperty({ example: 'very_bullish' })
  expectedImpact!: ExpectedImpact;

  @ApiProperty({ type: CatalystEventDto, isArray: true })
  events!: CatalystEventDto[];

  @ApiProperty({ example: 3 })
  verifiedCount!: number;

  @ApiProperty({ example: 5 })
  totalCount!: number;

  @ApiProperty({ type: Object, isArray: true })
  rawSources!: AiResearchSource[];

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  generatedAt!: string;

  static from(result: CatalystResult): CatalystResultDto {
    return {
      ...result,
      events: result.events.map(CatalystEventDto.from),
    };
  }
}

export class CatalystTopDto {
  @ApiProperty({ type: CatalystResultDto, isArray: true })
  results!: CatalystResultDto[];

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  generatedAt!: string;
}

export class CatalystRefreshDto {
  @ApiProperty({ example: 'THYAO.IS' })
  ticker!: string;

  @ApiProperty({ type: CatalystResultDto })
  result!: CatalystResultDto;
}
