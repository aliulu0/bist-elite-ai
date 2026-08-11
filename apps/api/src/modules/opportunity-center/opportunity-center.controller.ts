import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { OpportunityCenterService } from './opportunity-center.service';
import {
  EliteScoreResponseDto,
  OpportunityCenterHubDto,
  OpportunityCenterListResponseDto,
} from './opportunity-center.dto';

@ApiTags('Fırsat Merkezi')
@Controller('opportunity-center')
export class OpportunityCenterController {
  constructor(private readonly service: OpportunityCenterService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI Fırsat Merkezi — tüm sekmeler' })
  @ApiResponse({ status: 200, description: 'Fırsat merkezi merkezi (12 sekme)', type: OpportunityCenterHubDto })
  hub(): OpportunityCenterHubDto {
    this.service.sync();
    const hub = this.service.hub();
    return {
      baslik: hub.baslik,
      olusturmaZamani: hub.olusturmaZamani,
      toplamKart: hub.toplamKart,
      sekmeler: hub.sekmeler,
    };
  }

  @Get('top10')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü 10 fırsat' })
  @ApiResponse({ status: 200, description: 'Top 10 fırsatlar', type: OpportunityCenterListResponseDto })
  top10(): OpportunityCenterListResponseDto {
    this.service.sync();
    return { baslik: 'Top 10 Fırsatlar', toplamKart: this.service.top10().length, kartlar: this.service.top10() };
  }

  @Get('top20')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü 20 fırsat' })
  @ApiResponse({ status: 200, description: 'Top 20 fırsatlar', type: OpportunityCenterListResponseDto })
  top20(): OpportunityCenterListResponseDto {
    this.service.sync();
    return { baslik: 'Top 20 Fırsatlar', toplamKart: this.service.top20().length, kartlar: this.service.top20() };
  }

  @Get('today')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bugünün Fırsatları' })
  @ApiResponse({ status: 200, description: 'Bugünün fırsatları', type: OpportunityCenterListResponseDto })
  today(): OpportunityCenterListResponseDto {
    this.service.sync();
    return { baslik: 'Bugünün Fırsatları', toplamKart: this.service.today().length, kartlar: this.service.today() };
  }

  @Get('tomorrow')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yarın Artacaklar (gece analizi aday listesi)' })
  @ApiResponse({ status: 200, description: 'Yarın aday listesi', type: OpportunityCenterListResponseDto })
  tomorrow(): OpportunityCenterListResponseDto {
    this.service.sync();
    return { baslik: 'Yarın Artacaklar', toplamKart: this.service.tomorrow().length, kartlar: this.service.tomorrow() };
  }

  @Get('momentum')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Momentum stratejisi fırsatları' })
  @ApiResponse({ status: 200, description: 'Momentum adayları', type: OpportunityCenterListResponseDto })
  momentum(): OpportunityCenterListResponseDto {
    this.service.sync();
    return { baslik: 'Momentum Fırsatları', toplamKart: this.service.momentum().length, kartlar: this.service.momentum() };
  }

  @Get('value')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Değer Avcıları stratejisi fırsatları' })
  @ApiResponse({ status: 200, description: 'Değer Avcıları adayları', type: OpportunityCenterListResponseDto })
  value(): OpportunityCenterListResponseDto {
    this.service.sync();
    return { baslik: 'Değer Avcıları Fırsatları', toplamKart: this.service.value().length, kartlar: this.service.value() };
  }

  @Get('smart-money')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Smart Money stratejisi fırsatları' })
  @ApiResponse({ status: 200, description: 'Smart Money adayları', type: OpportunityCenterListResponseDto })
  smartMoney(): OpportunityCenterListResponseDto {
    this.service.sync();
    return { baslik: 'Smart Money Fırsatları', toplamKart: this.service.smartMoney().length, kartlar: this.service.smartMoney() };
  }

  @Get('elite-score')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Elite Score zaman dilimleri (günlük/haftalık/aylık/3 aylık/6 aylık)' })
  @ApiResponse({ status: 200, description: 'Elite Score zaman dilimleri', type: EliteScoreResponseDto })
  eliteScore(): EliteScoreResponseDto {
    this.service.sync();
    const zamanlar = this.service.eliteScore();
    return {
      baslik: 'Elite Score',
      olusturmaZamani: new Date().toISOString(),
      not: 'Günlük, Haftalık, Aylık, 3 Aylık ve 6 Aylık Elite skorları üretim değerlerinden hesaplanır.',
      zamanlar: zamanlar.map((t) => ({
        zaman: t.zaman,
        etiket: t.etiket,
        skor: t.skor,
        kartSayisi: t.kartlar.length,
        kartlar: t.kartlar,
      })),
    };
  }
}
