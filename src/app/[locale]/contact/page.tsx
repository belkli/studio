'use client';
import { useTranslations } from 'next-intl';
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Icons } from "@/components/icons";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { conservatoriums } from "@/lib/data";
import type { Conservatorium } from "@/lib/types";
import { useState, useMemo } from "react";
import {
    CheckCircle2, Search, Phone, Mail, Globe, MapPin, Clock,
    Music2, Building2, ChevronDown, X, ExternalLink, Star, MessageCircle
} from "lucide-react";

function ConservatoriumInfo({ cons }: { cons: Conservatorium }) {
    return (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
            {/* Mini hero */}
            <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary/20 via-violet-500/10 to-indigo-600/10">
                {cons.photoUrls?.[0] ? (
                    <img src={cons.photoUrls[0]} alt={cons.name} className="w-full h-full object-cover opacity-50" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Music2 className="h-16 w-16 text-primary opacity-10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            </div>
            <div className="p-4 space-y-3 -mt-4 relative">
                <div>
                    <h3 className="font-bold text-base leading-tight">{cons.name}</h3>
                    {cons.nameEn && <p className="text-xs text-muted-foreground">{cons.nameEn}</p>}
                </div>

                {cons.about && <p className="text-xs text-muted-foreground leading-relaxed">{cons.about}</p>}

                <div className="grid grid-cols-1 gap-2 pt-1">
                    {cons.location?.address && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground text-xs">{cons.location.address}</span>
                        </div>
                    )}
                    {!cons.location?.address && cons.location?.city && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground text-xs">{cons.location.city}</span>
                        </div>
                    )}
                    {cons.tel && (
                        <a href={`tel:${cons.tel}`} className="flex items-center gap-2 hover:text-primary transition-colors group">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                            <span className="text-xs font-mono">{cons.tel}</span>
                        </a>
                    )}
                    {(cons.socialMedia?.whatsapp || cons.tel) && (
                        <a href={`https://wa.me/${(cons.socialMedia?.whatsapp || cons.tel)?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-500 transition-colors group">
                            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
                            <span className="text-xs font-mono">WhatsApp</span>
                        </a>
                    )}
                    {cons.email && (
                        <a href={`mailto:${cons.email}`} className="flex items-center gap-2 hover:text-primary transition-colors group">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                            <span className="text-xs break-all">{cons.email}</span>
                        </a>
                    )}
                    {cons.secondaryEmail && (
                        <a href={`mailto:${cons.secondaryEmail}`} className="flex items-center gap-2 hover:text-primary transition-colors group opacity-80">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                            <span className="text-xs break-all">{cons.secondaryEmail}</span>
                        </a>
                    )}
                    {cons.openingHours && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">{cons.openingHours}</span>
                        </div>
                    )}
                    {cons.officialSite && (
                        <a href={cons.officialSite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs">אתר רשמי</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                    )}
                </div>

                {cons.manager && (
                    <div className="flex items-center gap-2.5 pt-2 border-t border-border/50">
                        <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={cons.manager.photoUrl} />
                            <AvatarFallback className="text-xs font-bold">
                                {cons.manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs font-medium">{cons.manager.name}</p>
                            {cons.manager.role && <p className="text-xs text-muted-foreground">{cons.manager.role}</p>}
                        </div>
                    </div>
                )}

                {cons.departments && cons.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                        {cons.departments.slice(0, 5).map((d, i) => (
                            <Badge key={i} variant="secondary" className="text-xs rounded-full px-2 py-0.5">{d.name}</Badge>
                        ))}
                        {cons.departments.length > 5 && (
                            <Badge variant="outline" className="text-xs rounded-full px-2 py-0.5">+{cons.departments.length - 5}</Badge>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ConservatoriumSearchPicker({
    selected,
    onSelect
}: {
    selected: Conservatorium | null;
    onSelect: (c: Conservatorium) => void;
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() =>
        conservatoriums
            .filter(c => {
                const q = query.toLowerCase();
                return c.name.toLowerCase().includes(q) ||
                    (c.nameEn?.toLowerCase().includes(q)) ||
                    (c.location?.city?.toLowerCase().includes(q));
            })
            .slice(0, 20),
        [query]
    );

    return (
        <div className="relative">
            <div
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 h-11 w-full rounded-xl border border-border bg-background px-3 cursor-pointer hover:border-primary transition-colors"
            >
                {selected ? (
                    <>
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm flex-1 truncate">{selected.name}</span>
                        <button onClick={e => { e.stopPropagation(); onSelect(null as any); setQuery(''); }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    <>
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground flex-1">חיפוש קונסרבטוריון...</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </>
                )}
            </div>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-border">
                            <div className="relative">
                                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="חיפוש עיר או שם קונסרבטוריון..."
                                    dir="rtl"
                                    className="w-full h-9 bg-muted/50 rounded-lg ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                        <ul className="max-h-56 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <li className="px-4 py-3 text-sm text-muted-foreground text-center">לא נמצאו תוצאות</li>
                            ) : filtered.map(c => (
                                <li key={c.id}>
                                    <button
                                        onClick={() => { onSelect(c); setQuery(''); setOpen(false); }}
                                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-start ${selected?.id === c.id ? 'bg-primary/5' : ''}`}
                                    >
                                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium leading-tight">{c.name}</p>
                                            {c.location?.city && <p className="text-xs text-muted-foreground">{c.location.city}</p>}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}

export default function ContactPage() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [selectedCons, setSelectedCons] = useState<Conservatorium | null>(null);
    const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', message: '' });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitted(true);
        toast({ title: "הפנייה נשלחה בהצלחה", description: "ניצור איתך קשר בהקדם האפשרי." });
    };

    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <PublicNavbar />

            <main className="flex-1 pt-14">
                {/* Hero */}
                <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
                    <div className="max-w-2xl mx-auto space-y-3">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">צור קשר</h1>
                        <p className="text-muted-foreground text-lg">
                            בחרו את הקונסרבטוריון הקרוב אליכם ונחזור אליכם בהקדם
                        </p>
                    </div>
                </section>

                <section className="px-4 pb-16">
                    <div className="max-w-5xl mx-auto">
                        {isSubmitted ? (
                            <div className="max-w-md mx-auto text-center space-y-5 py-16">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold">תודה על פנייתך!</h2>
                                <p className="text-muted-foreground">הפרטים התקבלו במערכת, צוות הקונסרבטוריון ייצור עמך קשר בשעות הקרובות.</p>
                                {selectedCons && (
                                    <div className="bg-muted/30 rounded-xl p-4 text-sm text-start space-y-1 border border-border">
                                        <p className="font-semibold">{selectedCons.name}</p>
                                        {selectedCons.tel && <p className="text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{selectedCons.tel}</p>}
                                        {selectedCons.email && <p className="text-muted-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{selectedCons.email}</p>}
                                    </div>
                                )}
                                <Button onClick={() => { setIsSubmitted(false); setSelectedCons(null); }}>שליחת הודעה נוספת</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                {/* Form */}
                                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm order-2 lg:order-1">
                                    <div className="bg-gradient-to-r from-primary/10 to-violet-500/10 px-6 py-5 border-b border-border">
                                        <h2 className="font-bold text-lg">שלחו לנו הודעה</h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">אנא מלאו את הפרטים ונחזור אליכם</p>
                                    </div>
                                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                        {/* Conservatorium picker */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">קונסרבטוריון מבוקש <span className="text-destructive">*</span></Label>
                                            <ConservatoriumSearchPicker
                                                selected={selectedCons}
                                                onSelect={c => setSelectedCons(c)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">שם פרטי <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="firstName"
                                                    required
                                                    dir="rtl"
                                                    value={form.firstName}
                                                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                                                    className="rounded-xl"
                                                    placeholder="ישראל"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">שם משפחה <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="lastName"
                                                    required
                                                    dir="rtl"
                                                    value={form.lastName}
                                                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                                                    className="rounded-xl"
                                                    placeholder="ישראלי"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">טלפון <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    required
                                                    dir="rtl"
                                                    value={form.phone}
                                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                    className="rounded-xl font-mono"
                                                    placeholder="05x-xxxxxxx"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">דוא"ל</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    dir="ltr"
                                                    value={form.email}
                                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                    className="rounded-xl"
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">תוכן הפנייה</Label>
                                            <Textarea
                                                id="message"
                                                rows={4}
                                                dir="rtl"
                                                value={form.message}
                                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                                placeholder="איך נוכל לעזור לכם? כלי נגינה, גיל, ניסיון..."
                                                className="rounded-xl resize-none"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-11 text-base font-semibold rounded-xl"
                                            disabled={!selectedCons}
                                        >
                                            {!selectedCons ? 'בחרו קונסרבטוריון בתחילה' : 'שלחו הודעה'}
                                        </Button>
                                    </form>
                                </div>

                                {/* Right panel */}
                                <div className="space-y-4 order-1 lg:order-2">
                                    {selectedCons ? (
                                        <>
                                            <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                                <Building2 className="h-4 w-4" />
                                                פרטי הקונסרבטוריון שבחרתם
                                            </div>
                                            <ConservatoriumInfo cons={selectedCons} />
                                        </>
                                    ) : (
                                        <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-8 text-center space-y-4">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                                <Music2 className="h-8 w-8 text-primary/50" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-base">בחרו קונסרבטוריון</p>
                                                <p className="text-sm text-muted-foreground mt-1">לאחר הבחירה יוצגו כאן פרטי יצירת הקשר והמידע על הקונסרבטוריון</p>
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href="/about">לרשימת כל הקונסרבטוריונים</Link>
                                            </Button>
                                        </div>
                                    )}

                                    {/* Quick tips */}
                                    <div className="bg-muted/20 rounded-xl p-4 space-y-3 border border-border/50">
                                        <h3 className="font-semibold text-sm">טיפים לפנייה</h3>
                                        <ul className="space-y-2 text-xs text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                ציינו את הכלי שמעניין אתכם ורמת הניסיון הקיימת
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                שתפו את הגיל ו/או הגיל של הילד הנרשם
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                ציינו ימים ושעות שנוחים לכם לשיעורים
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
}
