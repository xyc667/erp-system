import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

describe('PermissionsGuard', () => {
  const reflector = new Reflector();
  const usersService = {
    getUserPermissions: jest.fn(),
  } as unknown as UsersService;
  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  const guard = new PermissionsGuard(reflector, usersService, auditService);

  const createContext = (userId?: string): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userId ? { userId } : undefined,
          headers: {},
          url: '/api/test',
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access when no permissions are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await expect(guard.canActivate(createContext('user-1'))).resolves.toBe(true);
  });

  it('throws when user is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:gl']);
    await expect(guard.canActivate(createContext())).rejects.toThrow(ForbiddenException);
  });

  it('allows when user has one of required permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:gl', 'finance:ar']);
    jest.spyOn(usersService, 'getUserPermissions').mockResolvedValue(['finance:ar']);

    await expect(guard.canActivate(createContext('user-1'))).resolves.toBe(true);
  });

  it('denies when user lacks required permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:gl']);
    jest.spyOn(usersService, 'getUserPermissions').mockResolvedValue(['sales:order']);

    await expect(guard.canActivate(createContext('user-1'))).rejects.toThrow(ForbiddenException);
  });
});
