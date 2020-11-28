import { IInjectOptionsMetadata, TInjectParamsMetadata, Type } from '../interfaces';
import { INJECT_OPTIONS_METADATA, PARAMTYPES_METADATA } from '../constants';

export class DecoratorHelper {
  public static injectTargetParams = new Map<Type<any>, TInjectParamsMetadata>();

  public static defineInjectOptions(target: Function, options: IInjectOptionsMetadata): void {
    Reflect.defineMetadata(INJECT_OPTIONS_METADATA, options, target);
  }

  public static getInjectionOptions(target: Function): IInjectOptionsMetadata {
    return Reflect.getMetadata(INJECT_OPTIONS_METADATA, target);
  }

  public static defineInjectParam(target: Type<any>, paramIndex: number, token: string): void {
    if (!DecoratorHelper.injectTargetParams.has(target)) DecoratorHelper.injectTargetParams.set(target, new Map());
    const params = DecoratorHelper.injectTargetParams.get(target);
    if (params) params.set(paramIndex, token);
  }

  public static getInjectParams(target: Type<any>): TInjectParamsMetadata {
    return DecoratorHelper.injectTargetParams.get(target) || new Map();
  }

  public static getDesignType(target: Type<any>, key: string): Type<any> {
    return Reflect.getMetadata('design:type', target, key);
  }

  public static getParamTypes(target: Type<any>): Type<any>[] {
    return Reflect.getMetadata(PARAMTYPES_METADATA, target) ?? [];
  }
}
