import { Type, Token } from '.';

export interface IProvide<T = any> {
  provide: Type<T> | Token;
}

export interface IFactoryProvider<T> extends IProvide<T> {
  useFactory: (...args: any[]) => T;
}

export interface IClassProvider<T> extends IProvide<T> {
  useClass: Type<T>;
}

export interface IValueProvider<T> extends IProvide<T> {
  useValue: T;
}

export type TProvider<T = any> = Type<T> | IFactoryProvider<T> | IClassProvider<T> | IValueProvider<T>;
