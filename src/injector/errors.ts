import { Type } from '../interfaces';

export class InjectorAlreadyExistsException extends Error {
  constructor() {
    super('Injector already exists');
  }

  public name = 'InjectorAlreadyExistsException';
}

export class IncorrectProviderException extends Error {
  constructor() {
    super('Incorrect provider');
  }

  public name = 'IncorrectProviderException';
}

export class ProviderNotExistsException extends Error {
  constructor(type?: Type<any>) {
    super(`Provider${type ? ` ${type.name}` : ''} not exists`);
  }

  public name = 'ProviderNotExistsException';
}

export class NotInjectableException extends Error {
  constructor(type?: Type<any>) {
    super(`Constructor${type ? ` ${type.name}` : ''} no marked @Injectable`);
  }

  public name = 'NotInjectableException';
}

export class FactoryNotFunctionException extends Error {
  constructor(type?: Type<any>) {
    super(`Factory for${type ? ` ${type.name}` : ''} not a function`);
  }

  public name = 'FactoryNotFunctionException';
}
