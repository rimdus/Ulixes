import { IInjectOptionsMetadata } from '../interfaces';
import { DecoratorHelper } from './decorator.helper';

export function Injectable(options?: IInjectOptionsMetadata): ClassDecorator {
  return (target): void => {
    DecoratorHelper.defineInjectOptions(target, {
      ...options,
    });
  };
}
