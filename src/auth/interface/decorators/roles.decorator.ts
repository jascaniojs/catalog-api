import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/user-role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
