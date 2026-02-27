
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreVertical, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlumnusForm } from './alumnus-form';
import { Alumnus } from '@/lib/types';
import { saveAlumnus, deleteAlumnus } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export function AlumniPortal() {
    const t = useTranslations('AlumniPage');
    const commonT = useTranslations('Common');
    const { toast } = useToast();
    const { user, mockAlumni: initialAlumni, mockMasterclasses } = useAuth();

    const [alumni, setAlumni] = useState<Alumnus[]>(initialAlumni);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedAlumnus, setSelectedAlumnus] = useState<Alumnus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const role = user?.role;
    const isAdmin = role === 'site_admin' || role === 'conservatorium_admin';

    const handleOpenAddDialog = () => {
        setSelectedAlumnus(null);
        setIsAddDialogOpen(true);
    };

    const handleOpenEditDialog = (alumnus: Alumnus) => {
        setSelectedAlumnus(alumnus);
        setIsEditDialogOpen(true);
    };

    const handleSaveAlumnus = async (data: any) => {
        setIsSubmitting(true);
        try {
            const saved = await saveAlumnus(data);
            if (data.id) {
                setAlumni(prev => prev.map(a => a.id === data.id ? saved : a));
                toast({
                    title: commonT('success'),
                    description: t('alumnusUpdated'),
                });
            } else {
                setAlumni(prev => [saved, ...prev]);
                toast({
                    title: commonT('success'),
                    description: t('alumnusAdded'),
                });
            }
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
        } catch (error) {
            toast({
                title: commonT('error'),
                description: commonT('saveFailed'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAlumnus = async (id: string) => {
        if (!confirm(commonT('confirmDelete'))) return;

        try {
            await deleteAlumnus(id);
            setAlumni(prev => prev.filter(a => a.id !== id));
            toast({
                title: commonT('success'),
                description: t('alumnusDeleted'),
            });
        } catch (error) {
            toast({
                title: commonT('error'),
                description: commonT('deleteFailed'),
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>{t('directoryTitle')}</CardTitle>
                        <CardDescription>{t('directorySubtitle')}</CardDescription>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={handleOpenAddDialog}>
                                        {t('addAlumnus')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>{t('addAlumnus')}</DialogTitle>
                                        <DialogDescription>
                                            Add a new distinguished graduate to the directory.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <AlumnusForm
                                        onSubmit={handleSaveAlumnus}
                                        onCancel={() => setIsAddDialogOpen(false)}
                                        isSubmitting={isSubmitting}
                                    />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>{t('editAlumnus')}</DialogTitle>
                                        <DialogDescription>
                                            Update the details for this graduate.
                                        </DialogDescription>
                                    </DialogHeader>
                                    {selectedAlumnus && (
                                        <AlumnusForm
                                            initialData={selectedAlumnus}
                                            onSubmit={handleSaveAlumnus}
                                            onCancel={() => setIsEditDialogOpen(false)}
                                            isSubmitting={isSubmitting}
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {alumni.map(alumnus => (
                        <Card key={alumnus.id} className="text-center relative">
                            {isAdmin && (
                                <div className="absolute top-2 right-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(alumnus)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>{commonT('edit')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteAlumnus(alumnus.id)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>{commonT('delete')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            <CardContent className="pt-6 flex flex-col items-center">
                                <Avatar className="w-24 h-24 mb-4">
                                    <AvatarImage src={alumnus.avatarUrl} />
                                    <AvatarFallback>{alumnus.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-lg">{alumnus.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('graduated', { year: alumnus.graduationYear, instrument: alumnus.instrument })}
                                </p>
                                <Badge variant="secondary" className="mt-2">{alumnus.currentRole}</Badge>
                                {alumnus.achievements && (
                                    <p className="mt-4 text-xs italic text-muted-foreground border-t pt-2">
                                        {alumnus.achievements}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('masterclassesTitle')}</CardTitle>
                    <CardDescription>{t('masterclassesSubtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mockMasterclasses.map(mc => (
                        <div key={mc.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <h3 className="font-semibold">{mc.title}</h3>
                                <p className="text-sm text-muted-foreground">{t('instructor', { name: mc.instructor })}</p>
                                <p className="text-sm text-muted-foreground">{t('date', { date: new Date(mc.date) })}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">₪{mc.price}</span>
                                <Button>{t('registerButton')}</Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

