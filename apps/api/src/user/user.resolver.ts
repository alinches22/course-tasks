import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserModel } from './models/user.model';
import { UserStatsModel } from './models/user.model';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Resolver(() => UserModel)
@UseGuards(JwtAuthGuard)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => UserModel, { description: 'Get current authenticated user' })
  async me(@CurrentUser() user: CurrentUserPayload): Promise<UserModel> {
    const dbUser = await this.userService.findByIdOrThrow(user.userId);
    return {
      id: dbUser.id,
      address: dbUser.address,
      createdAt: dbUser.createdAt,
    };
  }

  @Query(() => UserStatsModel, { description: 'Get current user statistics' })
  async myStats(@CurrentUser() user: CurrentUserPayload): Promise<UserStatsModel> {
    return this.userService.getStats(user.userId);
  }
}
