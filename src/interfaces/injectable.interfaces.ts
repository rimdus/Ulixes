import { TProvider } from './provider.interfaces';

export interface IInjectOptionsMetadata {
  alias?: string;
  providers?: TProvider<any>[];
}
