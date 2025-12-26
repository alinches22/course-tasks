import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class NonceResponse {
  @Field(() => String, { description: 'Nonce to sign' })
  nonce: string;

  @Field(() => String, { description: 'Full message to sign' })
  message: string;
}
