import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { TenantsService } from '../tenants/tenants.service';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private tenantsService: TenantsService,
  ) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const tenant = await this.tenantsService.findByCode('default');
    if (!tenant) throw new UnauthorizedException();
    const user = await this.authService.validateUser(username, password, tenant.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}