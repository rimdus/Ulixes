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

@Injectable()
class Finger {
  constructor(
    @Inject('FINGER_OPT') public opt: { name: string },
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

class Core {
  public injector: Injector;
  public car: Car;

  constructor(providers?: TProvider[]) {
    this.injector = Injector.create(this, providers, { debug: true });
    this.car = this.injector.instantiate(Car);
  }
}

describe('Injector', () => {
  context('Flat cases', () => {

    it('should instantiate and return wheel code', () => {
      const core = new Core([Car, Wheel]);
      expect(core.car.getWheelCode()).equal('123');
    });

    it('should throws error class ProviderNotExistsException', () => {
      expect(() => new Core([Car])).to.throws(ProviderNotExistsException);
    });

    it('should inject SpareWheel as useClass instead of Wheel', () => {
      const core = new Core([Car, { provide: Wheel, useClass: SpareWheel }]);
      expect(core.car.getWheelCode()).equal('sw123');
    });

    it('should inject AnyWheel as useFactory instead of Wheel', () => {
      const core = new Core([Car, { provide: Wheel, useFactory: (obj) => new AnyWheel('custom', obj) }]);
      expect(core.car.getWheelCode()).equal('custom');
    });

    it('should inject AnyWheel as useFactory instead of Wheel and pass root object', () => {
      const core = new Core([Car, { provide: Wheel, useFactory: (obj) => new AnyWheel('custom', obj) }]);
      expect((core.car.wheel as AnyWheel).getObj()).equal(core);
    });

    it('should inject AnyWheel as useValue instead of Wheel', () => {
      const core = new Core([Car, { provide: Wheel, useValue: new AnyWheel('useValue') }]);
      expect(core.car.getWheelCode()).equal('useValue');
    });

    it('should inject literal object as useValue instead of Wheel', () => {
      const core = new Core([Car, { provide: Wheel, useValue: { getCode: () => 'wooden' } }]);
      expect(core.car.getWheelCode()).equal('wooden');
    });

    it('should injector.get returns instance of Wheel', () => {
      const core = new Core([Car, Wheel]);
      expect(core.injector.get(Wheel)).instanceOf(Wheel);
    });


  });

  context('Params cases', () => {
    it('should left arm\'s finger has initial name', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail]);
      expect(human.body.leftArm.indexFinger.opt.name).to.be.equal('index');
      expect(human.body.leftFoot.indexFinger).equal(human.body.leftArm.indexFinger);
    });
    it('should left arm\'s finger be injected by token', () => {
      const human = new Human([Body, Crutch, Arm, Foot, Finger, Nail, {
        provide: 'FINGER_OPT',
        useValue: { name: 'middle' },
      }]);
      expect(human.body.leftArm.indexFinger.opt.name).to.be.equal('middle');
    });
    it('should left arm be injected by custom class w/o injected params', () => {
      const human = new Human([Body, Crutch, Foot, Finger, Nail, Arm]);
      expect(human.body.crutch.indexFinger.opt.name).to.be.equal('pinky');
      expect(human.body.leftFoot.indexFinger.opt.name).to.be.equal('index');
      expect(human.body.crutch.indexFinger).not.equal(human.body.leftFoot.indexFinger);
    });
    it('should 2 left arm be injected by custom class w/o injected params', () => {
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
        start() { return `v${this.valves.count()}` }
      };
      const core = new Core([Car, Wheel, V6, Valves, { provide: 'MOTOR', useClass: V6 }, { provide: 'VALVES_COUNT', useValue: 6 }]);
      expect(core.injector.get(Car)?.start()).equal('v6');
    });

    it('should inject valves count by injection token', () => {
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
        start() { return `v${this.valves.count()}` }
      };
      const core = new Core([Car, Wheel, V6, Valves, { provide: 'MOTOR', useClass: V6 }, { provide: VALVES_COUNT, useValue: 6 }]);
      expect(core.injector.get(Car)?.start()).equal('v6');
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
        start() { return `v${this.valves.count()}` }
      };
      const core = new Core([Car, Wheel, V6, Valves, { provide: 'MOTOR', useClass: V6 }, { provide: VALVES_COUNT, useFactory: () => 6 }]);
      expect(core.injector.get(Car)?.start()).equal('v6');
    });
  });
});
