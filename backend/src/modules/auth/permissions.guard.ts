import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) {
      throw new ForbiddenException('无访问权限');
    }

    const userPermissions = await this.usersService.getUserPermissions(userId);
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      const ipAddress = (request.ip || request.headers['x-forwarded-for'] || '') as string;
      void this.auditService.log({
        category: 'security',
        action: 'PERMISSION_DENIED',
        resource: request.route?.path || request.url,
        userId,
        username: request.user?.username,
        role: request.user?.role,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : String(ipAddress),
        userAgent: request.headers['user-agent'],
        result: 'FAILURE',
        detail: { required: requiredPermissions },
      });
      throw new ForbiddenException('无访问权限');
    }

    return true;
  }
}
