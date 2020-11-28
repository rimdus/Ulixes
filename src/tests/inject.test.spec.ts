import { expect } from 'chai';
import { Injectable } from '../decorators';
import { Inject } from '../decorators';

describe('Inject', () => {
  context('type', () => {
    class Cba {}
    @Injectable()
    class Abc{
      constructor(@Inject() cba: Cba) {
      }

    }

    it('should ', () => {
      expect(true).equal(true);
    });
  });
});
