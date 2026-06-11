import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function decimalsTtransform(value: unknown): unknown {
  if (value instanceof Decimal) return value.toNumber();

  if (Array.isArray(value)) return value.map(decimalsTtransform);

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decimalsTtransform(v)]));
  }

  return value;
}

@Injectable()
export class DecimalTransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(decimalsTtransform));
  }
}
