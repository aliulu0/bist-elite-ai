import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { NewsAggregationService } from './news-aggregation.service';
import { ResearchQueryDto, ResearchResponseDto, ResearchArticleDto } from './dto/research.dto';
import { ResearchArticle, ResearchFilter, ResearchProviderStatus } from './interfaces/research.types';

@ApiTags('Research')
@Controller('research')
export class ResearchController {
  constructor(private readonly newsAggregation: NewsAggregationService) {}

  @Get('news')
  @Public()
  @ApiOperation({ summary: 'Get aggregated market research news' })
  async getNews(@Query() query: ResearchQueryDto): Promise<ResearchResponseDto> {
    const articles = await this.newsAggregation.getNews(this.toFilter(query));
    return this.paginate(articles, query);
  }

  @Get('news/company/:ticker')
  @Public()
  @ApiOperation({ summary: 'Get research news for a specific company' })
  async getCompanyNews(
    @Param('ticker') ticker: string,
    @Query() query: ResearchQueryDto,
  ): Promise<ResearchResponseDto> {
    const articles = await this.newsAggregation.getCompanyNews(ticker, this.toFilter(query));
    return this.paginate(articles, query);
  }

  @Get('news/sector/:sector')
  @Public()
  @ApiOperation({ summary: 'Get research news for a specific sector' })
  async getSectorNews(
    @Param('sector') sector: string,
    @Query() query: ResearchQueryDto,
  ): Promise<ResearchResponseDto> {
    const articles = await this.newsAggregation.getSectorNews(sector, this.toFilter(query));
    return this.paginate(articles, query);
  }

  @Get('news/economic')
  @Public()
  @ApiOperation({ summary: 'Get economic and macroeconomic research news' })
  async getEconomicNews(@Query() query: ResearchQueryDto): Promise<ResearchResponseDto> {
    const articles = await this.newsAggregation.getEconomicNews(this.toFilter(query));
    return this.paginate(articles, query);
  }

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Get research provider status' })
  getStatus(): ResearchProviderStatus[] {
    return this.newsAggregation.getProviderStatus();
  }

  private toFilter(query: ResearchQueryDto): ResearchFilter {
    return {
      company: query.company,
      sector: query.sector,
      fromDate: query.fromDate,
      toDate: query.toDate,
      source: query.source,
      language: query.language,
      importance: query.importance,
      ticker: query.ticker,
      keywords: query.keywords?.split(',').map((keyword) => keyword.trim()).filter(Boolean),
    };
  }

  private paginate(articles: ResearchArticle[], query: ResearchQueryDto): ResearchResponseDto {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = articles.length;
    const start = (page - 1) * limit;
    const data = articles.slice(start, start + limit).map((article) => this.toDto(article));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toDto(article: ResearchArticle): ResearchArticleDto {
    return {
      id: article.id,
      source: article.source,
      provider: article.provider,
      title: article.title,
      summary: article.summary,
      publishedAt: article.publishedAt,
      url: article.url,
      company: article.company,
      sector: article.sector,
      country: article.country,
      language: article.language,
      importance: article.importance,
      tags: article.tags,
      sentiment: article.sentiment,
    };
  }
}