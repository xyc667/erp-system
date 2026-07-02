import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { sanitizeUser } from '../../common/utils/sanitize-user';
import { AuditService } from '../audit/audit.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type RequestMeta = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private tenantsService: TenantsService,
  ) {}

  async validateUser(username: string, password: string, tenantId: string) {
    const user = await this.userService.findByUsername(username, tenantId);
    if (user && (await bcrypt.compare(password, user.password))) {
      return sanitizeUser(user);
    }
    return null;
  }

  async login(loginDto: LoginDto, meta?: RequestMeta) {
    const tenantCode = loginDto.tenantCode || 'default';
    const tenant = await this.tenantsService.findByCode(tenantCode);
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('租户不存在或已禁用');
    }

    const user = await this.validateUser(loginDto.username, loginDto.password, tenant.id);
    if (!user) {
      await this.auditService.log({
        category: 'auth',
        action: 'LOGIN',
        username: loginDto.username,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        result: 'FAILURE',
        detail: { reason: 'invalid_credentials' },
      });
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== 'active') {
      await this.auditService.log({
        category: 'auth',
        action: 'LOGIN',
        username: loginDto.username,
        userId: user.id,
        role: user.role.name,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        result: 'FAILURE',
        detail: { reason: 'user_disabled' },
      });
      throw new UnauthorizedException('用户已禁用');
    }

    const permissions = await this.userService.getUserPermissions(user.id);
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role.name,
      tenantId: tenant.id,
      tenantCode: tenant.code,
    };
    await this.auditService.log({
      category: 'auth',
      action: 'LOGIN',
      username: user.username,
      userId: user.id,
      role: user.role.name,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      result: 'SUCCESS',
    });
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      }),
      expires_in: 900,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role.name,
        tenantId: tenant.id,
        tenantCode: tenant.code,
        tenantName: tenant.name,
        timezone: user.timezone,
        currency: user.currency,
        permissions,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findByUsername(payload.username, payload.tenantId);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('用户不存在或已禁用');
      }
      const newPayload = {
        username: user.username,
        sub: user.id,
        role: user.role.name,
        tenantId: user.tenantId,
      };
      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        }),
        expires_in: 900,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token 无效');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    const permissions = await this.userService.getUserPermissions(userId);
    return {
      ...user,
      permissions,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.userService.updatePreferences(userId, dto);
    const permissions = await this.userService.getUserPermissions(userId);
    return { ...user, permissions };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userService.update(userId, dto);
    const permissions = await this.userService.getUserPermissions(userId);
    return { ...user, permissions };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const raw = await this.userService.findWithPassword(userId);
    if (!raw) {
      throw new UnauthorizedException('用户不存在');
    }
    const valid = await bcrypt.compare(dto.currentPassword, raw.password);
    if (!valid) {
      throw new BadRequestException('当前密码不正确');
    }
    await this.userService.update(userId, { password: dto.newPassword });
  }
}