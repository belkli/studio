import { buildDefaultSeed, MemoryDatabaseAdapter } from './shared';

export class PocketBaseAdapter extends MemoryDatabaseAdapter {
  readonly url: string;

  constructor(url: string) {
    super(buildDefaultSeed());
    this.url = url;
  }
}
