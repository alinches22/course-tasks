import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphqlExceptionFilter implements GqlExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    GqlArgumentsHost.create(host);

    let message = exception.message;
    let code = 'INTERNAL_SERVER_ERROR';
    let status = 500;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'string' ? response : (response as { message?: string }).message || message;

      switch (status) {
        case 400:
          code = 'BAD_REQUEST';
          break;
        case 401:
          code = 'UNAUTHENTICATED';
          break;
        case 403:
          code = 'FORBIDDEN';
          break;
        case 404:
          code = 'NOT_FOUND';
          break;
        case 429:
          code = 'TOO_MANY_REQUESTS';
          break;
        default:
          code = 'INTERNAL_SERVER_ERROR';
      }
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GraphQL Error:', {
        message,
        code,
        stack: exception.stack,
      });
    }

    return new GraphQLError(message, {
      extensions: {
        code,
        status,
      },
    });
  }
}
