import { Type } from './type.interface';

export type Token = string | Symbol;

export interface IFactoryProvider<T> {
  provide: Type<T> | Token;
  useFactory: (...args: any[]) => T;
}

export interface IClassProvider<T> {
  provide: Type<T> | Token;
  useClass: Type<T>;
}

export interface IValueProvider<T> {
  provide: Type<T> | Token;
  useValue: T;
}

export type TProvider<T = any> = Type<any> | IFactoryProvider<T> | IClassProvider<T> | IValueProvider<T>;
