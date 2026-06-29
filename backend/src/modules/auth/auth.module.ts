import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuditModule } from '../audit/audit.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { PermissionsGuard } from './permissions.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => AuditModule),
    forwardRef(() => TenantsModule),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, PermissionsGuard],
  exports: [AuthService, PermissionsGuard, AuditModule, forwardRef(() => UsersModule)],
})
export class AuthModule {}