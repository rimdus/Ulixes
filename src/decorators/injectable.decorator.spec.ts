import { expect } from 'chai';
import { Injectable, DecoratorHelper } from '.';

describe('injectable.decorator',() => {
  context('main', () => {
    class Wheel {}
    @Injectable({ alias: 'NewCar' })
    class Car{
      constructor( wheel: Wheel) {
      }
    }

    it('should stored token be equal', () => {
      const options = DecoratorHelper.getInjectionOptions(Car);
      expect(options.alias).equal('NewCar');
    });
  });
});
