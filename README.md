# Ulixes

The Lightweight Dependency Injection package in the Angular and NestJs style for Node.Js based on the inversion of
control (IoC).

## Installation

```
npm install ulixes
```

## Examples

### Simple injection

```typescript
import { Injectable, Inject, Injector } from 'ulixes';

@Injectable()
class Finger {
  constructor() {
  }

  public getName(): string {
    return 'thumb';
  }
}

@Injectable()
class Hand {
  constructor(public finger: Finger) {
  }
}

@Injectable()
class Body {
  constructor(public leftHand: Hand) {
  }
}

const app = {}; // any object for being a root for the injector or undefined for use global object
const injector = Injector.create(app, [Body, Hand, Finger]);
const body = injector.instantiate(Body);
expect(body.leftHand.finger.getName()).equal('thumb');
```

### UseValue injection

```typescript
import { Injectable, Inject, Injector } from 'ulixes';

@Injectable()
class Finger {
  constructor(private name: string) {
    this.name = this.name || 'thumb';
  }

  public getName(): string {
    return this.name;
  }
}

@Injectable()
class Hand {
  constructor(public finger: Finger) {
  }
}

@Injectable()
class Body {
  constructor(public leftHand: Hand) {
  }
}

const indexFinger = new Finger('index');
const injector = Injector.create(null /* using global */, [
  Body,
  Hand,
  { provide: Finger, useValue: indexFinger },
]);
const body = injector.instantiate(Body);
expect(body.leftHand.finger.getName()).equal('index');
```

### UseClass injection

```typescript
import { Injectable, Inject, Injector } from 'ulixes';

@Injectable()
class Finger {
  constructor(private name: string) {
    this.name = this.name || 'thumb';
  }

  public getName(): string {
    return this.name;
  }
}

class MiddleFinger extends Finger {
  constructor() {
    super('middle');
  }
}

@Injectable()
class Hand {
  constructor(public finger: Finger) {
  }
}

@Injectable()
class Body {
  constructor(public leftHand: Hand) {
  }
}

const injector = Injector.create(null /* using global */, [
  Body,
  Hand,
  { provide: Finger, useClass: MiddleFinger },
]);
const body = injector.instantiate(Body);
expect(body.leftHand.finger.getName()).equal('middle');
```

### UseFactory injection

```typescript
import { Injectable, Inject, Injector } from 'ulixes';

@Injectable()
class Finger {
  constructor(private name: string) {
    this.name = this.name || 'thumb';
  }

  public getName(): string {
    return this.name;
  }
}

@Injectable()
class Hand {
  constructor(public finger: Finger) {
  }
}

@Injectable()
class Body {
  constructor(public leftHand: Hand) {
  }
}

const injector = Injector.create(null /* using global */, [
  Body,
  Hand,
  { provide: Finger, useFactory: () => new Finger('middle') },
]);
const body = injector.instantiate(Body);
expect(body.leftHand.finger.getName()).equal('middle');
```

### Inject param by token

```typescript
import { Injectable, Inject, Injector } from 'ulixes';

@Injectable()
class Nail {
  public color = 'transparent';

  constructor(@Inject('NAIL_COLOR') color: string) {
    this.color = color;
  }
}

@Injectable()
class Finger {
  constructor(public nail: Nail) {
  }
}

@Injectable()
class Hand {
  constructor(public finger: Finger) {
  }
}

@Injectable()
class Body {
  constructor(public leftHand: Hand) {
  }
}

const injector = Injector.create(null /* using global */, [
  Body,
  Hand,
  Finger,
  Nail,
  { provide: 'NAIL_COLOR', useValue: 'black' },
]);
const body = injector.instantiate(Body);
expect(body.leftHand.finger.nail.color).equal('black');
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
This DI approach has inspired by angular and nest.js dependency injection, but realized pretty simple for using outside
of the bulky frameworks.

The tree traversal starts from root type (constructor or class) and going on to it's params of dependencies and so on.
At the every level makes scope object. Scope stores its own unique providers for using in the lower levels for resolving
instances.

#### Options

Option | Required | Type | Default | Description
--- | --- | --- | --- | ---
`strictProviders` | no | boolean | true | In the strict providers mode all injectable classes must be mentioned in providers
`debug` | no | boolean | false | On / Off debugger mode
