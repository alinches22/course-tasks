import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserPayload {
  userId: string;
  address: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, context: ExecutionContext): CurrentUserPayload => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // For WebSocket subscriptions
    if (!request.user && ctx.getContext().user) {
      const user = ctx.getContext().user;
      return data ? user?.[data] : user;
    }

    const user = request.user;
    return data ? user?.[data] : user;
  },
);
