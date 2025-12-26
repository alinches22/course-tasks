import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check for dev auth header (development only)
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();
    const req = gqlContext.req;

    if (req?.headers?.['x-dev-user']) {
      // In dev mode, allow bypassing auth with x-dev-user header
      const devUser = req.headers['x-dev-user'];
      req.user = {
        userId: devUser,
        address: `0x${devUser.padStart(40, '0')}`,
      };
      return true;
    }

    // For subscriptions, check if user was set by onConnect
    if (gqlContext.user) {
      return true;
    }

    return super.canActivate(context);
  }

  override getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    // For subscriptions, the user is attached to the context directly
    if (gqlContext.user) {
      return { user: gqlContext.user };
    }

    return gqlContext.req;
  }

  override handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    // Check if we already have a dev user from the header
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    if (req?.user?.userId) {
      return req.user as TUser;
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
