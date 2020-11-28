import {
  IncorrectProviderException,
  InjectorAlreadyExistsException,
  NotInjectableException,
  ProviderNotExistsException,
} from './errors';
import {
  IClassProvider,
  IFactoryProvider,
  IInjectorOptions,
  IValueProvider,
  Token,
  TProvider,
  Type,
} from '../interfaces';
import { Scope } from './scope';
import { DecoratorHelper } from '../decorators';

export class Injector {
  private static collection: Map<any, Injector> = new Map();
  /** root injector's scope */
  private scope: Scope;
  private options: IInjectorOptions = {};

  constructor(
    private object: any,
    private providers?: TProvider[],
    options?: IInjectorOptions,
  ) {
    this.scope = new Scope(undefined, providers);
    this.options = {
      strictProviders: true,
      ...options,
    };
  }

  public static create(object: any, providers?: TProvider<any>[], options?: IInjectorOptions): Injector {
    if (Injector.collection.has(object)) {
      throw new InjectorAlreadyExistsException();
    }
    const injector = new Injector(object, providers, options);

    Injector.collection.set(object, injector);
    return injector;
  }

  public instantiate<T = any>(type: Type<T>, parentScope?: Scope): T {
    const injectOptions = DecoratorHelper.getInjectionOptions(type);
    const injectParams = DecoratorHelper.getInjectParams(type);
    if (!injectOptions) throw new NotInjectableException(type);
    // Every instance has an own scope on an every level
    const scope = new Scope(parentScope || this.scope, injectOptions.providers);
    // search for instance while will not be found injected params or provider
    let instance = scope.findUpInstance(type, injectParams);
    if (instance) return instance;

    const provider = scope.getProvider(type);
    const useClass = (provider as IClassProvider<any>)?.useClass;
    // add providers by changed class if it has happened
    if (useClass) {
      const useClassOpt = DecoratorHelper.getInjectionOptions(useClass);
      if (useClassOpt?.providers?.length) {
        scope.addProviders(useClassOpt.providers);
      }
    }

    // instantiating and resolving constructor's parameters
    const paramsInstances = DecoratorHelper.getParamTypes(type).map((paramType, index) => {
      const paramToken = injectParams.get(index);
      if (injectParams.has(index) && paramToken) return this.instantiateParam(paramToken, scope);
      return this.instantiate(paramType, scope);
    });

    // create instance
    instance = this.makeInstance(type, provider, paramsInstances);
    const scopeForInst = scope.getScopeForType(type, injectParams);
    scopeForInst.addInstance(type, instance);
    return instance;
  }

  private instantiateParam<T = any>(token: Token, scope: Scope): T | undefined {
    const provider = scope.getProvider(token);
    if (!provider) return undefined;
    return this.makeInstance(Object, provider, []);
  }

  private makeInstance<T = any>(type: Type<T>, provider: TProvider<T> | undefined, params: any[]): T {
    if (!provider) {
      if (this.options.strictProviders) throw new ProviderNotExistsException(type);
      return new type(...params);
    }
    if (provider === type) {
      return new type(...params);
    }
    if ((provider as IValueProvider<T>).useValue) {
      return (provider as IValueProvider<T>).useValue;
    }
    if ((provider as IClassProvider<T>).useClass) {
      return new (provider as IClassProvider<T>).useClass(...params);
    }
    if (typeof (provider as IFactoryProvider<T>).useFactory === 'function') {
      return (provider as IFactoryProvider<T>).useFactory(...params);
    }
    throw new IncorrectProviderException();
  }
}
