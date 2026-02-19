'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function MakeupsPage() {
    const { user, getMakeupCreditBalance } = useAuth();
    
    const userAndChildrenIds = useMemo(() => {
        if (!user) return [];
        return [user.id, ...(user.childIds || [])];
    }, [user]);

    const makeupCreditBalance = getMakeupCreditBalance(userAndChildrenIds);

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">שיעורי השלמה</h1>
                <p className="text-muted-foreground">כאן תוכל לראות את יתרת שיעורי ההשלמה שלך ולהזמין שיעור חדש.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-accent"/>
                            יתרת שיעורי השלמה
                        </CardTitle>
                        <CardDescription>
                            זיכויים זמינים לשיעורי השלמה עקב ביטולי מורה/מערכת או ביטול מצידך בהתאם למדיניות.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="text-6xl font-bold">{makeupCreditBalance}</div>
                        <p className="text-muted-foreground">זיכויים</p>
                    </CardContent>
                </Card>

                <Card className="flex flex-col items-center justify-center border-dashed">
                    <CardHeader className="text-center">
                        <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                        <CardTitle className="mt-4">הזמן שיעור השלמה</CardTitle>
                        <CardDescription>
                            השתמש בזיכויים שלך כדי לקבוע שיעור חדש בזמן שנוח לך.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild disabled={makeupCreditBalance <= 0}>
                            <Link href="/dashboard/schedule/book?type=makeup">
                                עבור להזמנת שיעור
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>פירוט זיכויים</CardTitle>
                    <CardDescription>תכונה זו תהיה זמינה בקרוב ותציג כל זיכוי ותאריך התפוגה שלו.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                    בקרוב...
                </CardContent>
            </Card>

        </div>
    );
}
