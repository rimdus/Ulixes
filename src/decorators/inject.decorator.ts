import { DecoratorHelper } from '.';
import { Type } from '../interfaces';

export function Inject(token?: string) {
  return (target: Type<any>, key: string | symbol, index?: number): void => {
    if (typeof key === 'undefined' && index !== undefined) {
      let realToken = token;
      if (!realToken) {
        const designType = DecoratorHelper.getDesignType(target, key);
        if (designType && typeof designType === 'function') realToken = designType.name;
      }
      if (realToken) DecoratorHelper.defineInjectParam(target, index, realToken);
    }
  };
}
