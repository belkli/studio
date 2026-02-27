import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Room, Branch } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export function RoomManagementDialog({
  branch,
  open,
  onOpenChange
}: {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mockRooms, addRoom, updateRoom, deleteRoom } = useAuth();

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number>(0);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const branchRooms = useMemo(() => {
    if (!branch) return [];
    return mockRooms.filter(r => r.branchId === branch.id);
  }, [mockRooms, branch]);

  useEffect(() => {
    if (editingRoom) {
      setName(editingRoom.name);
      setCapacity(editingRoom.capacity || 0);
      setEquipmentList(editingRoom.equipment || []);
      setEquipmentInput('');
      setDescription(editingRoom.description || '');
      setIsFormOpen(true);
    } else {
      setName('');
      setCapacity(0);
      setEquipmentList([]);
      setEquipmentInput('');
      setDescription('');
    }
  }, [editingRoom, isFormOpen]);

  const handleSave = () => {
    const roomData = {
      name,
      capacity,
      equipment: equipmentList,
      description,
      branchId: branch?.id
    };

    if (editingRoom) {
      updateRoom(editingRoom.id, roomData);
    } else {
      addRoom(roomData);
    }

    setIsFormOpen(false);
    setEditingRoom(null);
  };

  const handleDelete = (roomId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק חדר זה?')) {
      deleteRoom(roomId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setIsFormOpen(false); }}>
      <DialogContent className="max-w-4xl" dir="rtl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>ניהול חדרים - {branch?.name}</DialogTitle>
          {!isFormOpen && (
            <Button size="sm" onClick={() => { setEditingRoom(null); setIsFormOpen(true); }}>
              <PlusCircle className="me-2 h-4 w-4" />
              הוספת חדר
            </Button>
          )}
        </DialogHeader>

        {isFormOpen ? (
          <div className="space-y-4 py-4">
            <h3 className="font-semibold">{editingRoom ? 'עריכת חדר' : 'חדר חדש'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם החדר</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: חדר מס' 1" />
              </div>
              <div className="space-y-2">
                <Label>קיבולת (מספר אנשים)</Label>
                <Input type="number" min="0" value={capacity} onChange={e => setCapacity(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>ציוד</Label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border rounded-md border-input bg-background/50">
                  {equipmentList.length === 0 && <span className="text-muted-foreground text-sm py-1">לחץ Enter לאחר הקלדת שם הציוד...</span>}
                  {equipmentList.map((item, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1 py-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => setEquipmentList(prev => prev.filter((_, i) => i !== index))}
                        className="hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={equipmentInput}
                  onChange={e => setEquipmentInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && equipmentInput.trim()) {
                      e.preventDefault();
                      if (!equipmentList.includes(equipmentInput.trim())) {
                        setEquipmentList(prev => [...prev, equipmentInput.trim()]);
                      }
                      setEquipmentInput('');
                    }
                  }}
                  placeholder="הקלד שם ציוד ולחץ Enter..."
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>תיאור</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור כללי של החדר וייעודו..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => { setIsFormOpen(false); setEditingRoom(null); }}>ביטול</Button>
              <Button onClick={handleSave} disabled={!name}>שמירה</Button>
            </div>
          </div>
        ) : (
          <div className="pt-4 max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם החדר</TableHead>
                  <TableHead>קיבולת</TableHead>
                  <TableHead>ציוד</TableHead>
                  <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchRooms.map(room => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.capacity || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{room.equipment?.join(', ') || '-'}</TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingRoom(room)}>
                            <Edit className="me-2 h-4 w-4" /> עריכה
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(room.id)}>
                            <Trash2 className="me-2 h-4 w-4" /> מחיקה
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {branchRooms.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">אין חדרים מוגדרים לסניף זה.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
