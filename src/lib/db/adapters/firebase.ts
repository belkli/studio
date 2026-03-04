import { buildDefaultSeed, MemoryDatabaseAdapter } from './shared';

export class FirebaseAdapter extends MemoryDatabaseAdapter {
  constructor() {
    super(buildDefaultSeed());
  }
}
