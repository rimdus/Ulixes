import { expect } from 'chai';
import { Inject, Injectable } from '../decorators';
import { Injector, ProviderNotExistsException } from '.';
import { TProvider } from '../interfaces';
import { InjectionToken } from './injection-token';

@Injectable()
class Nail {
  constructor(
    @Inject('NAIL_OPT') public opt: { color: string },
  ) {
    if (!this.opt) this.opt = { color: 'transparent' };
  }
}

const FINGER_COLOR_TOKEN = new InjectionToken('FINGER_COLOR_TOKEN');
const FINGER_BEAUTY_TOKEN = new InjectionToken('FINGER_BEAUTY_TOKEN');

@Injectable()
class Finger {
  constructor(
    @Inject('FINGER_OPT') public opt: { name: string },
    @Inject(FINGER_COLOR_TOKEN) public color: string,
    @Inject(FINGER_BEAUTY_TOKEN) public beauty: boolean,
    public nail: Nail,
  ) {
    if (!opt) this.opt = { name: 'index' };
  }
}

@Injectable()
class Arm {
  constructor(public indexFinger: Finger) {
  }
}

@Injectable()
class Foot {
  constructor(public indexFinger: Finger) {
  }
}

@Injectable({ providers: [{ provide: 'FINGER_OPT', useValue: { name: 'pinky' } }] })
class Crutch {
  constructor(public indexFinger: Finger) {
  }
}

@Injectable()
class Body {
  constructor(
    public leftArm: Arm,
    public leftFoot: Foot,
    public crutch: Crutch,
  ) {
  }
}

class Human {
  public injector: Injector;
  public body: Body;

  constructor(providers?: TProvider[]) {
    this.injector = Injector.create(this, providers, { debug: true });
    this.body = this.injector.instantiate(Body);
  }
}

interface IGetCode {
  getCode: () => string;
}

@Injectable()
class Wheel implements IGetCode {
  public getCode(): string {
    return '123';
  }
}

@Injectable()
class SpareWheel implements IGetCode {
  public getCode(): string {
    return 'sw123';
  }
}

@Injectable()
class AnyWheel implements IGetCode {
  private code: string;
  private obj: any;

  constructor(code: string, obj?: any) {
    this.code = code;
    this.obj = obj;
  }

  public getCode(): string {
    return this.code;
  }

  public getObj(): any {
    return this.obj;
  }
}

interface IMotor {
  start: () => string;
}

@Injectable()
class Car {
  constructor(
    public wheel: Wheel,
    @Inject('MOTOR') public motor: IMotor,
  ) {

  }

  public start(): string {
    if (this.motor) {
      return this.motor.start();
    }
    return '';
  }

  public getWheelCode(): string {
    return this.wheel.getCode();
  }
}

@Injectable()
class Core {
  constructor(public car: Car) {
  }
}

