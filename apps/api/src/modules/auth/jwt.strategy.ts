import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  memberships: {
    orgId: string;
    memberType: string;
    isPartner: boolean;
  }[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'fekra-ai-jwt-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const membership = payload.memberships?.[0];
    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      orgId: membership?.orgId ?? '',
      isPartner: membership?.isPartner ?? false,
    };
  }
}
