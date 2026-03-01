'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { School, Users, DollarSign, Plus, ExternalLink, CheckCircle, Clock, XCircle, Share2, BarChart3, UserPlus, Mail } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useToast } from '@/hooks/use-toast';
import type { SchoolPartnership, PartnershipStatus, SubsidyModel } from '@/lib/types';
import { cn } from '@/lib/utils';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PARTNERSHIPS: SchoolPartnership[] = [
    {
        id: 'p-1',
        conservatoriumId: 'cons-1',
        schoolName: 'בית ספר אורט רמת גן',
        schoolSymbol: '410234',
        municipalityId: 'mun-ramat-gan',
        coordinatorUserId: 'coord-1',
        contactEmail: 'coordinator@ort-rg.edu',
        contactPhone: '03-1234567',
        address: 'רחוב הרצל 45, רמת גן',
        academicYear: 'תשפ"ו',
        status: 'ACTIVE',
        subsidyModel: 'SPLIT',
        municipalSubsidyPercent: 60,
        ministrySubsidyPercent: 10,
        parentContributionPerYear: 400,
        programs: [
            {
                programId: 'prog-1',
                instrument: 'חליל',
                targetGrades: ["ב'", "ג'"],
                teacherId: 'teacher-1',
                dayOfWeek: 'WED',
                startTime: '10:00',
                durationMinutes: 45,
                roomAtSchool: 'חדר מוסיקה 3',
                maxStudents: 12,
                excellenceTrackEnabled: true,
            },
        ],
        createdAt: '2025-09-01T08:00:00.000Z',
        updatedAt: '2026-01-15T10:30:00.000Z',
    },
    {
        id: 'p-2',
        conservatoriumId: 'cons-1',
        schoolName: 'בית ספר ממלכתי דינור',
        schoolSymbol: '411005',
        municipalityId: 'mun-ramat-gan',
        coordinatorUserId: 'coord-2',
        contactEmail: 'dinur@school.edu',
        contactPhone: '03-9876543',
        address: 'שדרות ירושלים 12, רמת גן',
        academicYear: 'תשפ"ו',
        status: 'PENDING',
        subsidyModel: 'FULL_MUNICIPAL',
        municipalSubsidyPercent: 80,
        ministrySubsidyPercent: 0,
        parentContributionPerYear: 150,
        programs: [],
        createdAt: '2026-01-20T09:00:00.000Z',
        updatedAt: '2026-01-20T09:00:00.000Z',
    },
];

// ── Status helpers ────────────────────────────────────────────────────────────

const statusConfig: Record<PartnershipStatus, { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ACTIVE: { labelKey: 'status.ACTIVE', variant: 'default' },
    PENDING: { labelKey: 'status.PENDING', variant: 'secondary' },
    SUSPENDED: { labelKey: 'status.SUSPENDED', variant: 'destructive' },
    ENDED: { labelKey: 'status.ENDED', variant: 'outline' },
};

// ── Create Partnership Dialog ─────────────────────────────────────────────────

