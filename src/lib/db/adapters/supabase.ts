import { buildDefaultSeed, MemoryDatabaseAdapter } from './shared';

export class SupabaseAdapter extends MemoryDatabaseAdapter {
  readonly url: string;
  readonly serviceKey: string;

  constructor(url: string, serviceKey: string) {
    super(buildDefaultSeed());
    this.url = url;
    this.serviceKey = serviceKey;
  }
}
