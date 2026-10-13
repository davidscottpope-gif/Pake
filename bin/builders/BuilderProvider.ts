import MacBuilder from './MacBuilder';
import { PakeAppOptions } from '@/types';

// This fork only builds macOS apps, so there is nothing to choose between:
// the provider just refuses to run anywhere else. (Upstream picks among
// MacBuilder, WinBuilder and LinuxBuilder by process.platform.)
export default class BuilderProvider {
  static create(options: PakeAppOptions): MacBuilder {
    if (process.platform !== 'darwin') {
      throw new Error('This fork only supports building on macOS.');
    }
    return new MacBuilder(options);
  }
}
