'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';
import { Check } from "lucide-react";
import type { User } from "@/lib/types";

interface TeacherMatchCardProps {
    teacher: Partial<User>;
    match: {
        teacherId: string;
        score: number;
        matchReasons: string[];
    };
    isSelected: boolean;
}

export function TeacherMatchCard({ teacher, match, isSelected }: TeacherMatchCardProps) {
    const t = useTranslations('EnrollmentWizard.matching');

    return (
        <Card className="cursor-pointer hover:bg-muted/50 h-full">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={teacher.avatarUrl} />
                        <AvatarFallback>{teacher.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle>{teacher.name}</CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                {t('matchPercentage', { percent: Math.round(match.score) })}
                            </Badge>
                        </div>
                    </div>
                    <RadioGroupItem value={teacher.id!} checked={isSelected} className="ms-4 mt-1" />
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
                <p className="text-muted-foreground line-clamp-3">
                    {teacher.bio}
                </p>
                <div>
                    <h4 className="font-semibold mb-2">{t('whyLearnWith', { name: teacher.name?.split(' ')[0] || '' })}</h4>
                    <ul className="space-y-1">
                        {match.matchReasons.map((reason, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span className="text-muted-foreground">{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}

