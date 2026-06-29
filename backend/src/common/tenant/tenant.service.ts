import { Injectable } from '@nestjs/common';
import { getTenantId } from './tenant.context';

@Injectable()
export class TenantService {
  getTenantId(): string | undefined {
    return getTenantId();
  }

  where() {
    const tenantId = getTenantId();
    return tenantId ? { tenantId } : {};
  }
}
