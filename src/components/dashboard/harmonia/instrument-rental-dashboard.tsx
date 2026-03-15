'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { InstrumentInventory, InstrumentCondition, InstrumentRental, RentalCondition, RentalModel } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Undo2, Plus, Edit, Trash2, MoreVertical, Send, Link as LinkIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { tenantUsers } from '@/lib/tenant-filter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getConditionConfig = (t: any): Record<InstrumentCondition, { label: string; className: string }> => ({
  EXCELLENT: { label: t('conditionExcellent'), className: 'bg-green-100 text-green-800' },
  GOOD: { label: t('conditionGood'), className: 'bg-blue-100 text-blue-800' },
  FAIR: { label: t('conditionFair'), className: 'bg-yellow-100 text-yellow-800' },
  NEEDS_REPAIR: { label: t('conditionNeedsRepair'), className: 'bg-red-100 text-red-800' },
  RETIRED: { label: t('conditionRetired'), className: 'bg-gray-100 text-gray-800' },
});

function RentInstrumentDialog({
  instrument,
  open,
  onOpenChange,
}: {
  instrument: InstrumentInventory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, users, initiateInstrumentRental } = useAuth();
  const t = useTranslations('InstrumentRental');
  const { toast } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [rentalModel, setRentalModel] = useState<RentalModel>('deposit');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [depositAmountILS, setDepositAmountILS] = useState<number>(500);
  const [monthlyFeeILS, setMonthlyFeeILS] = useState<number>(180);
  const [purchasePriceILS, setPurchasePriceILS] = useState<number>(5000);
  const [monthsUntilPurchaseEligible, setMonthsUntilPurchaseEligible] = useState<number>(12);

  const students = useMemo(() => user ? tenantUsers(users, user, 'student').filter(u => u.approved) : [], [users, user]);

  useEffect(() => {
    if (!instrument || !open) return;
    const offered = instrument.rentalModelsOffered || ['deposit'];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRentalModel(offered[0]);
    setDepositAmountILS(instrument.depositAmountILS || 500);
    setMonthlyFeeILS(instrument.monthlyFeeILS || instrument.rentalRatePerMonth || 180);
    setPurchasePriceILS(instrument.purchasePriceILS || 5000);
    setMonthsUntilPurchaseEligible(instrument.monthsUntilPurchaseEligible || 12);
  }, [instrument, open]);

  if (!instrument) return null;

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const parentId = selectedStudent?.parentId;

  const sendForSignature = () => {
    if (!selectedStudentId || !parentId) return;

    const payload = {
      instrumentId: instrument.id,
      studentId: selectedStudentId,
      parentId,
      rentalModel,
      startDate,
      expectedReturnDate: rentalModel === 'monthly' ? undefined : expectedReturnDate,
      depositAmountILS: rentalModel === 'deposit' ? depositAmountILS : undefined,
      monthlyFeeILS: rentalModel === 'monthly' || rentalModel === 'rent_to_own' ? monthlyFeeILS : undefined,
      purchasePriceILS: rentalModel === 'rent_to_own' ? purchasePriceILS : undefined,
      monthsUntilPurchaseEligible: rentalModel === 'rent_to_own' ? monthsUntilPurchaseEligible : undefined,
    };

    const result = initiateInstrumentRental(payload);
    toast({
      title: t('signatureRequestSent'),
      description: t('signatureLinkReady', { link: result.signingLink }),
    });
    onOpenChange(false);
    setSelectedStudentId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('rentTitlePart1')} {instrument.type} - {instrument.brand}</DialogTitle>
          <DialogDescription>{t('rentDesc')}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>{t('renterStudent')}</Label>
            <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
              <SelectTrigger><SelectValue placeholder={t('selectStudentPlaceholder')} /></SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('rentalModel')}</Label>
            <Select value={rentalModel} onValueChange={(value: RentalModel) => setRentalModel(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(instrument.rentalModelsOffered || ['deposit']).includes('deposit') && <SelectItem value="deposit">{t('modelDeposit')}</SelectItem>}
                {(instrument.rentalModelsOffered || ['deposit']).includes('monthly') && <SelectItem value="monthly">{t('modelMonthly')}</SelectItem>}
                {(instrument.rentalModelsOffered || ['deposit']).includes('rent_to_own') && <SelectItem value="rent_to_own">{t('modelRentToOwn')}</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('startDate')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            {rentalModel !== 'monthly' && (
              <div className="space-y-2">
                <Label>{t('expectedReturnDate')}</Label>
                <Input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
              </div>
            )}
          </div>

          {rentalModel === 'deposit' && (
            <div className="space-y-2">
              <Label>{t('depositAmount')}</Label>
              <Input type="number" value={depositAmountILS} onChange={(e) => setDepositAmountILS(Number(e.target.value))} />
            </div>
          )}

          {rentalModel === 'monthly' && (
            <div className="space-y-2">
              <Label>{t('monthlyFee')}</Label>
              <Input type="number" value={monthlyFeeILS} onChange={(e) => setMonthlyFeeILS(Number(e.target.value))} />
            </div>
          )}

          {rentalModel === 'rent_to_own' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('monthlyFee')}</Label>
                <Input type="number" value={monthlyFeeILS} onChange={(e) => setMonthlyFeeILS(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>{t('purchasePrice')}</Label>
                <Input type="number" value={purchasePriceILS} onChange={(e) => setPurchasePriceILS(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>{t('monthsUntilPurchase')}</Label>
                <Input type="number" min={1} value={monthsUntilPurchaseEligible} onChange={(e) => setMonthsUntilPurchaseEligible(Number(e.target.value))} />
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">{t('remoteSignatureNotice')}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('cancelBtn')}</Button>
          <Button onClick={sendForSignature} disabled={!selectedStudentId || !parentId}>
            <Send className="me-2 h-4 w-4" />
            {t('sendForSignatureBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReturnRentalDialog({
  rental,
  open,
  onOpenChange,
}: {
  rental: InstrumentRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('InstrumentRental');
  const { markInstrumentRentalReturned } = useAuth();
  const [condition, setCondition] = useState<RentalCondition>('good');
  const [customRefund, setCustomRefund] = useState<string>('');
  const { toast } = useToast();

  if (!rental) return null;

  const onSubmit = () => {
    const custom = customRefund.trim() ? Number(customRefund) : undefined;
    const result = markInstrumentRentalReturned(rental.id, condition, custom);
    toast({ description: t('refundCalculated', { amount: String(result.refundAmountILS) }) });
    onOpenChange(false);
    setCondition('good');
    setCustomRefund('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('returnDialogTitle')}</DialogTitle>
          <DialogDescription>{t('returnDialogDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('returnedCondition')}</Label>
            <Select value={condition} onValueChange={(v: RentalCondition) => setCondition(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">{t('returnedExcellent')}</SelectItem>
                <SelectItem value="good">{t('returnedGood')}</SelectItem>
                <SelectItem value="fair">{t('returnedFair')}</SelectItem>
                <SelectItem value="damaged">{t('returnedDamaged')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('customRefundOptional')}</Label>
            <Input type="number" value={customRefund} onChange={(e) => setCustomRefund(e.target.value)} placeholder={t('leaveBlankAuto')} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('cancelBtn')}</Button>
          <Button onClick={onSubmit}>{t('confirmReturnBtn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstrumentFormDialog({
  instrument,
  open,
  onOpenChange,
  onSave,
}: {
  instrument?: InstrumentInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<InstrumentInventory>) => void;
}) {
  const [type, setType] = useState(instrument?.type || '');
  const [brand, setBrand] = useState(instrument?.brand || '');
  const [serialNumber, setSerialNumber] = useState(instrument?.serialNumber || '');
  const [condition, setCondition] = useState<InstrumentCondition>(instrument?.condition || 'GOOD');
  const [modelsOffered, setModelsOffered] = useState<RentalModel[]>(instrument?.rentalModelsOffered || ['deposit']);
  const [depositAmountILS, setDepositAmountILS] = useState<number>(instrument?.depositAmountILS || 500);
  const [monthlyFeeILS, setMonthlyFeeILS] = useState<number>(instrument?.monthlyFeeILS || instrument?.rentalRatePerMonth || 180);
  const [purchasePriceILS, setPurchasePriceILS] = useState<number>(instrument?.purchasePriceILS || 5000);
  const [monthsUntilPurchaseEligible, setMonthsUntilPurchaseEligible] = useState<number>(instrument?.monthsUntilPurchaseEligible || 12);

  const t = useTranslations('InstrumentRental');
  const conditionConfig = getConditionConfig(t);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setType(instrument?.type || '');
      setBrand(instrument?.brand || '');
      setSerialNumber(instrument?.serialNumber || '');
      setCondition(instrument?.condition || 'GOOD');
      setModelsOffered(instrument?.rentalModelsOffered || ['deposit']);
      setDepositAmountILS(instrument?.depositAmountILS || 500);
      setMonthlyFeeILS(instrument?.monthlyFeeILS || instrument?.rentalRatePerMonth || 180);
      setPurchasePriceILS(instrument?.purchasePriceILS || 5000);
      setMonthsUntilPurchaseEligible(instrument?.monthsUntilPurchaseEligible || 12);
    }
  }, [open, instrument]);

  const toggleModel = (model: RentalModel) => {
    setModelsOffered((prev) => prev.includes(model) ? prev.filter((item) => item !== model) : [...prev, model]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{instrument ? t('editInstrumentTitle') : t('addInstrumentTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('instrumentType')}</Label>
            <Input value={type} onChange={e => setType(e.target.value)} placeholder={t('instrumentTypePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('brandManufacturer')}</Label>
            <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder={t('brandPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('serialNumber')}</Label>
            <Input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('condition')}</Label>
            <Select value={condition} onValueChange={(val: InstrumentCondition) => setCondition(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(conditionConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('modelsOffered')}</Label>
            <div className="space-y-3">
              {(['deposit', 'monthly', 'rent_to_own'] as RentalModel[]).map((model) => (
                <label key={model} className="flex items-center gap-2.5">
                  <input type="checkbox" checked={modelsOffered.includes(model)} onChange={() => toggleModel(model)} />
                  <span className="text-sm">
                    {model === 'deposit' ? t('modelDeposit') : model === 'monthly' ? t('modelMonthly') : t('modelRentToOwn')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {modelsOffered.includes('deposit') && (
            <div className="space-y-2">
              <Label>{t('depositAmount')}</Label>
              <Input type="number" value={depositAmountILS} onChange={(e) => setDepositAmountILS(Number(e.target.value))} />
            </div>
          )}
          {modelsOffered.includes('monthly') && (
            <div className="space-y-2">
              <Label>{t('monthlyFee')}</Label>
              <Input type="number" value={monthlyFeeILS} onChange={(e) => setMonthlyFeeILS(Number(e.target.value))} />
            </div>
          )}
          {modelsOffered.includes('rent_to_own') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('purchasePrice')}</Label>
                <Input type="number" value={purchasePriceILS} onChange={(e) => setPurchasePriceILS(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>{t('monthsUntilPurchase')}</Label>
                <Input type="number" value={monthsUntilPurchaseEligible} onChange={(e) => setMonthsUntilPurchaseEligible(Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('cancelBtn')}</Button>
          <Button
            onClick={() => {
              onSave({
                type,
                brand,
                serialNumber,
                condition,
                rentalModelsOffered: modelsOffered,
                depositAmountILS,
                monthlyFeeILS,
                purchasePriceILS,
                monthsUntilPurchaseEligible,
              });
              onOpenChange(false);
            }}
            disabled={!type || !brand}
          >
            {instrument ? t('saveChangesBtn') : t('addInstrumentBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InstrumentRentalDashboard() {
  const {
    users,
    instrumentInventory,
    instrumentRentals,
    addInstrument,
    updateInstrument,
    deleteInstrument,
  } = useAuth();

  const [instrumentToRent, setInstrumentToRent] = useState<InstrumentInventory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<InstrumentInventory | undefined>(undefined);
  const [rentalToReturn, setRentalToReturn] = useState<InstrumentRental | null>(null);
  const t = useTranslations('InstrumentRental');
  const dateLocale = useDateLocale();
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const conditionConfig = getConditionConfig(t);

  const { available, rentals } = useMemo(() => {
    const activeInstrumentIds = new Set(
      instrumentRentals
        .filter(r => r.status === 'pending_signature' || r.status === 'active' || r.status === 'overdue')
        .map(r => r.instrumentId)
    );

    const available = instrumentInventory.filter(inst => !activeInstrumentIds.has(inst.id));
    const rentals = instrumentRentals
      .filter(r => r.status !== 'returned')
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
    return { available, rentals };
  }, [instrumentInventory, instrumentRentals]);

  const getInstrument = (id: string) => instrumentInventory.find(inst => inst.id === id);
  const getStudent = (id: string) => users.find(u => u.id === id);

  const modelLabel = (model: RentalModel) => (
    model === 'deposit' ? t('modelDeposit') : model === 'monthly' ? t('modelMonthly') : t('modelRentToOwn')
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      <Tabs defaultValue="available" dir={isRtl ? 'rtl' : 'ltr'}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">{t('availableInStock')} ({available.length})</TabsTrigger>
          <TabsTrigger value="rentals">{t('rentedOut')} ({rentals.length})</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <TabsContent value="available" className="m-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-start">{t('availableInstrumentsToRent')}</CardTitle>
                <CardDescription className="text-start">{t('adminConfigHint')}</CardDescription>
              </div>
              <Button onClick={() => { setEditingInst(undefined); setIsFormOpen(true); }}>
                <Plus className="me-2 h-4 w-4" />
                {t('addInstrumentHeaderBtn')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('instrumentType')}</TableHead>
                    <TableHead className="text-start">{t('brandManufacturer')}</TableHead>
                    <TableHead className="text-start">{t('serialNumber')}</TableHead>
                    <TableHead className="text-start">{t('condition')}</TableHead>
                    <TableHead className="text-end">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {available.map(inst => (
                    <TableRow key={inst.id}>
                      <TableCell>{inst.type}</TableCell>
                      <TableCell>{inst.brand}</TableCell>
                      <TableCell className="font-mono">{inst.serialNumber}</TableCell>
                      <TableCell><Badge className={conditionConfig[inst.condition].className}>{conditionConfig[inst.condition].label}</Badge></TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => setInstrumentToRent(inst)}>
                            <Send className="me-2 h-4 w-4" />
                            {t('sendForSignatureBtn')}
                          </Button>
                          <DropdownMenu dir={isRtl ? 'rtl' : 'ltr'}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('actions')}><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingInst(inst); setIsFormOpen(true); }}><Edit className="me-2 h-4 w-4" /> {t('editBtn')}</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(t('confirmDelete'))) deleteInstrument(inst.id); }}><Trash2 className="me-2 h-4 w-4" /> {t('deleteBtn')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {available.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">{t('noAvailableInstruments')}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>

          <TabsContent value="rentals" className="m-0">
            <CardHeader>
              <CardTitle className="text-start">{t('rentedInstruments')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('instrumentType')}</TableHead>
                    <TableHead className="text-start">{t('rentedTo')}</TableHead>
                    <TableHead className="text-start">{t('rentalDate')}</TableHead>
                    <TableHead className="text-start">{t('rentalModel')}</TableHead>
                    <TableHead className="text-start">{t('status')}</TableHead>
                    <TableHead className="text-end">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentals.map(rental => {
                    const inst = getInstrument(rental.instrumentId);
                    const student = getStudent(rental.studentId);
                    const signingLink = '/' + locale + '/rental-sign/' + rental.signingToken;
                    return (
                      <TableRow key={rental.id}>
                        <TableCell>{inst?.type || t('unknown')}</TableCell>
                        <TableCell>{student?.name || t('unknown')}</TableCell>
                        <TableCell>
                          {format(new Date(rental.startDate), 'PP', { locale: dateLocale })}
                          <p className="text-xs text-muted-foreground">({formatDistanceToNow(new Date(rental.startDate), { locale: dateLocale, addSuffix: true })})</p>
                        </TableCell>
                        <TableCell>{modelLabel(rental.rentalModel)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t('status_' + rental.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-2">
                            {rental.status === 'pending_signature' && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={signingLink} target="_blank" rel="noreferrer"><LinkIcon className="me-2 h-4 w-4" />{t('openSigningLink')}</a>
                              </Button>
                            )}
                            {rental.status === 'active' && (
                              <Button size="sm" variant="outline" onClick={() => setRentalToReturn(rental)}>
                                <Undo2 className="me-2 h-4 w-4" />{t('returnBtn')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rentals.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">{t('noRentedInstruments')}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>

      <RentInstrumentDialog instrument={instrumentToRent} open={!!instrumentToRent} onOpenChange={() => setInstrumentToRent(null)} />

      <ReturnRentalDialog rental={rentalToReturn} open={!!rentalToReturn} onOpenChange={() => setRentalToReturn(null)} />

      <InstrumentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        instrument={editingInst}
        onSave={(data) => {
          if (editingInst) {
            updateInstrument(editingInst.id, data);
          } else {
            addInstrument(data);
          }
        }}
      />
    </div>
  );
}
