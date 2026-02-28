'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { School, Users, DollarSign, Plus, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SchoolPartnership, PartnershipStatus, SubsidyModel } from '@/lib/types';

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

const statusConfig: Record<PartnershipStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ACTIVE: { label: 'פעיל', variant: 'default' },
    PENDING: { label: 'ממתין', variant: 'secondary' },
    SUSPENDED: { label: 'מושעה', variant: 'destructive' },
    ENDED: { label: 'הסתיים', variant: 'outline' },
};

// ── Create Partnership Dialog ─────────────────────────────────────────────────

function CreatePartnershipDialog({ onCreated }: { onCreated: (p: SchoolPartnership) => void }) {
    const { toast } = useToast();
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
            toast({ variant: 'destructive', title: 'שגיאה', description: 'יש למלא שם בית ספר וסמל מוסד.' });
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
        toast({ title: 'שותפות נוצרה', description: `${schoolName} נוספה בהצלחה.` });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />הוסף שותפות חדשה</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>יצירת שותפות בית ספר מנגן</DialogTitle>
                    <DialogDescription>מלא את פרטי בית הספר השותף ומודל הסובסידיה.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>שם בית הספר</Label>
                        <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="בית ספר אורט..." />
                    </div>
                    <div className="space-y-2">
                        <Label>סמל מוסד</Label>
                        <Input value={schoolSymbol} onChange={e => setSchoolSymbol(e.target.value)} placeholder="410234" />
                    </div>
                    <div className="space-y-2">
                        <Label>אימייל קשר</Label>
                        <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>טלפון קשר</Label>
                        <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label>כתובת</Label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>מודל סובסידיה</Label>
                        <Select value={subsidyModel} onValueChange={v => setSubsidyModel(v as SubsidyModel)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL_MUNICIPAL">עירייה מלאה</SelectItem>
                                <SelectItem value="SPLIT">שיתוף (עירייה + הורה)</SelectItem>
                                <SelectItem value="PARENT_ONLY">הורה בלבד</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>% סובסידיית עירייה</Label>
                        <Input type="number" value={municipalPercent} onChange={e => setMunicipalPercent(e.target.value)} max={100} min={0} />
                    </div>
                    <div className="space-y-2">
                        <Label>% סובסידיית משרד החינוך</Label>
                        <Input type="number" value={ministryPercent} onChange={e => setMinistryPercent(e.target.value)} max={100} min={0} />
                    </div>
                    <div className="space-y-2">
                        <Label>תשלום הורה לשנה (₪)</Label>
                        <Input type="number" value={parentContribution} onChange={e => setParentContribution(e.target.value)} min={0} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                    <Button onClick={handleSubmit}>צור שותפות</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SchoolPartnershipDashboard() {
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
                        בית ספר מנגן
                    </h1>
                    <p className="text-muted-foreground mt-1">ניהול שותפויות עם בתי ספר יסודיים</p>
                </div>
                <CreatePartnershipDialog onCreated={handleCreated} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">שותפויות פעילות</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">{pendingCount} ממתינות לאישור</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">תלמידים רשומים</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground">בכל בתי הספר</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">שנת לימודים</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">תשפ"ו</div>
                        <p className="text-xs text-muted-foreground">שנה אקדמית פעילה</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="partnerships">שותפויות</TabsTrigger>
                    <TabsTrigger value="billing">חיובים</TabsTrigger>
                </TabsList>

                <TabsContent value="partnerships" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>רשימת שותפויות</CardTitle>
                            <CardDescription>כל בתי הספר השותפים בתוכנית בית ספר מנגן</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>שם בית הספר</TableHead>
                                        <TableHead>סמל מוסד</TableHead>
                                        <TableHead>מודל סובסידיה</TableHead>
                                        <TableHead>תלמידים</TableHead>
                                        <TableHead>סטטוס</TableHead>
                                        <TableHead>פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {partnerships.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.schoolName}</TableCell>
                                            <TableCell className="text-muted-foreground">{p.schoolSymbol}</TableCell>
                                            <TableCell>
                                                {p.subsidyModel === 'FULL_MUNICIPAL' && 'עירייה מלאה'}
                                                {p.subsidyModel === 'SPLIT' && `שיתוף ${p.municipalSubsidyPercent}%+${p.ministrySubsidyPercent}%`}
                                                {p.subsidyModel === 'PARENT_ONLY' && 'הורה בלבד'}
                                            </TableCell>
                                            <TableCell>
                                                {p.programs.reduce((s, prog) => s + prog.maxStudents, 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[p.status].variant}>
                                                    {statusConfig[p.status].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
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
                            <CardTitle>חיובים — בית ספר מנגן</CardTitle>
                            <CardDescription>סקירת תשלומים עירוניים, תשלומי הורים ותביעות משרד החינוך</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">מודול הכספים ייפתח בשלב 2 של הפיתוח.</p>
                                <p className="text-xs mt-1">ניתן לצפות בחיובים הרגילים בלשונית הכספים הראשית.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
