import { expect } from 'chai';
import { DecoratorHelper } from '.';

describe('decorator.helper', () => {
  context('methods', () => {
    it('should options be equal', () => {
      class DHCCls {
      }

      class DHCClsHlp {
      }

      DecoratorHelper.defineInjectOptions(
        DHCCls,
        { alias: 'DHCClsAlias', providers: [{ provide: DHCClsHlp, useClass: DHCClsHlp }] },
      );
      const dhOpt = DecoratorHelper.getInjectionOptions(DHCCls);
      expect(dhOpt.alias).equal('DHCClsAlias');
    });
  });
});
