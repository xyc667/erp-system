import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}

export function requireTenantId(): string {
  const id = getTenantId();
  if (!id) throw new Error('Tenant context not set');
  return id;
}
