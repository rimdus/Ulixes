import { IInjectOptionsMetadata } from '../interfaces';
import { INJECT_OPTIONS_METADATA } from '../constants';

export class DecoratorHelper {
  public static defineInjectOptions(target: Function, options: IInjectOptionsMetadata): void {
    Reflect.defineMetadata(INJECT_OPTIONS_METADATA, options, target);
  }

  public static getInjectionOptions(target: Function): IInjectOptionsMetadata {
    return Reflect.getMetadata(INJECT_OPTIONS_METADATA, target);
  }
}
