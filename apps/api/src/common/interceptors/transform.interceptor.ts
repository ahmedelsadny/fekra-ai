import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  meta: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If handler already prepared a paginated or meta-bearing structure
        if (res && typeof res === 'object' && 'data' in res && ('meta' in res || 'success' in res)) {
          return {
            success: res.success ?? true,
            data: res.data,
            meta: res.meta ?? null,
          };
        }

        return {
          success: true,
          data: res ?? null,
          meta: null,
        };
      }),
    );
  }
}
