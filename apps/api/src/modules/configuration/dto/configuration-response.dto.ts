import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DomainConfigDto {
  @ApiProperty({ example: 'technical' })
  domain!: string;

  @ApiProperty({ type: Object, example: { rsiPeriod: 14, macdFast: 12 } })
  config!: Record<string, unknown>;
}

export class AllConfigurationsDto {
  @ApiProperty({ example: 14 })
  totalDomains!: number;

  @ApiProperty({ type: Object, example: { technical: {}, financial: {} } })
  domains!: Record<string, Record<string, unknown>>;

  @ApiProperty({ example: 5 })
  version!: number;
}

export class ConfigurationProfileDto {
  @ApiProperty({ example: 'profile-default' })
  id!: string;

  @ApiProperty({ example: 'default' })
  name!: string;

  @ApiProperty({ example: 'Default' })
  label!: string;

  @ApiProperty({ example: 'Standard configuration for all domains' })
  description!: string;

  @ApiProperty({ type: Object })
  configs!: Record<string, Record<string, unknown>>;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: true })
  isSystem!: boolean;
}

export class ConfigurationSnapshotDto {
  @ApiProperty({ example: 'snap-1700000000000-abc' })
  id!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'admin' })
  user!: string;

  @ApiProperty({ example: 'Before major changes' })
  comment!: string;

  @ApiProperty({ type: [Object] })
  changedKeys!: Array<{ domain: string; key: string; oldValue: unknown; newValue: unknown }>;

  @ApiProperty({ example: 5 })
  version!: number;
}

export class ConfigurationHistoryEntryDto {
  @ApiProperty({ example: 'technical' })
  domain!: string;

  @ApiProperty({ example: 'rsiPeriod' })
  key!: string;

  @ApiProperty({ description: 'Previous value', example: 14 })
  oldValue!: unknown;

  @ApiProperty({ description: 'New value', example: 21 })
  newValue!: unknown;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationStatisticsDto {
  @ApiProperty({ example: 5 })
  version!: number;

  @ApiProperty({ example: 14 })
  totalDomains!: number;

  @ApiProperty({ example: 200 })
  totalKeys!: number;

  @ApiProperty({ example: 3 })
  totalSnapshots!: number;

  @ApiProperty({ example: 4 })
  totalProfiles!: number;

  @ApiProperty({ example: 'default' })
  activeProfile!: string;

  @ApiProperty({ example: 10 })
  totalChanges!: number;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:00.000Z' })
  lastModified!: string | null;
}

export class ConfigurationValidationResultDto {
  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ example: 'technical' })
  domain!: string;

  @ApiProperty({ type: [Object] })
  errors!: Array<{ key: string; rule: string; message: string; value: unknown }>;
}

export class ConfigurationPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: AllConfigurationsDto })
  data!: AllConfigurationsDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationDomainPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: DomainConfigDto })
  data!: DomainConfigDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationProfilesPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [ConfigurationProfileDto] })
  data!: ConfigurationProfileDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationSnapshotsPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [ConfigurationSnapshotDto] })
  data!: ConfigurationSnapshotDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationHistoryPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: Object })
  data!: { entries: ConfigurationHistoryEntryDto[]; total: number; limit: number; offset: number };

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationStatisticsPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ConfigurationStatisticsDto })
  data!: ConfigurationStatisticsDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationSetValueResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Key 'rsiPeriod' updated in domain 'technical'" })
  message!: string;

  @ApiProperty({ example: 6 })
  version!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationResetResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'All configuration has been reset to defaults' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationResetDomainResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Domain 'technical' has been reset to defaults" })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationProfileResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ConfigurationProfileDto })
  data!: ConfigurationProfileDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationProfileActionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Profile loaded successfully' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationSnapshotResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ConfigurationSnapshotDto })
  data!: ConfigurationSnapshotDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationSnapshotActionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Snapshot rolled back successfully' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ConfigurationErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Invalid domain name' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