describe('Injector', () => {
  context('Flat cases', () => {

    it('should instantiate and return wheel code', () => {
      const core = Injector.create({}, [Core, Car, Wheel]).instantiate(Core);
      expect(core.car.getWheelCode()).equal('123');
    });

    it('should throws error class ProviderNotExistsException', () => {
      expect(() => Injector.create({}, [Car]).instantiate(Core)).throws(ProviderNotExistsException);
    });

    it('should inject SpareWheel as useClass instead of Wheel', () => {
      const core = Injector.create({}, [Core, Car, { provide: Wheel, useClass: SpareWheel }]).instantiate(Core);
      expect(core.car.getWheelCode()).equal('sw123');
    });

    it('should inject AnyWheel as useFactory instead of Wheel', () => {
      const core = Injector.create(
        {},
        [Core, Car, { provide: Wheel, useFactory: (obj) => new AnyWheel('custom', obj) }],
      ).instantiate(Core);
      expect(core.car.getWheelCode()).equal('custom');
    });

    it('should inject AnyWheel as useFactory instead of Wheel and pass root object', () => {
      const root = Object.create({});
      const core = Injector.create(root, [
        Core,
        Car,
        {
          provide: Wheel, useFactory: (obj) => new AnyWheel('custom', obj),
        },
      ]).instantiate(Core);
      expect((core.car.wheel as AnyWheel).getObj()).equal(root);
    });

    it('should inject AnyWheel as useValue instead of Wheel', () => {
      const core = Injector.create({}, [Core, Car, { provide: Wheel, useValue: new AnyWheel('useValue') }]).instantiate(
        Core);
      expect(core.car.getWheelCode()).equal('useValue');
    });

    it('should inject literal object as useValue instead of Wheel', () => {
      const core = Injector.create({}, [Core, Car, { provide: Wheel, useValue: { getCode: () => 'wooden' } }])
        .instantiate(Core);
      expect(core.car.getWheelCode()).equal('wooden');
    });

    it('should injector.get returns instance of Wheel', () => {
      const injector = Injector.create({}, [Core, Car, Wheel]);
      injector.instantiate(Core);
      expect(injector.get(Wheel)).instanceOf(Wheel);
    });
  });

  context('Params cases', () => {
    it('should left arm\'s finger has initial name', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail]);
      expect(human.body.leftArm.indexFinger.opt.name).to.be.equal('index');
      expect(human.body.leftFoot.indexFinger).equal(human.body.leftArm.indexFinger);
    });

    it('should left arm\'s finger be injected by token as useValue', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail, {
        provide: 'FINGER_OPT',
        useValue: { name: 'middle' },
      }]);
      expect(human.body.leftArm.indexFinger.opt.name).to.be.equal('middle');
    });

    it('should left finger\'s color be injected by token as useValue', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail, {
        provide: FINGER_COLOR_TOKEN,
        useValue: 'green',
      }]);
      expect(human.body.leftArm.indexFinger.color).to.be.equal('green');
    });

    it('should left finger\'s beauty be injected by token as useValue', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail, {
        provide: FINGER_BEAUTY_TOKEN,
        useValue: true,
      }]);
      expect(human.body.leftArm.indexFinger.beauty).to.be.true;
    });

    it('should left finger\'s beauty not be injected by token', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail]);
      expect(human.body.leftArm.indexFinger.beauty).to.be.undefined;
    });

    it('should left arm\'s finger be injected by token as useFactory', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail, {
        provide: 'FINGER_OPT',
        useFactory: () => ({ name: 'thumb' }),
      }]);
      expect(human.body.leftArm.indexFinger.opt.name).to.be.equal('thumb');
    });

    it('should left arm be injected by custom class w/o injected params', () => {
      const human = new Human([Body, Crutch, Foot, Finger, Nail, Arm]);
      expect(human.body.crutch.indexFinger.opt.name).to.be.equal('pinky');
      expect(human.body.leftFoot.indexFinger.opt.name).to.be.equal('index');
      expect(human.body.crutch.indexFinger).not.equal(human.body.leftFoot.indexFinger);
    });

    it('should 2 left arm be injected by custom class w/o injected params as useClass', () => {
      @Injectable({ providers: [{ provide: 'FINGER_OPT', useValue: { name: 'pinky' } }] })
      class CustomArm {
        constructor(public pinkyFinger: Finger) {
        }
      }

      const human = new Human([Body, Crutch, Foot, Finger, Nail, { provide: Arm, useClass: CustomArm }]);
      expect(((human.body.leftArm as unknown) as CustomArm).pinkyFinger.opt.name).to.be.equal('pinky');
      expect(human.body.leftFoot.indexFinger.opt.name).to.be.equal('index');
    });

    it('should start motor v6', () => {
      @Injectable()
      class Valves {
        private valvesCount = 0;

        constructor(@Inject('VALVES_COUNT') valvesCount: number) {
          this.valvesCount = valvesCount ?? this.valvesCount;
        }

        count(): number {
          return this.valvesCount;
        }
      }

      @Injectable()
      class V6 {
        constructor(private valves: Valves) {
        }

        start() {
          return `v${this.valves.count()}`
        }
      }

      const injector = Injector.create(
        {},
        [Core, Car, Wheel, V6, Valves, { provide: 'MOTOR', useClass: V6 }, { provide: 'VALVES_COUNT', useValue: 6 }],
      );
      injector.instantiate(Core);
      expect(injector.get(Car)?.start()).equal('v6');
    });

    it('should inject valves count by injection token', () => {
      const VALVES_COUNT = new InjectionToken('VALVES_COUNT');

      @Injectable()
      class Valves {
        private readonly valvesCount: number = 0;

        constructor(@Inject(VALVES_COUNT) valvesCount: number) {
          this.valvesCount = valvesCount ?? this.valvesCount;
        }

        count(): number {
          return this.valvesCount;
        }
      }

      @Injectable()
      class V6 {
        constructor(private valves: Valves) {
        }

        start() {
          return `v${this.valves.count()}`
        }
      }

      const injector = Injector.create(
        {},
        [Core, Car, Wheel, V6, Valves, { provide: 'MOTOR', useClass: V6 }, { provide: VALVES_COUNT, useValue: 6 }],
      );
      injector.instantiate(Core);
      expect(injector.get(Car)?.start()).equal('v6');
    });

    it('should inject valves count as factory', () => {
      const VALVES_COUNT = new InjectionToken('VALVES_COUNT');

      @Injectable()
      class Valves {
        private valvesCount = 0;

        constructor(@Inject(VALVES_COUNT) valvesCount: number) {
          this.valvesCount = valvesCount ?? this.valvesCount;
        }

        count(): number {
          return this.valvesCount;
        }
      }

      @Injectable()
      class V6 {
        constructor(private valves: Valves) {
        }

        start() {
          return `v${this.valves.count()}`
        }
      }

      const injector = Injector.create(
        {},
        [Core, Car, Wheel, V6, Valves, { provide: 'MOTOR', useClass: V6 }, {
          provide: VALVES_COUNT,
          useFactory: () => 6,
        }],
      );
      injector.instantiate(Core);
      expect(injector.get(Car)?.start()).equal('v6');
    });
  });

  context('Four level', () => {
    it('should inject nail\'s color black on 4 level as value', () => {
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

      const app = {}; // any object for being a root for the injector
      const injector = Injector.create(app, [Body, Hand, Finger, Nail, { provide: 'NAIL_COLOR', useValue: 'black' }]);
      const body = injector.instantiate(Body);
      expect(body.leftHand.finger.nail.color).equal('black');
    });
  });

  context('different siblings with same classes', () => {
    @Injectable()
    class Leaf {
      constructor(
        @Inject('color') public color: string,
        ) {
      }
    }

    @Injectable()
    class ColorUtils {
      constructor(public leaf: Leaf) {
      }

      public getColor(): string {
        return this.leaf.color;
      }
    }

    @Injectable({ providers: [{ provide: 'color', useValue: 'green' }] })
    class LeftSibling {
      constructor(
        public leaf: Leaf,
        public colorUtils: ColorUtils,
        ) {
      }
    }

    @Injectable({ providers: [{ provide: 'color', useValue: 'yellow' }] })
    class RightSibling {
      constructor(
        public leaf: Leaf,
        public colorUtils: ColorUtils,
        ) {
      }
    }

    @Injectable()
    class Trunk {
      constructor(
        public leftSibling: LeftSibling,
        public rightSibling: RightSibling,
      ) {
      }
    }

    class Tree {
      public injector: Injector;
      public trunk: Trunk;

      constructor(providers?: TProvider[]) {
        this.injector = Injector.create(this, providers, { debug: true });
        this.trunk = this.injector.instantiate(Trunk);
      }
    }

    it('should check one provider in different scopes', () => {
      const tree = new Tree([Trunk, RightSibling, LeftSibling, Leaf, ColorUtils]);
      expect(tree.trunk.leftSibling.leaf.color).to.be.equal('green');
      expect(tree.trunk.rightSibling.leaf.color).to.be.equal('yellow');
      expect(tree.trunk.leftSibling.colorUtils.getColor()).to.be.equal('green');
      expect(tree.trunk.rightSibling.colorUtils.getColor()).to.be.equal('yellow');
    });
  });
});
