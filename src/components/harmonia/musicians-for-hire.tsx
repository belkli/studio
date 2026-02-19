'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export function MusiciansForHire() {
    return (
        <>
            <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">מוזיקאים לאירועים</h1>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           הזמינו מוזיקאים מקצועיים מהקונסרבטוריון שלנו לאירוע הבא שלכם.
                        </p>
                    </div>
                </div>
            </section>
            <section className="w-full py-12">
                <div className="container px-4 md:px-6">
                    <Card className="w-full max-w-4xl mx-auto text-center">
                        <CardHeader>
                            <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                                <Music className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <CardTitle className="mt-4">בקרוב: שוק המוזיקאים של הרמוניה</CardTitle>
                            <CardDescription>
                                אנו עובדים על פיתוח פלטפורמה להזמנת מוזיקאים מוכשרים לאירועים.
                                <br />
                                המערכת תאפשר לכם לקבל הצעות מחיר מיידיות, לבחור הרכבים וז'אנרים, ולהבטיח שהאירוע שלכם יקבל את הפסקול המושלם.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button disabled>קבל הצעת מחיר (בקרוב)</Button>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </>
    )
}
