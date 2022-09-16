import {
  FactoryNotFunctionException,
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

/**
 * The Injector class builds the injection tree and resolve all dependencies. Supports unlimited level of dependencies.
 * This DI approach has inspired by angular and nest.js dependency injection, but realized pretty simple for using
 * outside of the bulky frameworks.
 *
 * The tree traversal starts from root type (constructor or class) and going on to it's params of dependencies and so on.
 * At the every level makes scope object. Scope stores its own unique providers for using in the lower levels for
 * resolving instances.
 *
 * @example
 * ```typescript
 * import { Injectable, Inject } from 'ulixes';
 *
 * @Injectable()
 * class Nail {
 *   private color = 'transparent';
 *   constructor(@Inject('NAIL_COLOR') color: string) {
 *     this.color = color;
 *   }
 * }
 *
 * @Injectable()
 * class Finger {
 *   constructor(private nail: Nail) {
 *     this.color = color;
 *   }
 * }
 *
 * @Injectable()
 * class Hand {
 *   constructor(private finger: Finger) {
 *     this.color = color;
 *   }
 * }
 *
 * class Body() {
 *   private injector: Injector;
 *   private hand: Hand;
 *   constructor() {
 *     this.injector = Injector.create(this, [Hand, Finger, Nail, { provider: 'NAIL_COLOR', useValue: 'black' }]);
 *     // instantiating Hand and resolving it's dependencies
 *     this.hand = this.injector.instantiate(Hand);
 *   }
 * }
 *
 * const body = new Body();
 * ```
 */
export class Injector {
  private static globe = Symbol('GLOBE');
  private static collection: Map<any, Injector> = new Map<any, Injector>();
  /** root injector's scope */
  private readonly scope: Scope;
  /** options, default values */
  private readonly options: IInjectorOptions = {
    debug: false,
    strictProviders: true,
  };

  private constructor(
    private object: any,
    private providers?: TProvider[],
    options?: IInjectorOptions,
  ) {
    this.scope = new Scope(undefined, providers);
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Injector factory. Create injector's instance. Only one injector instance possible being created for one object.
   * @param object object of injections (root object which conducts providers and their dependencies)
   * @param providers allowed providers for resolving dependencies. When option strictProviders is false then providers
   * is unnecessary.
   * @param options provider options
   */
  public static create<T = any>(object?: T, providers?: TProvider<any>[], options?: IInjectorOptions): Injector {
    const scope = object ?? Injector.globe;
    if (Injector.collection.has(scope)) {
      throw new InjectorAlreadyExistsException();
    }
    const injector = new Injector(scope, providers, options);

    Injector.collection.set(scope, injector);
    return injector;
  }

  /**
   * Returns exists injector or undefined if not
   * @param object object of injections (root object which conducts providers and their dependencies)
   */
  public static getInjector<T = any>(object?: T): Injector | undefined {
    const scope = object ?? Injector.globe;
    return Injector.collection.get(scope);
  }

  /**
   * Instantiate tree of dependencies begin from passed type (constructor or class) and returns root instance
   * @param type root constructor or class type
   * @param parentScope parent scope, if not passed then using root scope
   * @param parentType
   */
  public instantiate<T = any>(type: Type<T>, parentScope?: Scope, parentType?: Type<any>): T {
    parentScope ??= this.scope;
    const provider = parentScope.getProvider(type);
    const useClass = (provider as IClassProvider<any>)?.useClass as Type<T>;
    if (useClass) type = useClass;

    const injectOptions = DecoratorHelper.getInjectionOptions(type);
    const injectParams = DecoratorHelper.getInjectParams(type);
    if (!injectOptions) {
      throw new NotInjectableException(type);
    }
    // Every instance has an own scope on an every level
    const scope = new Scope(parentScope, injectOptions.providers);
    // search for instance while will not be found injected params or provider
    let instance = scope.findUpInstance(type, injectParams);
    if (instance) return instance;

    // instantiating and resolving constructor's parameters
    const paramsInstances = DecoratorHelper.getParamTypes(type).map((paramType, index): T | undefined => {
      const paramToken = injectParams.get(index);
      if (injectParams.has(index) && paramToken) return this.instantiateParam(paramToken, scope, type);
      return this.instantiate(paramType, scope, type);
    });

    // create instance
    instance = this.makeInstance(type, provider, paramsInstances, parentType);
    const scopeForInst = scope.getScopeForType(type, injectParams, paramsInstances);
    scopeForInst.addInstance(type, instance);
    return instance;
  }

  /**
   * Returns instance of type from root scope
   * @param type
   */
  public get<T = any>(type: Type<T>): T | undefined {
    return this.scope.getInstance(type);
  }

  /**
   * Instantiate param marked by @Inject directive
   * @param token injected token
   * @param scope scope which needs the param
   * @param parentType
   * @private
   */
  private instantiateParam<T = any>(token: Token, scope: Scope, parentType: Type<any>): T | undefined {
    const provider = scope.getProvider(token);
    if (!provider) return undefined;
    if ((provider as IClassProvider<T>).useClass) {
      return this.instantiate((provider as IClassProvider<T>).useClass, scope, parentType);
    }
    return this.makeInstance(Object, provider, []) as T;
  }

  /**
   * Created instance by all allowing approaches
   * @param type
   * @param provider
   * @param params
   * @param parentType
   * @private
   */
  private makeInstance<T = any>(type: Type<T>, provider: TProvider<T> | undefined, params: any[], parentType?: Type<any>): T {
    if (!provider || provider === type) {
      return this.createByType(type, provider, params, parentType);
    }
    if ((provider as IValueProvider<T>).useValue) {
      return (provider as IValueProvider<T>).useValue;
    }
    if ((provider as IClassProvider<T>).useClass) {
      return this.createByClass(type, provider as IClassProvider<T>, params, parentType);
    }
    if (typeof (provider as IFactoryProvider<T>).useFactory === 'function') {
      return this.createByFactory(provider as IFactoryProvider<T>, type, params, parentType);
    }
    throw new IncorrectProviderException();
  }

  private createByClass<T = any, C = any>(type: Type<T>, provider: IClassProvider<C>, params: any[], parentType?: Type<any>): C {
    if (this.options.debug) console.log(`${parentType?.name ?? 'root'} <-- ${type.name}(${provider.useClass.name})`);
    return new provider.useClass(...params);
  }

  private createByType<T = any>(type: Type<T>, provider: TProvider<T> | undefined, params: any[], parentType?: Type<any>): T {
    if (!provider && this.options.strictProviders) throw new ProviderNotExistsException(type);
    if (this.options.debug) console.log(`${parentType?.name ?? 'root'} <-- ${type.name}`);
    return new type(...params);
  }

  private createByFactory<T = any>(provider: IFactoryProvider<T>, type: Type<T>, params: any[], parentType?: Type<any>): T {
    if (typeof provider.useFactory === 'function') {
      if (this.options.debug) console.log(`${parentType?.name ?? 'root'} <-- ${(provider.provide as Type<T>).name}`);
      return provider.useFactory.call(undefined, ...params.concat([this.object]));
    }
    throw new FactoryNotFunctionException(type);
  }
}
