import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Global JWT authentication guard.
 * Protects endpoints with `Authorization: Bearer <accessToken>` tokens.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
