'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Library, Maximize2, X, FileMusic, ListMusic } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTranslations, useLocale } from 'next-intl';
import type { Composition } from '@/lib/types';

type RepertoireItem = ReturnType<typeof useAuth>['assignedRepertoire'][number] & {
    compositionDetails?: Composition & { title: string; composer: string; pdfUrl?: string; description?: string };
};

// A placeholder PDF viewer component logic
export function SheetMusicViewer() {
    const { user, assignedRepertoire, compositions } = useAuth();
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const t = useTranslations('SheetMusicViewer');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    // Filter and join repertoire assigned to this student, resolving locale-aware fields
    const myRepertoire = useMemo((): RepertoireItem[] => {
        return assignedRepertoire
            .filter(r => r.studentId === user?.id)
            .map(r => {
                const c = compositions.find(comp => comp.id === r.compositionId);
                if (!c) return { ...r, compositionDetails: undefined };
                const localeKey = locale as 'he' | 'en' | 'ar' | 'ru';
                return {
                    ...r,
                    compositionDetails: {
                        ...c,
                        title: c.titles?.[localeKey] || c.titles?.en || c.title,
                        composer: c.composerNames?.[localeKey] || c.composerNames?.en || c.composer,
                    },
                };
            });
    }, [assignedRepertoire, user?.id, compositions, locale]);

    const activePiece: RepertoireItem | undefined = myRepertoire.find(r => r.id === selectedPieceId);

    const handleViewPiece = (id: string) => {
        setSelectedPieceId(id);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Sidebar / List of pieces */}
            <Card className="lg:col-span-1 shadow-sm flex flex-col h-[calc(100vh-140px)]">
                <CardHeader className="pb-3 shrink-0">
                    <CardTitle className="text-lg flex items-center gap-2"> <Library className="w-5 h-5 text-primary" /> {t('myFolder')}</CardTitle>
                    <CardDescription>{t('myFolderDesc')}</CardDescription>
                </CardHeader>
                <ScrollArea className="flex-1 px-4 pb-4">
                    <div className="space-y-2">
                        {myRepertoire.length === 0 ? (
                            <div className="text-center p-4 text-muted-foreground bg-muted/30 rounded-lg text-sm">{t('noPieces')}</div>
                        ) : (
                            myRepertoire.map(piece => (
                                <button
                                    key={piece.id}
                                    onClick={() => handleViewPiece(piece.id)}
                                    className={`w-full text-start p-3 rounded-lg border transition-all ${selectedPieceId === piece.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card hover:bg-muted/50 border-border'}`}
                                >
                                    <div className="font-medium text-sm">{piece.compositionDetails?.title || t('piece')}</div>
                                    <div className="text-xs text-muted-foreground mt-1 truncate">{piece.compositionDetails?.composer}</div>
                                    <div className="flex gap-1 mt-2">
                                        <Badge variant="outline" className="text-[10px] px-1 font-normal opacity-70">
                                            {t(`statuses.${piece.status}`)}
                                        </Badge>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Main Viewer Area */}
            <Card className="lg:col-span-3 shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden">
                {activePiece ? (
                    <>
                        <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-3 px-6 shrink-0">
                            <div>
                                <CardTitle>{activePiece.compositionDetails?.title || t('untitled')}</CardTitle>
                                <CardDescription>{activePiece.compositionDetails?.composer}</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(true)} title={t('fullscreen')} aria-label={t('fullscreen')}>
                                <Maximize2 className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative bg-gray-100 dark:bg-zinc-900 border-x border-b rounded-b-xl flex items-center justify-center overflow-hidden">
                            {/* Dummy PDF rendering area */}
                            <div className="absolute inset-4 bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-zinc-800 rounded flex flex-col items-center justify-center">
                                {activePiece.compositionDetails?.pdfUrl ? (
                                    <div className="text-muted-foreground flex flex-col items-center gap-3">
                                        <FileMusic className="h-16 w-16 opacity-50" />
                                        <span className="font-semibold">{t('sheetMusic', { title: activePiece.compositionDetails?.title })}</span>
                                        <span className="text-sm opacity-70">{t('pdfSimulator')}</span>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center gap-3 p-8 text-center">
                                        <ListMusic className="h-12 w-12 opacity-30" />
                                        <p>{t('noPdfAttached')}</p>
                                        <p className="text-sm">{t('pieceDescription', { description: activePiece.compositionDetails?.description ?? '' })}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
                        <Library className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-medium text-foreground mb-2">{t('selectPieceTitle')}</h3>
                        <p>{t('selectPieceDesc')}</p>
                    </div>
                )}
            </Card>

            {/* Fullscreen Dialog */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent className="max-w-[100vw] w-screen max-h-[100vh] h-screen p-0 m-0 border-none sm:rounded-none flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="bg-black text-white p-3 flex justify-between items-center shrink-0">
                        <span className="font-medium me-4">{activePiece?.compositionDetails?.title} - {activePiece?.compositionDetails?.composer}</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)} className="text-white hover:bg-white/20" aria-label={t('closeFullscreen')}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden relative p-8">
                        <div className="bg-white w-full max-w-4xl h-full shadow-2xl rounded p-12 flex flex-col items-center justify-center text-black">
                            <FileMusic className="h-32 w-32 opacity-20 mb-6" />
                            <h2 className="text-2xl font-bold bg-muted/30 p-2 rounded">{activePiece?.compositionDetails?.title}</h2>
                            <h3 className="text-xl text-muted-foreground mt-2">{activePiece?.compositionDetails?.composer}</h3>

                            <div className="mt-12 w-full text-center border-t pt-8 text-muted-foreground relative">
                                <Badge variant="outline" className="text-xl absolute -top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 bg-white">{t('fullScreenViewer')}</Badge>
                                <p>{t('fullScreenSupport')}</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
