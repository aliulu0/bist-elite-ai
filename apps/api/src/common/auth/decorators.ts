import { SetMetadata } from '@nestjs/common';
import { Role, Permission } from './types';
import { ROLES_KEY } from './guards/roles.guard';
import { PERMISSIONS_KEY, REQUIRE_ALL_PERMISSIONS } from './guards/permissions.guard';
import { IS_PUBLIC_KEY } from './guards/auth.guard';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireAllPermissions = (...permissions: Permission[]) => [
  SetMetadata(PERMISSIONS_KEY, permissions),
  SetMetadata(REQUIRE_ALL_PERMISSIONS, true),
];
