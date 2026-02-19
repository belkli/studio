'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Repeat, Copy, PlusCircle } from "lucide-react";
import React from "react";

const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

export function AvailabilityGrid() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>תבנית זמינות שבועית</CardTitle>
                        <CardDescription>גרור כדי להוסיף בלוקי זמינות. אלו השעות שיוצגו לתלמידים כפנויות להזמנת שיעורים.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><Copy className="ms-2 h-4 w-4" /> העתק משבוע שעבר</Button>
                        <Button><PlusCircle className="ms-2 h-4 w-4" /> הוסף חריגה</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr] text-center text-sm font-semibold">
                        <div className="p-2 border-b border-s"></div>
                        {days.map(day => (
                            <div key={day} className="p-2 border-b border-s">{day}</div>
                        ))}
                        {times.map(time => (
                            <React.Fragment key={time}>
                                <div className="p-2 border-s flex items-center justify-center text-xs text-muted-foreground">{time}</div>
                                {days.map(day => (
                                    <div key={`${day}-${time}`} className="h-12 border-b border-s bg-muted/20 hover:bg-green-100 cursor-pointer transition-colors">
                                        {/* Example booked slot */}
                                        {day === 'שני' && time === '16:00' && (
                                            <div className="h-full bg-blue-100 text-blue-800 text-xs p-1 rounded-sm flex items-center justify-center">שיעור עם נועה</div>
                                        )}
                                        {/* Example available block */}
                                         {day === 'רביעי' && (time === '15:00' || time === '16:00') && (
                                            <div className="h-full bg-green-200/50"></div>
                                        )}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                 <div className="mt-6 flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary mt-1"/>
                    <div>
                        <h4 className="font-semibold">סנכרון יומן חיצוני</h4>
                        <p className="text-sm text-muted-foreground">חבר את יומן Google או Apple שלך כדי לחסום אוטומטית זמנים שאינך פנוי/ה בהם, ולהציג את שיעורי הרמוניה ביומן האישי שלך.</p>
                        <Button variant="secondary" className="mt-2">חבר יומן</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
