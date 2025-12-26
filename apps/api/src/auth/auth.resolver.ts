import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { NonceResponse } from './dto/nonce.response';
import { VerifySignatureInput } from './dto/verify-signature.input';
import { AuthPayload } from './models/auth-payload.model';
import { Public } from '../common/decorators/public.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Public()
  @Query(() => NonceResponse, { description: 'Get nonce for wallet signature' })
  async getNonce(@Args('address') address: string): Promise<NonceResponse> {
    const nonce = await this.authService.getNonce(address);
    const message = this.authService.getSignMessage(nonce);
    return { nonce, message };
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Verify wallet signature and get JWT' })
  async verifySignature(@Args('input') input: VerifySignatureInput): Promise<AuthPayload> {
    return this.authService.verifySignature(input.address, input.signature);
  }
}
