import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { getEnv, requireEnv } from '../../common/config/env';

export interface StreamTicketPayload {
  userId: string;
  resourceId: string;
  driveFileId: string;
  mimeType: string;
  downloadAllowed: boolean;
}

@Injectable()
export class StreamTicketService {
  private key(): Uint8Array {
    return new TextEncoder().encode(requireEnv('STREAM_TICKET_SECRET'));
  }

  async issue(payload: StreamTicketPayload) {
    const expiresIn = 300;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256', typ: 'IT-SUM-STREAM' })
      .setIssuedAt()
      .setExpirationTime(`${expiresIn}s`)
      .setSubject(payload.resourceId)
      .sign(this.key());
    return { token, expiresAt };
  }

  async verify(token: string): Promise<StreamTicketPayload> {
    try {
      const { payload } = await jwtVerify(token, this.key(), { algorithms: ['HS256'] });
      if (typeof payload.userId !== 'string' || typeof payload.resourceId !== 'string' || typeof payload.driveFileId !== 'string' || typeof payload.mimeType !== 'string') {
        throw new Error('invalid stream claims');
      }
      return {
        userId: payload.userId,
        resourceId: payload.resourceId,
        driveFileId: payload.driveFileId,
        mimeType: payload.mimeType,
        downloadAllowed: payload.downloadAllowed === true,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired stream ticket');
    }
  }

  configured(): boolean {
    return Boolean(getEnv().STREAM_TICKET_SECRET);
  }
}
