import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('DateTime', () => Date)
export class DateScalar implements CustomScalar<string, Date> {
  description = 'Date custom scalar type';

  parseValue(value: unknown): Date {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    throw new Error('DateTime scalar can only parse string or number values');
  }

  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new Error('DateTime scalar can only serialize Date or string values');
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    throw new Error('DateTime scalar can only parse string or int literals');
  }
}
