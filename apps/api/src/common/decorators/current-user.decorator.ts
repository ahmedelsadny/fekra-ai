import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Shape of the authenticated user attached to the request by the JWT guard.
 */
export interface AuthUser {
  id: string; // User id (uuid)
  email: string;
  fullName: string;
  orgId: string; // first organization membership
  isPartner: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
