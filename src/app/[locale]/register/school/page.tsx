'use client';

import { useSearchParams } from 'next/navigation';
import { PlayingSchoolEnrollmentWizard } from '@/components/harmonia/playing-school-enrollment-wizard';

export default function SchoolRegisterPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    return (
        <PlayingSchoolEnrollmentWizard token={token} />
    );
}
