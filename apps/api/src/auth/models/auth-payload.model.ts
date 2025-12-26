import { ObjectType, Field } from '@nestjs/graphql';
import { UserModel } from '../../user/models/user.model';

@ObjectType()
export class AuthPayload {
  @Field(() => String, { description: 'JWT access token' })
  token: string;

  @Field(() => UserModel, { description: 'Authenticated user' })
  user: UserModel;
}
