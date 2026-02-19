'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Music, Tag } from "lucide-react";
import Link from 'next/link';
import { format } from "date-fns";
import { he } from 'date-fns/locale';
import type { EmptySlot } from "./available-slots-marketplace";

interface SlotPromotionCardProps {
    slot: EmptySlot;
}

export function SlotPromotionCard({ slot }: SlotPromotionCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="w-12 h-12">
                    <AvatarImage src={slot.teacher.avatarUrl} alt={slot.teacher.name} />
                    <AvatarFallback>{slot.teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base">{slot.teacher.name}</CardTitle>
                    <CardDescription>{slot.teacher.specialties?.slice(0, 2).join(', ')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{slot.instrument}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(slot.startTime, "EEEE, HH:mm", { locale: he })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                     <Badge variant="destructive">הזדמנות של הרגע האחרון!</Badge>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
                <div className="text-center">
                    <span className="text-2xl font-bold text-accent">₪{slot.promotionalPrice}</span>
                    <span className="text-sm text-muted-foreground line-through ms-2">₪{slot.basePrice}</span>
                    <span className="text-sm font-bold text-green-600 ms-2">({slot.discount}% הנחה)</span>
                </div>
                <Button asChild className="w-full">
                    <Link href="/register">
                        הזמן עכשיו
                        <ArrowLeft className="ms-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
