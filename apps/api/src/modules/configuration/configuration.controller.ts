import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { ConfigurationService } from './configuration.service';
import { ConfigDomain, ConfigValue } from './configuration.types';
import {
  DomainParamDto,
  HistoryQueryDto,
  ProfileIdParamDto,
  SnapshotIdParamDto,
  VALID_DOMAINS,
  SetValueDto,
  CreateProfileDto,
  DuplicateProfileDto,
  CreateSnapshotDto,
  ConfigurationPageDto,
  ConfigurationDomainPageDto,
  ConfigurationProfilesPageDto,
  ConfigurationSnapshotsPageDto,
  ConfigurationHistoryPageDto,
  ConfigurationStatisticsPageDto,
  ConfigurationSetValueResponseDto,
  ConfigurationResetResponseDto,
  ConfigurationResetDomainResponseDto,
  ConfigurationProfileResponseDto,
  ConfigurationProfileActionResponseDto,
  ConfigurationSnapshotResponseDto,
  ConfigurationSnapshotActionResponseDto,
  ConfigurationErrorDto,
} from './dto';

@ApiTags('Configuration')
@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all configuration domains' })
  @ApiResponse({ status: 200, description: 'All configurations', type: ConfigurationPageDto })
  getAll(): ConfigurationPageDto {
    const domains = this.service.getAll();
    const version = this.service.getStats().version;
    return {
      success: true,
      data: {
        totalDomains: Object.keys(domains).length,
        domains,
        version,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('profiles')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all configuration profiles' })
  @ApiResponse({ status: 200, description: 'Configuration profiles', type: ConfigurationProfilesPageDto })
  getProfiles(): ConfigurationProfilesPageDto {
    const profiles = this.service.getProfiles();
    return {
      success: true,
      data: profiles,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('snapshots')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all configuration snapshots' })
  @ApiResponse({ status: 200, description: 'Configuration snapshots', type: ConfigurationSnapshotsPageDto })
  getSnapshots(): ConfigurationSnapshotsPageDto {
    const snapshots = this.service.getSnapshots();
    return {
      success: true,
      data: snapshots,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('history')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get configuration change history' })
  @ApiResponse({ status: 200, description: 'Configuration history', type: ConfigurationHistoryPageDto })
  getHistory(@Query() query: HistoryQueryDto): ConfigurationHistoryPageDto {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const { entries, total } = this.service.getHistory(limit, offset);
    return {
      success: true,
      data: { entries, total, limit, offset },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('statistics')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get configuration statistics' })
  @ApiResponse({ status: 200, description: 'Configuration statistics', type: ConfigurationStatisticsPageDto })
  getStatistics(): ConfigurationStatisticsPageDto {
    const stats = this.service.getStats();
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':domain')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single domain configuration' })
  @ApiParam({ name: 'domain', enum: VALID_DOMAINS, description: 'Configuration domain' })
  @ApiResponse({ status: 200, description: 'Domain configuration', type: ConfigurationDomainPageDto })
  @ApiBadRequestResponse({ description: 'Invalid domain', type: ConfigurationErrorDto })
  getDomain(@Param() params: DomainParamDto): ConfigurationDomainPageDto {
    this.ensureValidDomain(params.domain);
    const config = this.service.getDomain(params.domain as ConfigDomain);
    return {
      success: true,
      data: { domain: params.domain, config },
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':domain/value')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a single configuration value' })
  @ApiParam({ name: 'domain', enum: VALID_DOMAINS, description: 'Configuration domain' })
  @ApiResponse({ status: 200, description: 'Value updated', type: ConfigurationSetValueResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid domain', type: ConfigurationErrorDto })
  setValue(
    @Param() params: DomainParamDto,
    @Body() body: SetValueDto,
  ): ConfigurationSetValueResponseDto {
    this.ensureValidDomain(params.domain);
    const version = this.service.setValue(
      params.domain as ConfigDomain,
      body.key,
      body.value as ConfigValue,
      body.user,
      body.comment,
    );
    return {
      success: true,
      message: `Key '${body.key}' updated in domain '${params.domain}'`,
      version,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset all configuration to defaults' })
  @ApiResponse({ status: 200, description: 'All configuration reset', type: ConfigurationResetResponseDto })
  resetAll(): ConfigurationResetResponseDto {
    this.service.resetAll();
    return {
      success: true,
      message: 'All configuration has been reset to defaults',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset/:domain')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset single domain to defaults' })
  @ApiParam({ name: 'domain', enum: VALID_DOMAINS, description: 'Configuration domain' })
  @ApiResponse({ status: 200, description: 'Domain reset', type: ConfigurationResetDomainResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid domain', type: ConfigurationErrorDto })
  resetDomain(@Param() params: DomainParamDto): ConfigurationResetDomainResponseDto {
    this.ensureValidDomain(params.domain);
    this.service.resetDomain(params.domain as ConfigDomain);
    return {
      success: true,
      message: `Domain '${params.domain}' has been reset to defaults`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('profile/load/:id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Load a configuration profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile loaded', type: ConfigurationProfileActionResponseDto })
  @ApiNotFoundResponse({ description: 'Profile not found', type: ConfigurationErrorDto })
  loadProfile(@Param() params: ProfileIdParamDto): ConfigurationProfileActionResponseDto {
    const loaded = this.service.loadProfile(params.id);
    if (!loaded) {
      throw new NotFoundException(`Profile '${params.id}' not found`);
    }
    return {
      success: true,
      message: 'Profile loaded successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('profile/create')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new configuration profile' })
  @ApiResponse({ status: 200, description: 'Profile created', type: ConfigurationProfileResponseDto })
  createProfile(@Body() body: CreateProfileDto): ConfigurationProfileResponseDto {
    const profile = this.service.createProfile(body.name, body.label, body.description);
    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('profile/duplicate/:id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Duplicate a configuration profile' })
  @ApiParam({ name: 'id', description: 'Source profile ID' })
  @ApiResponse({ status: 200, description: 'Profile duplicated', type: ConfigurationProfileResponseDto })
  @ApiNotFoundResponse({ description: 'Source profile not found', type: ConfigurationErrorDto })
  duplicateProfile(
    @Param() params: ProfileIdParamDto,
    @Body() body: DuplicateProfileDto,
  ): ConfigurationProfileResponseDto {
    const profile = this.service.duplicateProfile(params.id, body.newName, body.newLabel);
    if (!profile) {
      throw new NotFoundException(`Profile '${params.id}' not found`);
    }
    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('profile/:id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a configuration profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile deleted', type: ConfigurationProfileActionResponseDto })
  @ApiNotFoundResponse({ description: 'Profile not found or is system profile', type: ConfigurationErrorDto })
  deleteProfile(@Param() params: ProfileIdParamDto): ConfigurationProfileActionResponseDto {
    const deleted = this.service.deleteProfile(params.id);
    if (!deleted) {
      throw new NotFoundException(`Profile '${params.id}' not found or cannot be deleted (system profile)`);
    }
    return {
      success: true,
      message: 'Profile deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('snapshot/create')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a configuration snapshot' })
  @ApiResponse({ status: 200, description: 'Snapshot created', type: ConfigurationSnapshotResponseDto })
  createSnapshot(@Body() body: CreateSnapshotDto): ConfigurationSnapshotResponseDto {
    const snapshot = this.service.createSnapshot(body.comment, body.user);
    return {
      success: true,
      data: snapshot,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('snapshot/rollback/:id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback to a configuration snapshot' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiResponse({ status: 200, description: 'Snapshot rolled back', type: ConfigurationSnapshotActionResponseDto })
  @ApiNotFoundResponse({ description: 'Snapshot not found', type: ConfigurationErrorDto })
  rollbackSnapshot(@Param() params: SnapshotIdParamDto): ConfigurationSnapshotActionResponseDto {
    const rolled = this.service.rollbackSnapshot(params.id);
    if (!rolled) {
      throw new NotFoundException(`Snapshot '${params.id}' not found`);
    }
    return {
      success: true,
      message: 'Snapshot rolled back successfully',
      timestamp: new Date().toISOString(),
    };
  }

  private ensureValidDomain(domain: string): void {
    if (!(VALID_DOMAINS as readonly string[]).includes(domain)) {
      throw new BadRequestException(
        `Invalid domain '${domain}'. Valid domains: ${VALID_DOMAINS.join(', ')}`,
      );
    }
  }
}
