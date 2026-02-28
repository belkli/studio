import { createHash } from 'crypto';
import type { Conservatorium } from '@/lib/types';

export function computeConservatoriumSourceHash(cons: Partial<Conservatorium>): string {
    const sourceFields = [
        cons.name ?? '',
        cons.about ?? '',
        cons.openingHours ?? '',
        cons.manager?.role ?? '',
        cons.manager?.bio ?? '',
        cons.pedagogicalCoordinator?.role ?? '',
        cons.pedagogicalCoordinator?.bio ?? '',
        (cons.departments ?? []).map(d => d.name).join('|'),
        (cons.programs ?? []).join('|'),
        (cons.ensembles ?? []).join('|'),
        (cons.branchesInfo ?? []).map(b => `${b.name}|${b.address ?? ''}`).join('||'),
    ].join('\n---\n');

    return createHash('sha256').update(sourceFields, 'utf8').digest('hex').slice(0, 16);
}

export function computeUserSourceHash(bio?: string, role?: string): string {
    return createHash('sha256')
        .update(`${bio ?? ''}|${role ?? ''}`, 'utf8')
        .digest('hex')
        .slice(0, 16);
}
