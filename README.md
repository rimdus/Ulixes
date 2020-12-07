# Ulixes

The Lightweight Dependency Injection package for Node.Js.

## Installation

```
npm install ulixes
```

## Example

```
import { Injectable, Inject } from 'ulixes';

@Injectable()
class Nail {
  private color = 'transparent';
  constructor(@Inject('NAIL_COLOR') color: string) {
    this.color = color;
  }
}

@Injectable()
class Finger {
  constructor(private nail: Nail) {
    this.color = color;
  }
}

@Injectable()
class Hand {
  constructor(private finger: Finger) {
    this.color = color;
  }
}

class Body() {
  private injector: Injector;
  private hand: Hand;
  constructor() {
    this.injector = Injector.create(this, [Hand, Finger, Nail, { provider: 'NAIL_COLOR', useValue: 'black' }]);
    this.hand = this.injector.instantiate(Hand);
  }
}

const body = new Body();
```

## Documentation

### Decorator @Injectable(options)

Marks the classes as injectable.

#### Option

Option | Required | Type | Default | Description
--- | --- | --- | --- | ---
`alias` | no | string | undefined | Alias name of the injectable class, reserved
`providers` | ``no`` | TProvider[] | undefined | Providers for the injectable class

### Decorator @Inject(token)

Marks parameters of the injectable classes as injectable with a specific token.

Param | Required | Type | Default | Description
--- | --- | --- | --- | ---
`token` | yes | string | - | String representation of the token with which parameter of the injectable type could be injected

### Injector

The Injector class builds the injection tree and resolve all dependencies. Supports unlimited level of dependencies.
This DI approach has inspired by angular and nest.js dependency injection, but realized pretty simple for using
outside of the bulky frameworks.

The tree traversal starts from root type (constructor or class) and going on to it's params of dependencies and so on.
At the every level makes scope object. Scope stores its own unique providers for using in the lower levels for
resolving instances.

#### Options

Option | Required | Type | Default | Description
--- | --- | --- | --- | ---
`strictProviders` | no | boolean | true | In the strict providers mode all injectable classes must be mentioned in providers
`debug` | no | boolean | false | On / Off debugger mode
