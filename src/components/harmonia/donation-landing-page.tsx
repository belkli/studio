'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { HeartHandshake, School, Users, BarChart2, Briefcase, HandCoins } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { isValidIsraeliID } from "@/lib/utils";

const StudentStoryCard = ({ imageId, name, age, instrument, story }: { imageId: string, name: string, age: number, instrument: string, story: string }) => {
    const image = PlaceHolderImages.find(img => img.id === imageId);
    return (
        <Card className="overflow-hidden">
            <div className="relative h-48 w-full">
                {image && <Image src={image.imageUrl} alt={image.description} layout="fill" objectFit="cover" data-ai-hint={image.imageHint} />}
            </div>
            <CardHeader>
                <CardTitle>{name}, {age}, {instrument}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{story}</p>
                <Button variant="link" className="p-0 mt-2">תרמו למיה</Button>
            </CardContent>
        </Card>
    )
}

export function DonationLandingPage() {
    const heroImage = PlaceHolderImages.find(img => img.id === 'donate-hero');
    return (
        <>
            <section className="relative w-full h-[60vh] flex items-center justify-center text-center text-white">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        layout="fill"
                        objectFit="cover"
                        className="z-0 brightness-50"
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
                <div className="relative z-10 p-4 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">כי מוזיקה היא לא רק לאלה שיכולים להרשות לעצמם</h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
                        כל תרומה, קטנה כגדולה, מאפשרת לילד מוכשר עם קשיים כלכליים להמשיך את דרכו המוזיקלית. יחד, נעניק להם עתיד.
                    </p>
                    <Button size="lg" asChild>
                        <a href="#donate-form">תרומה עכשיו</a>
                    </Button>
                </div>
            </section>

            <section className="py-12 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <HeartHandshake className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">1,200+</p>
                            <p className="text-muted-foreground">תרומות שהתקבלו</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Users className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">85</p>
                            <p className="text-muted-foreground">תלמידים נתמכים השנה</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <School className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">₪450,000</p>
                            <p className="text-muted-foreground">שווי מלגות שחולקו</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <HandCoins className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">75%</p>
                            <p className="text-muted-foreground">כיסוי ממוצע לשכר לימוד</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">הסיפורים שלהם, ההזדמנות שלנו</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">מאחורי כל מספר עומד סיפור. הכירו כמה מהתלמידים שהתרומה שלכם יכולה לשנות את חייהם.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <StudentStoryCard imageId="student-story-1" name="מיה" age={14} instrument="כינור" story="מיה מגיעה ממשפחה חד-הורית. המלגה מאפשרת לה להמשיך ולהתכונן לבחינות משרד החינוך. המורה שלה אומרת שיש לה פוטנציאל אמיתי לקריירה מוזיקלית." />
                        <StudentStoryCard imageId="student-story-2" name="יוסף" age={16} instrument="פסנתר" story="יוסף עלה לארץ לפני שנתיים ומתמודד עם קשיי קליטה. המוזיקה היא המפלט שלו. בזכות המלגה, הוא יכול להמשיך לנגן ולפתח את הכישרון הייחודי שלו." />
                        <StudentStoryCard imageId="student-story-3" name="ליאן" age={11} instrument="חליל צד" story="ליאן מתגוררת בפריפריה והנגישות לשיעורים איכותיים מוגבלת. התרומה שלך תאפשר לה להמשיך להגיע לשיעורים בקונסרבטוריון ולהגשים חלום." />
                    </div>
                </div>
            </section>

            <section id="donate-form" className="py-12 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">בצעו תרומה עוד היום</h2>
                            <p className="text-muted-foreground">כל תרומה מוכרת לצורכי מס לפי סעיף 46. 100% מהתרומה מועברת ישירות לטובת המלגות לתלמידים.</p>
                            <Card>
                                <CardHeader>
                                    <CardTitle>איך התרומה שלך עוזרת?</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4"><div className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-24 text-center">₪100</div><p>מממן שני שיעורים פרטיים לתלמיד/ה.</p></div>
                                    <div className="flex items-center gap-4"><div className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-24 text-center">₪500</div><p>מכסה כמעט חודש מלא של לימודים.</p></div>
                                    <div className="flex items-center gap-4"><div className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-24 text-center">₪2,500</div><p>מממן סמסטר שלם של לימודי נגינה.</p></div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="p-6">
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <Label>בחר/י סכום תרומה</Label>
                                    <RadioGroup dir="rtl" defaultValue="250" className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['100', '250', '500'].map(val => (
                                            <Label key={val} htmlFor={`amount-${val}`} className="border cursor-pointer rounded-md p-3 text-center has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                                <RadioGroupItem value={val} id={`amount-${val}`} className="sr-only" />
                                                ₪{val}
                                            </Label>
                                        ))}
                                        <Label htmlFor="amount-other" className="border cursor-pointer rounded-md p-3 text-center has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                            <RadioGroupItem value="other" id="amount-other" className="sr-only" />
                                            אחר
                                        </Label>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label>תדירות</Label>
                                    <Select dir="rtl" defaultValue="once">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="once">תרומה חד פעמית</SelectItem>
                                            <SelectItem value="monthly">תרומה חודשית</SelectItem>
                                            <SelectItem value="yearly">תרומה שנתית</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>הקדשה (אופציונלי)</Label>
                                    <Textarea placeholder="לכבוד / לזכר..." />
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="font-semibold">פרטים להנפקת קבלה (סעיף 46)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="donorName">שם מלא</Label><Input id="donorName" placeholder="ישראל ישראלי" /></div>
                                        <div className="space-y-2"><Label htmlFor="donorId">מספר ת.ז.</Label><Input id="donorId" placeholder="נדרש לקבלת החזר מס" /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="donorEmail">דוא"ל</Label><Input id="donorEmail" type="email" placeholder="לקבלת הקבלה במייל" /></div>
                                    <div className="flex items-center space-x-2 space-x-reverse"><Checkbox id="anonymous" /><Label htmlFor="anonymous">אני מעדיף/ה להישאר בעילום שם (ללא קבלה)</Label></div>
                                </div>

                                <Button type="submit" className="w-full" size="lg">תרומה של ₪250</Button>
                            </form>
                        </Card>

                    </div>
                </div>
            </section>
        </>
    )
}
