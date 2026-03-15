'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, School, User as UserIcon, Calendar, ArrowRight, ArrowLeft, CheckCircle2, Clock, Star, Sparkles } from "lucide-react";
import { ExcellenceTrackOfferModal } from "../../harmonia/excellence-track-offer-modal";
import { useState } from "react";
import type { User, PlayingSchoolInfo } from "@/lib/types";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

interface PlayingSchoolChildCardProps {
    child: User;
    psInfo: PlayingSchoolInfo;
    className?: string;
}

export function PlayingSchoolChildCard({ child, psInfo, className }: PlayingSchoolChildCardProps) {
    const t = useTranslations('PlayingSchool.familyHub');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [isOfferOpen, setIsOfferOpen] = useState(false);

    const isNominated = psInfo.excellenceTrackNominated && !psInfo.excellenceTrackAccepted;

    return (
        <Card dir={isRtl ? 'rtl' : 'ltr'} className={cn("overflow-hidden border-indigo-100 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-indigo-50/30", className)}>
            <CardHeader className="pb-3 border-b border-indigo-50">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <School className="h-5 w-5 text-indigo-600" />
                            {t('title')}
                        </CardTitle>
                        <CardDescription className="text-indigo-600/80 font-medium">
                            {psInfo.schoolName}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-white">
                        {t(`programTypes.${psInfo.programType}`)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {t('instrument')}
                        </p>
                        <p className="text-sm font-semibold">{psInfo.instrument}</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {t('teacher')}
                        </p>
                        <p className="text-sm font-semibold">{psInfo.teacherName || '---'}</p>
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-indigo-50 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('nextLesson')}
                        </p>
                        {psInfo.lessonDay && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                                {psInfo.lessonDay}
                            </Badge>
                        )}
                    </div>
                    {psInfo.nextLessonDate ? (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex flex-col items-center justify-center">
                                <span className="text-xs font-bold uppercase leading-none">{psInfo.nextLessonDate.split(' ')[1]}</span>
                                <span className="text-sm font-black leading-none">{psInfo.nextLessonDate.split(' ')[0]}</span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{psInfo.schoolName}</p>
                                <p className="text-sm font-bold">{psInfo.lessonDay}, {psInfo.programType === 'GROUP' ? t('groupLesson') : t('individualLesson')}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-balance text-muted-foreground italic flex items-center gap-2">
                            <Clock className="h-4 w-4 opacity-50" />
                            {t('noUpcoming')}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('instrumentStatus')}</p>
                        <div className="flex items-center gap-1.5">
                            {psInfo.instrumentReceived ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm font-medium">{t('received')}</span>
                                </>
                            ) : (
                                <>
                                    <Clock className="h-4 w-4 text-orange-400" />
                                    <span className="text-sm font-medium">{t('pendingCollection')}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 py-0 h-auto" asChild>
                        <Link href={`/dashboard/family/ps-attendance/${child.id}`}>
                            {t('viewAttendance')}
                        </Link>
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="bg-indigo-50/50 border-t border-indigo-50 pt-3 pb-3 flex flex-col gap-2">
                {isNominated && (
                    <Button
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none shadow-md group h-10 animate-pulse-subtle"
                        onClick={() => setIsOfferOpen(true)}
                    >
                        <Star className="h-4 w-4 me-2 fill-yellow-400 text-yellow-400 group-hover:scale-125 transition-transform" />
                        {t('excellenceNominated')}
                        <Sparkles className="h-3 w-3 ms-2 opacity-70" />
                    </Button>
                )}
                <Button variant="link" className="w-full text-indigo-700 font-semibold gap-2 no-underline hover:no-underline group" size="sm">
                    {t('viewDetails')}
                    {isRtl ? <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                </Button>

                <ExcellenceTrackOfferModal
                    isOpen={isOfferOpen}
                    onClose={() => setIsOfferOpen(false)}
                    studentId={child.id}
                    studentName={child.name}
                />
            </CardFooter>
        </Card>
    );
}
