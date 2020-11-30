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
  private static collection: Map<any, Injector> = new Map<any, Injector>();
  /** root injector's scope */
  private readonly scope: Scope;
  /** options, default values */
  private readonly options: IInjectorOptions = {
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
   * Injector factory. Create injector's instance. To one object possible create only one injector class.
   * @param object object of injections (root object which conducts providers and their dependencies)
   * @param providers allowed providers for resolving dependencies. When option strictProviders is false then providers
   * is unnecessary.
   * @param options provider options
   */
  public static create<T = any>(object: T, providers?: TProvider<any>[], options?: IInjectorOptions): Injector {
    if (Injector.collection.has(object)) {
      throw new InjectorAlreadyExistsException();
    }
    const injector = new Injector(object, providers, options);

    Injector.collection.set(object, injector);
    return injector;
  }

  /**
   * Instantiate tree of dependencies begin from passed type (constructor or class) and returns root instance
   * @param type root constructor or class type
   * @param parentScope parent scope, if not passed then using root scope
   */
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
    const paramsInstances = DecoratorHelper.getParamTypes(type).map((paramType, index): T | undefined => {
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

  /**
   * Instantiate param marked @Inject directive
   * @param token injected token
   * @param scope scope which needs the param
   * @private
   */
  private instantiateParam<T = any>(token: Token, scope: Scope): T | undefined {
    const provider = scope.getProvider(token);
    if (!provider) return undefined;
    return this.makeInstance(Object, provider, []) as T;
  }

  /**
   * Created instance by all allowing approaches
   * @param type
   * @param provider
   * @param params
   * @private
   */
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
