import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

@InputType()
export class VerifySignatureInput {
  @Field(() => String, { description: 'Wallet address' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' })
  address: string;

  @Field(() => String, { description: 'Signature of the nonce message' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