function CreatePartnershipDialog({ onCreated, isRtl }: { onCreated: (p: SchoolPartnership) => void, isRtl: boolean }) {
    const { toast } = useToast();
    const t = useTranslations('PlayingSchool');
    const [open, setOpen] = useState(false);
    const [schoolName, setSchoolName] = useState('');
    const [schoolSymbol, setSchoolSymbol] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [address, setAddress] = useState('');
    const [subsidyModel, setSubsidyModel] = useState<SubsidyModel>('SPLIT');
    const [municipalPercent, setMunicipalPercent] = useState('60');
    const [ministryPercent, setMinistryPercent] = useState('10');
    const [parentContribution, setParentContribution] = useState('400');

    const handleSubmit = () => {
        if (!schoolName || !schoolSymbol) {
            toast({ variant: 'destructive', title: t('errorToast'), description: t('errorToastDesc') });
            return;
        }
        const newPartnership: SchoolPartnership = {
            id: `p-${Date.now()}`,
            conservatoriumId: 'cons-1',
            schoolName,
            schoolSymbol,
            municipalityId: 'mun-1',
            coordinatorUserId: '',
            contactEmail,
            contactPhone,
            address,
            academicYear: 'תשפ"ו',
            status: 'PENDING',
            subsidyModel,
            municipalSubsidyPercent: parseInt(municipalPercent) || 0,
            ministrySubsidyPercent: parseInt(ministryPercent) || 0,
            parentContributionPerYear: parseInt(parentContribution) || 0,
            programs: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        onCreated(newPartnership);
        toast({ title: t('successToast'), description: t('successToastDesc', { schoolName }) });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className={isRtl ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />{t('addPartnership')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle>{t('createPartnershipTitle')}</DialogTitle>
                    <DialogDescription>{t('createPartnershipDesc')}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>{t('schoolName')}</Label>
                        <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="..." />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('schoolSymbol')}</Label>
                        <Input value={schoolSymbol} onChange={e => setSchoolSymbol(e.target.value)} placeholder="410234" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('contactEmail')}</Label>
                        <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('contactPhone')}</Label>
                        <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label>{t('address')}</Label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('subsidyModelLvl')}</Label>
                        <Select value={subsidyModel} onValueChange={v => setSubsidyModel(v as SubsidyModel)} dir={isRtl ? 'rtl' : 'ltr'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL_MUNICIPAL">{t('subsidyModel.FULL_MUNICIPAL')}</SelectItem>
                                <SelectItem value="SPLIT">{t('subsidyModel.SPLIT')}</SelectItem>
                                <SelectItem value="PARENT_ONLY">{t('subsidyModel.PARENT_ONLY')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('municipalSubsidyPercent')}</Label>
                        <Input type="number" value={municipalPercent} onChange={e => setMunicipalPercent(e.target.value)} max={100} min={0} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('ministrySubsidyPercent')}</Label>
                        <Input type="number" value={ministryPercent} onChange={e => setMinistryPercent(e.target.value)} max={100} min={0} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('parentYearlyContribution')}</Label>
                        <Input type="number" value={parentContribution} onChange={e => setParentContribution(e.target.value)} min={0} />
                    </div>
                </div>
                <DialogFooter className={cn(isRtl && "sm:justify-start")}>
                    <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit}>{t('create')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Invite Coordinator Dialog ─────────────────────────────────────────────────

function InviteCoordinatorDialog({ partnershipId, schoolName, isRtl }: { partnershipId: string, schoolName: string, isRtl: boolean }) {
    const { toast } = useToast();
    const t = useTranslations('PlayingSchool');
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async () => {
        if (!email || !email.includes('@')) {
            toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
            return;
        }

        setIsSending(true);
        try {
            const { inviteSchoolCoordinator } = await import('@/app/actions');
            const result = await inviteSchoolCoordinator({ partnershipId, email });
            toast({ title: 'Invitation Sent', description: result.message });
            setOpen(false);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send invitation.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    <UserPlus className="h-4 w-4 me-1" />
                    {t('inviteBtn')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-600" />
                        {t('inviteCoordinatorTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('inviteCoordinatorDesc', { schoolName })}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('coordinatorEmail')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="coordinator@school.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter className={cn(isRtl && "sm:justify-start")}>
                    <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={isSending}>
                        {isSending ? "Sending..." : t('sendInvite')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SchoolPartnershipDashboard() {
    const t = useTranslations('PlayingSchool');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [partnerships, setPartnerships] = useState<SchoolPartnership[]>(MOCK_PARTNERSHIPS);
    const [activeTab, setActiveTab] = useState('partnerships');

    const totalEnrollments = partnerships.reduce((acc, p) =>
        acc + p.programs.reduce((s, prog) => s + prog.maxStudents, 0), 0);
    const activeCount = partnerships.filter(p => p.status === 'ACTIVE').length;
    const pendingCount = partnerships.filter(p => p.status === 'PENDING').length;

    const handleCreated = (p: SchoolPartnership) =>
        setPartnerships(prev => [p, ...prev]);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <School className="h-6 w-6 text-primary" />
                        {t('pageTitle')}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t('adminSubtitle')}</p>
                </div>
                <CreatePartnershipDialog onCreated={handleCreated} isRtl={isRtl} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('activePartnerships')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">{t('pendingPartnerships', { count: pendingCount })}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('enrolledStudents')}</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground">{t('allSchools')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('academicYearLvl')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">תשפ"ו</div>
                        <p className="text-xs text-muted-foreground">{t('activeYear')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} dir={isRtl ? 'rtl' : 'ltr'}>
                <TabsList>
                    <TabsTrigger value="partnerships">{t('tabs.partnerships')}</TabsTrigger>
                    <TabsTrigger value="billing">{t('tabs.billing')}</TabsTrigger>
                </TabsList>

                <TabsContent value="partnerships" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('partnershipList')}</CardTitle>
                            <CardDescription>{t('partnershipListDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table dir={isRtl ? 'rtl' : 'ltr'}>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('table.school')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('table.symbol')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('table.model')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('table.students')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('table.status')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('table.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {partnerships.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.schoolName}</TableCell>
                                            <TableCell className="text-muted-foreground">{p.schoolSymbol}</TableCell>
                                            <TableCell>
                                                {p.subsidyModel === 'FULL_MUNICIPAL' && t('subsidyModel.FULL_MUNICIPAL')}
                                                {p.subsidyModel === 'SPLIT' && `${t('subsidyModel.SPLIT')} ${p.municipalSubsidyPercent}%+${p.ministrySubsidyPercent}%`}
                                                {p.subsidyModel === 'PARENT_ONLY' && t('subsidyModel.PARENT_ONLY')}
                                            </TableCell>
                                            <TableCell>
                                                {p.programs.reduce((s, prog) => s + prog.maxStudents, 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[p.status].variant}>
                                                    {t(statusConfig[p.status].labelKey)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/dashboard/admin/playing-school/distribute?partnershipId=${p.id}`}>
                                                            <BarChart3 className="h-4 w-4 me-1" />
                                                            {t('distributeBtn')}
                                                        </Link>
                                                    </Button>
                                                    <InviteCoordinatorDialog
                                                        partnershipId={p.id}
                                                        schoolName={p.schoolName}
                                                        isRtl={isRtl}
                                                    />
                                                    <Button variant="ghost" size="sm">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('billing.title')}</CardTitle>
                            <CardDescription>{t('billing.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">{t('billing.wip')}</p>
                                <p className="text-xs mt-1">{t('billing.wipNote')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
