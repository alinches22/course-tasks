import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyMessage } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { generateNonce } from '../common/utils/hash.util';
import { isExpired } from '../common/utils/time.util';
import { AuthPayload } from './models/auth-payload.model';

const SIGN_MESSAGE_PREFIX = 'Sign this message to authenticate with TradeVersus:\n\nNonce: ';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Get or create a nonce for the given address
   */
  async getNonce(address: string): Promise<string> {
    const normalizedAddress = address.toLowerCase();
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + this.configService.nonceExpiryMs);

    await this.prisma.nonce.upsert({
      where: { address: normalizedAddress },
      update: { nonce, expiresAt },
      create: { address: normalizedAddress, nonce, expiresAt },
    });

    return nonce;
  }

  /**
   * Verify signature and issue JWT
   */
  async verifySignature(address: string, signature: string): Promise<AuthPayload> {
    const normalizedAddress = address.toLowerCase();

    // Get stored nonce
    const nonceRecord = await this.prisma.nonce.findUnique({
      where: { address: normalizedAddress },
    });

    if (!nonceRecord) {
      throw new BadRequestException('No nonce found for this address. Call getNonce first.');
    }

    if (isExpired(nonceRecord.expiresAt)) {
      throw new BadRequestException('Nonce expired. Please request a new nonce.');
    }

    // Construct the message that was signed
    const message = `${SIGN_MESSAGE_PREFIX}${nonceRecord.nonce}`;

    // Verify the signature
    let recoveredAddress: string;
    try {
      recoveredAddress = verifyMessage(message, signature).toLowerCase();
    } catch (error) {
      throw new UnauthorizedException('Invalid signature');
    }

    if (recoveredAddress !== normalizedAddress) {
      throw new UnauthorizedException('Signature does not match address');
    }

    // Delete used nonce
    await this.prisma.nonce.delete({
      where: { address: normalizedAddress },
    });

    // Upsert user
    const user = await this.prisma.user.upsert({
      where: { address: normalizedAddress },
      update: { updatedAt: new Date() },
      create: { address: normalizedAddress },
    });

    // Generate JWT
    const token = this.generateToken(user.id, user.address);

    return {
      token,
      user: {
        id: user.id,
        address: user.address,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: string, address: string): string {
    const payload = { sub: userId, address };
    return this.jwtService.sign(payload);
  }

  /**
   * Validate JWT token and return user payload
   */
  async validateToken(token: string): Promise<{ userId: string; address: string } | null> {
    try {
      const payload = this.jwtService.verify(token);
      return { userId: payload.sub, address: payload.address };
    } catch {
      return null;
    }
  }

  /**
   * Get user from JWT payload
   */
  async validateUser(payload: { sub: string; address: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { userId: user.id, address: user.address };
  }

  /**
   * Get the sign message for a nonce
   */
  getSignMessage(nonce: string): string {
    return `${SIGN_MESSAGE_PREFIX}${nonce}`;
  }
}
