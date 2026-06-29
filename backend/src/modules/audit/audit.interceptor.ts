import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import { AuditService } from './audit.service';

function extractResource(path: string): string {
  const cleaned = path.replace(/^\/api\//, '').split('?')[0];
  const segments = cleaned.split('/').filter(Boolean);
  return segments.slice(0, 2).join('/') || cleaned;
}

function mapAction(method: string): string {
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'UPDATE';
  }
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method as string;

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const url = (req.originalUrl || req.url || '') as string;
    if (url.includes('/auth/login') || url.includes('/health')) {
      return next.handle();
    }

    const user = req.user as { userId?: string; username?: string; role?: string } | undefined;
    const action = mapAction(method);
    const resource = extractResource(url);
    const resourceId = req.params?.id as string | undefined;
    const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '') as string;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const baseLog = {
      category: 'operation' as const,
      action,
      resource,
      resourceId,
      userId: user?.userId,
      username: user?.username,
      role: user?.role,
      ipAddress: typeof ipAddress === 'string' ? ipAddress : String(ipAddress),
      userAgent,
    };

    return next.handle().pipe(
      tap(() => {
        void this.auditService.log({ ...baseLog, result: 'SUCCESS' });
      }),
      catchError((error) => {
        void this.auditService.log({
          ...baseLog,
          result: 'FAILURE',
          detail: { message: error?.message },
        });
        throw error;
      }),
    );
  }
}
