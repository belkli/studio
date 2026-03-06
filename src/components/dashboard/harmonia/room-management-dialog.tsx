'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import type { Branch, Room } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, MoreHorizontal, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslations, useLocale } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roomSchema = z.object({
  name: z.string().min(1),
  capacity: z.coerce.number().min(1),
  description: z.string().optional(),
  instrumentEquipment: z.array(z.object({
    instrumentId: z.string().min(1),
    quantity: z.coerce.number().min(1).max(10),
    notes: z.string().optional(),
  })),
});

type RoomFormData = z.infer<typeof roomSchema>;

export function RoomManagementDialog({
  branch,
  open,
  onOpenChange,
}: {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, rooms, addRoom, updateRoom, deleteRoom, conservatoriumInstruments } = useAuth();
  const t = useTranslations('RoomManagementDialog');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [blockingRoom, setBlockingRoom] = useState<Room | null>(null);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema) as any,
    defaultValues: {
      name: '',
      capacity: 1,
      description: '',
      instrumentEquipment: [],
    },
  });

  const equipmentArray = useFieldArray({
    control: form.control,
    name: 'instrumentEquipment',
  });

  const branchRooms = useMemo(() => {
    if (!branch) return [];
    return rooms.filter((room) => room.branchId === branch.id);
  }, [rooms, branch]);

  const instrumentsForBranch = useMemo(() => {
    if (!branch) return [];
    return conservatoriumInstruments
      .filter((item) => item.isActive && item.conservatoriumId === branch.conservatoriumId)
      .map((item) => {
        const label = locale === 'he'
          ? item.names.he
          : locale === 'ar'
            ? item.names.ar || item.names.en
            : locale === 'ru'
              ? item.names.ru || item.names.en
              : item.names.en;
        return { id: item.id, label };
      });
  }, [branch, conservatoriumInstruments, locale]);

  useEffect(() => {
    if (!isFormOpen) {
      form.reset({ name: '', capacity: 1, description: '', instrumentEquipment: [] });
      return;
    }

    if (editingRoom) {
      form.reset({
        name: editingRoom.name,
        capacity: editingRoom.capacity,
        description: editingRoom.description || '',
        instrumentEquipment: editingRoom.instrumentEquipment || [],
      });
      return;
    }

    form.reset({ name: '', capacity: 1, description: '', instrumentEquipment: [] });
  }, [editingRoom, isFormOpen, form]);

  const handleSave = (values: RoomFormData) => {
    if (!branch) return;

    const roomData: Partial<Room> = {
      conservatoriumId: branch.conservatoriumId,
      branchId: branch.id,
      name: values.name,
      capacity: values.capacity,
      description: values.description,
      instrumentEquipment: values.instrumentEquipment,
      isActive: true,
      blocks: editingRoom?.blocks || [],
    };

    if (editingRoom) {
      updateRoom(editingRoom.id, roomData);
    } else {
      addRoom(roomData);
    }

    setEditingRoom(null);
    setIsFormOpen(false);
  };

  const handleDelete = (roomId: string) => {
    if (!confirm(t('confirmDelete'))) return;
    deleteRoom(roomId);
  };

  const activeBlocks = (room: Room) =>
    (room.blocks || []).filter((block) => new Date(block.endDateTime) > new Date());

  const equipmentSummary = (room: Room) => {
    const items = room.instrumentEquipment || [];
    if (items.length === 0) return t('noEquipment');

    return items
      .map((item) => {
        const instrument = instrumentsForBranch.find((entry) => entry.id === item.instrumentId);
        return `${instrument?.label || item.instrumentId} x${item.quantity}`;
      })
      .join(', ');
  };

  const saveBlock = () => {
    if (!blockingRoom || !blockStart || !blockEnd || !blockReason.trim()) return;

    const newBlock = {
      id: `block-${Date.now()}`,
      startDateTime: new Date(blockStart).toISOString(),
      endDateTime: new Date(blockEnd).toISOString(),
      reason: blockReason.trim(),
      blockedByUserId: user?.id || 'system',
    };

    updateRoom(blockingRoom.id, {
      blocks: [...(blockingRoom.blocks || []), newBlock],
    });

    setBlockingRoom(null);
    setBlockStart('');
    setBlockEnd('');
    setBlockReason('');
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            setEditingRoom(null);
            setIsFormOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-5xl" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-start">{t('title', { branchName: branch?.name || '' })}</DialogTitle>
            {!isFormOpen && (
              <Button size="sm" onClick={() => { setEditingRoom(null); setIsFormOpen(true); }}>
                <PlusCircle className="me-2 h-4 w-4" />
                {t('addBtn')}
              </Button>
            )}
          </DialogHeader>

          {isFormOpen ? (
            <form className="space-y-4 py-4" onSubmit={form.handleSubmit(handleSave)}>
              <h3 className="font-semibold text-start">{editingRoom ? t('editMode') : t('newMode')}</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('nameLabel')}</Label>
                  <Input {...form.register('name')} placeholder={t('namePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('capacityLabel')}</Label>
                  <Input type="number" min={1} {...form.register('capacity')} />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label>{t('instrumentEquipment')}</Label>
                  {equipmentArray.fields.map((field, index) => {
                    // eslint-disable-next-line react-hooks/incompatible-library
                    const instrumentId = form.watch(`instrumentEquipment.${index}.instrumentId`);
                    return (
                    <div key={field.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-[2fr_90px_2fr_auto]">
                      <Select
                        value={instrumentId}
                        onValueChange={(value) => form.setValue(`instrumentEquipment.${index}.instrumentId`, value, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('instrument')} />
                        </SelectTrigger>
                        <SelectContent>
                          {instrumentsForBranch.map((instrument) => (
                            <SelectItem key={instrument.id} value={instrument.id}>{instrument.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={form.watch(`instrumentEquipment.${index}.quantity`) || 1}
                        onChange={(event) => form.setValue(`instrumentEquipment.${index}.quantity`, Number(event.target.value), { shouldValidate: true })}
                      />

                      <Input
                        value={form.watch(`instrumentEquipment.${index}.notes`) || ''}
                        onChange={(event) => form.setValue(`instrumentEquipment.${index}.notes`, event.target.value)}
                        placeholder={t('equipmentNotes')}
                      />

                      <Button type="button" variant="ghost" size="icon" onClick={() => equipmentArray.remove(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );})}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => equipmentArray.append({ instrumentId: '', quantity: 1, notes: '' })}
                  >
                    {t('addEquipment')}
                  </Button>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>{t('descLabel')}</Label>
                  <Input {...form.register('description')} placeholder={t('descPlaceholder')} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setEditingRoom(null); setIsFormOpen(false); }}>{t('cancelBtn')}</Button>
                <Button type="submit" disabled={!form.watch('name')}>{t('saveBtn')}</Button>
              </div>
            </form>
          ) : (
            <div className="pt-4 max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('colName')}</TableHead>
                    <TableHead className="text-start">{t('colCapacity')}</TableHead>
                    <TableHead className="text-start">{t('colEquipment')}</TableHead>
                    <TableHead className="text-start">{t('colBlocks')}</TableHead>
                    <TableHead className="text-end">{t('colActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell className="max-w-[360px] truncate">{equipmentSummary(room)}</TableCell>
                      <TableCell>
                        {activeBlocks(room).length > 0
                          ? t('activeBlocks', { count: activeBlocks(room).length })
                          : t('noBlocks')}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu dir={isRtl ? 'rtl' : 'ltr'}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingRoom(room); setIsFormOpen(true); }}>
                              <Edit className="me-2 h-4 w-4" /> {t('actionEdit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBlockingRoom(room)}>
                              <PlusCircle className="me-2 h-4 w-4" /> {t('blockRoom')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(room.id)}>
                              <Trash2 className="me-2 h-4 w-4" /> {t('actionDelete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {branchRooms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">{t('emptyState')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!blockingRoom} onOpenChange={(nextOpen) => { if (!nextOpen) setBlockingRoom(null); }}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-start">{t('blockRoomTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('blockFrom')}</Label>
              <Input type="datetime-local" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('blockUntil')}</Label>
              <Input type="datetime-local" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('blockReason')}</Label>
              <Input value={blockReason} onChange={(event) => setBlockReason(event.target.value)} placeholder={t('blockReason')} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBlockingRoom(null)}>{t('cancelBtn')}</Button>
            <Button onClick={saveBlock}>{t('saveBlock')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}