import { IProvide, TInjectParamsMetadata, Token, TProvider, Type } from '../interfaces';

export class Scope {
  private instances: Map<Type<any>, any> = new Map<Type<any>, any>();
  private providers: TProvider<any>[];
  private parentScope: Scope | undefined;

  constructor(parentScope?: Scope, providers?: TProvider[]) {
    this.parentScope = parentScope;
    this.providers = providers ?? [];
  }

  public findUpInstance<T = any>(type: Type<T>, injectParams: TInjectParamsMetadata): T | undefined {
    if (this.instances.has(type)) return this.instances.get(type) as T;
    if (this.hasParamsInProviders(injectParams)) return undefined;
    if (this.hasTypeInProviders(type)) return undefined;
    if (this.parentScope) return this.parentScope.findUpInstance(type, injectParams);
    return undefined;
  }

  public addInstance<T = any>(type: Type<T>, instance: T): void {
    this.instances.set(type, instance);
  }

  public addProviders(providers: TProvider[]): void {
    this.providers.push(...providers);
  }

  private hasParamsInProviders(injectParams: TInjectParamsMetadata): boolean {
    if (!injectParams) return false;
    return !!Array.from(injectParams.values())
      .find(token => this.providers.find(provider => (provider as IProvide).provide === token));
  }

  private hasParamInstances(paramInstances: any[]): boolean {
    return !!Array
      .from(this.instances.values()).find(instance => paramInstances.find(paramInstance => instance === paramInstance));
  }

  private hasTypeInProviders(type: Type<any>): boolean {
    if (!this.providers.length) return false;
    return !!this.providers.find(provider => (provider as IProvide).provide === type);
  }

  /**
   * Return the scope with closest provider or root scope if hasn't
   * @param type
   * @param injectParams
   */
  public getScopeForType(type: Type<any> | Token, injectParams: TInjectParamsMetadata, paramsInstances: any[]): Scope {
    const provider = this.providers.find(provider => (provider as IProvide).provide === type);
    if (provider || !this.parentScope || this.hasParamsInProviders(injectParams) || this.hasParamInstances(paramsInstances)) return this;
    return this.parentScope.getScopeForType(type, injectParams, paramsInstances);
  }

  /**
   * Searches provider from this scope to the root scope
   * @param type constructor type or token
   */
  public getProvider<T = any>(type: Type<T> | Token): TProvider<T> | undefined {
    const provider = this.providers.find(provider => {
      if ((provider as IProvide<T>).provide) return (provider as IProvide<T>).provide === type;
      return type === provider;
    });
    if (provider || !this.parentScope) return provider;
    return this.parentScope.getProvider(type);
  }

  /**
   * Returns instance of type
   * @param type
   */
  public getInstance<T = any>(type: Type<T>): T | undefined {
    return this.instances.get(type) as T;
  }

}
