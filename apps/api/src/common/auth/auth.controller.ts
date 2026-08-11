import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public, Roles } from './decorators';
import { CurrentUser } from './user-context';
import { Role, UserContext, ROLE_PERMISSIONS } from './types';

export class LoginRequestDto {
  email: string = '';
  password: string = '';
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and obtain a JWT access token' })
  @ApiResponse({ status: 200, description: 'Access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginRequestDto): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: string;
    user: { userId: string; email: string; roles: Role[] };
  }> {
    if (!this.authService.isAuthEnabled) {
      throw new UnauthorizedException('Authentication is not enabled');
    }

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', '');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', '');

    if (!adminEmail || !adminPassword) {
      throw new UnauthorizedException('Server authentication is not configured');
    }

    if (
      body?.email?.toLowerCase() !== adminEmail.toLowerCase() ||
      body?.password !== adminPassword
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = ROLE_PERMISSIONS[Role.ADMIN];
    const accessToken = this.authService.signToken({
      sub: adminEmail,
      email: adminEmail,
      roles: [Role.ADMIN],
      permissions,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      user: { userId: adminEmail, email: adminEmail, roles: [Role.ADMIN] },
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.ANALYST, Role.STANDARD_USER, Role.READ_ONLY)
  @ApiOperation({ summary: 'Return the currently authenticated user context' })
  async me(@CurrentUser() user: UserContext): Promise<UserContext> {
    return user;
  }
}
