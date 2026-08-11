import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetValueDto {
  @ApiProperty({ description: 'Configuration key', example: 'rsiPeriod' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: 'Configuration value', example: 21 })
  value!: unknown;

  @ApiPropertyOptional({ description: 'User performing the change', example: 'admin' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ description: 'Change comment', example: 'Adjusted RSI period' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateProfileDto {
  @ApiProperty({ description: 'Profile name', example: 'my_custom' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Profile label', example: 'My Custom Profile' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiPropertyOptional({ description: 'Profile description', example: 'Custom configuration for testing' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DuplicateProfileDto {
  @ApiProperty({ description: 'New profile name', example: 'my_duplicate' })
  @IsString()
  @IsNotEmpty()
  newName!: string;

  @ApiProperty({ description: 'New profile label', example: 'Duplicated Profile' })
  @IsString()
  @IsNotEmpty()
  newLabel!: string;
}

export class CreateSnapshotDto {
  @ApiPropertyOptional({ description: 'Snapshot comment', example: 'Before major changes' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'User creating snapshot', example: 'admin' })
  @IsOptional()
  @IsString()
  user?: string;
}
