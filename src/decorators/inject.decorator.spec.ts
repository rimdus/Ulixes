import { expect } from 'chai';
import { Inject } from '.';
import { DecoratorHelper } from '.';

describe('inject.decorator',() => {
  context('main', () => {
    class Wheel {}
    class Car{
      constructor(@Inject('WHEEL_TOKEN') wheel: Wheel) {
      }
    }

    it('should stored toked be equal', () => {
      const params = DecoratorHelper.getInjectParams(Car);
      expect(params.get(0)).equal('WHEEL_TOKEN');
    });
  });
});
