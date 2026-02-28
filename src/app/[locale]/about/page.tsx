'use client';
import { useTranslations, useLocale } from 'next-intl';
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Icons } from "@/components/icons";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { conservatoriums } from "@/lib/data";
import type { Conservatorium } from "@/lib/types";
import {
    MapPin, Phone, Mail, Globe, Search, LocateFixed, Music2,
    Clock, ChevronRight, Facebook, Instagram, Youtube, ExternalLink,
    Building2, Star, Users, BookOpen, X, Navigation2, MessageCircle
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// City coordinates for Israel cities (for text-based city search fallback)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    'תל אביב': { lat: 32.0853, lng: 34.7818 }, 'tel aviv': { lat: 32.0853, lng: 34.7818 },
    'ירושלים': { lat: 31.7683, lng: 35.2137 }, 'jerusalem': { lat: 31.7683, lng: 35.2137 },
    'חיפה': { lat: 32.7940, lng: 34.9896 }, 'haifa': { lat: 32.7940, lng: 34.9896 },
    'באר שבע': { lat: 31.2520, lng: 34.7915 }, 'beer sheva': { lat: 31.2520, lng: 34.7915 },
    'הרצליה': { lat: 32.1663, lng: 34.8435 }, 'herzliya': { lat: 32.1663, lng: 34.8435 },
    'נתניה': { lat: 32.3226, lng: 34.8530 }, 'netanya': { lat: 32.3226, lng: 34.8530 },
    'פתח תקווה': { lat: 32.0840, lng: 34.8879 }, 'petah tikva': { lat: 32.0840, lng: 34.8879 },
    'רמת גן': { lat: 32.0691, lng: 34.8238 }, 'ramat gan': { lat: 32.0691, lng: 34.8238 },
    'ראשון לציון': { lat: 31.9730, lng: 34.7895 }, 'rishon lezion': { lat: 31.9730, lng: 34.7895 },
    'אשדוד': { lat: 31.8014, lng: 34.6461 }, 'ashdod': { lat: 31.8014, lng: 34.6461 },
    'הוד השרון': { lat: 32.1528, lng: 34.8927 }, 'hod hasharon': { lat: 32.1528, lng: 34.8927 },
    'כפר סבא': { lat: 32.1759, lng: 34.9088 }, 'kfar saba': { lat: 32.1759, lng: 34.9088 },
    'רעננה': { lat: 32.1851, lng: 34.8702 }, 'raanana': { lat: 32.1851, lng: 34.8702 },
    'מודיעין': { lat: 31.8939, lng: 35.0102 }, "modi'in": { lat: 31.8939, lng: 35.0102 },
    'אשקלון': { lat: 31.6688, lng: 34.5742 }, 'ashkelon': { lat: 31.6688, lng: 34.5742 },
    'גבעתיים': { lat: 32.0714, lng: 34.8124 }, 'givatayim': { lat: 32.0714, lng: 34.8124 },
    'בת ים': { lat: 32.0239, lng: 34.7497 }, 'bat yam': { lat: 32.0239, lng: 34.7497 },
    'חולון': { lat: 32.0107, lng: 34.7782 }, 'holon': { lat: 32.0107, lng: 34.7782 },
};

function getCardGradient(id: string): string {
    const gradients = [
        'from-violet-600/20 via-purple-500/10 to-indigo-600/20',
        'from-emerald-600/20 via-teal-500/10 to-cyan-600/20',
        'from-rose-600/20 via-pink-500/10 to-orange-500/20',
        'from-amber-600/20 via-yellow-500/10 to-orange-600/20',
        'from-blue-600/20 via-indigo-500/10 to-violet-600/20',
        'from-teal-600/20 via-emerald-500/10 to-green-600/20',
    ];
    const idx = parseInt(id.replace('cons-', '')) % gradients.length;
    return gradients[idx];
}

function getAccentColor(id: string): string {
    const colors = ['text-violet-500', 'text-emerald-500', 'text-rose-500', 'text-amber-500', 'text-blue-500', 'text-teal-500'];
    const idx = parseInt(id.replace('cons-', '')) % colors.length;
    return colors[idx];
}

function ConservatoriumCard({ cons, distance, onClick }: { cons: Conservatorium; distance?: number; onClick: () => void }) {
    const isRTL = true;
    const gradient = getCardGradient(cons.id);
    const accent = getAccentColor(cons.id);
    const heroPhoto = cons.photoUrls?.[0];

    return (
        <button
            onClick={onClick}
            className="group relative bg-card border border-border rounded-2xl overflow-hidden text-start transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 w-full"
        >
            {/* Hero strip */}
            <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
                {heroPhoto ? (
                    <img src={heroPhoto} alt={cons.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Music2 className={`h-16 w-16 ${accent} opacity-20 group-hover:opacity-30 transition-opacity`} />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                {distance !== undefined && (
                    <div className="absolute top-3 start-3 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-semibold">
                        <Navigation2 className="h-3 w-3 text-primary" />
                        <span>{distance < 1 ? `${Math.round(distance * 1000)}מ'` : `${Math.round(distance)}ק"מ`}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                <div>
                    <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">{cons.name}</h3>
                    {cons.nameEn && <p className="text-xs text-muted-foreground mt-0.5">{cons.nameEn}</p>}
                </div>

                {cons.location?.city && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{cons.location.city}</span>
                    </div>
                )}

                {cons.about && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{cons.about}</p>
                )}

                {/* Departments */}
                {cons.departments && cons.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {cons.departments.slice(0, 3).map((d, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                                {d.name}
                            </Badge>
                        ))}
                        {cons.departments.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                                +{cons.departments.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        {cons.tel && <span className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{cons.tel}</span>}
                        {cons.teachers && cons.teachers.length > 0 && (
                            <span className="flex items-center gap-1 text-xs"><Users className="h-3 w-3" />{cons.teachers.length}</span>
                        )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            </div>
        </button>
    );
}

function ConservatoriumDialog({ cons, open, onClose }: { cons: Conservatorium | null; open: boolean; onClose: () => void }) {
    if (!cons) return null;
    const accent = getAccentColor(cons.id);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                {/* Hero */}
                <div className={`relative h-48 bg-gradient-to-br ${getCardGradient(cons.id)} overflow-hidden`}>
                    {cons.photoUrls && cons.photoUrls.length > 0 ? (
                        <img src={cons.photoUrls[0]} alt={cons.name} className="w-full h-full object-cover opacity-70" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Music2 className={`h-24 w-24 ${accent} opacity-20`} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    <button onClick={onClose} className="absolute top-4 end-4 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                    {/* Photo strip */}
                    {cons.photoUrls && cons.photoUrls.length > 1 && (
                        <div className="absolute bottom-4 start-4 flex gap-2">
                            {cons.photoUrls.slice(1, 4).map((url, i) => (
                                <img key={i} src={url} alt="" className="h-12 w-16 object-cover rounded-lg border-2 border-white/20 opacity-80" />
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div>
                        <DialogHeader className="text-start space-y-1">
                            <DialogTitle className="text-2xl font-bold leading-tight">{cons.name}</DialogTitle>
                            {cons.nameEn && <p className="text-muted-foreground">{cons.nameEn}</p>}
                        </DialogHeader>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Contact & Info */}
                        <div className="space-y-4">
                            {/* Contact */}
                            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Phone className={`h-4 w-4 ${accent}`} />
                                    פרטי יצירת קשר
                                </h4>
                                {cons.location?.city && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span>{cons.location.address || cons.location.city}</span>
                                    </div>
                                )}
                                {cons.tel && (
                                    <a href={`tel:${cons.tel}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="font-mono">{cons.tel}</span>
                                    </a>
                                )}
                                {(cons.socialMedia?.whatsapp || cons.tel) && (
                                    <a href={`https://wa.me/${(cons.socialMedia?.whatsapp || cons.tel)?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-emerald-500 transition-colors">
                                        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="font-mono">WhatsApp</span>
                                    </a>
                                )}
                                {cons.email && (
                                    <a href={`mailto:${cons.email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="break-all">{cons.email}</span>
                                    </a>
                                )}
                                {cons.secondaryEmail && (
                                    <a href={`mailto:${cons.secondaryEmail}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors opacity-80">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="break-all">{cons.secondaryEmail}</span>
                                    </a>
                                )}
                                {cons.officialSite && (
                                    <a href={cons.officialSite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                        <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>אתר רשמי</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                                {cons.openingHours && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{cons.openingHours}</span>
                                    </div>
                                )}
                            </div>

                            {/* Manager */}
                            {cons.manager && (
                                <div className="bg-muted/30 rounded-xl p-4">
                                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                        <Star className={`h-4 w-4 ${accent}`} />
                                        הנהלה
                                    </h4>
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-border">
                                            <AvatarImage src={cons.manager.photoUrl} />
                                            <AvatarFallback className="text-sm font-bold">
                                                {cons.manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{cons.manager.name}</p>
                                            {cons.manager.role && <p className="text-xs text-muted-foreground">{cons.manager.role}</p>}
                                            {cons.manager.bio && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cons.manager.bio}</p>}
                                        </div>
                                    </div>
                                    {cons.pedagogicalCoordinator && (
                                        <div className="flex items-start gap-3 mt-3 pt-3 border-t border-border/50">
                                            <Avatar className="h-10 w-10 border-2 border-border">
                                                <AvatarImage src={cons.pedagogicalCoordinator.photoUrl} />
                                                <AvatarFallback className="text-sm font-bold">
                                                    {cons.pedagogicalCoordinator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{cons.pedagogicalCoordinator.name}</p>
                                                {cons.pedagogicalCoordinator.role && <p className="text-xs text-muted-foreground">{cons.pedagogicalCoordinator.role}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Social */}
                            {cons.socialMedia && (
                                <div className="flex items-center gap-3">
                                    {cons.socialMedia.facebook && (
                                        <a href={cons.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors">
                                            <Facebook className="h-5 w-5" />
                                        </a>
                                    )}
                                    {cons.socialMedia.instagram && (
                                        <a href={cons.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-pink-500 transition-colors">
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    )}
                                    {cons.socialMedia.youtube && (
                                        <a href={cons.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-red-500 transition-colors">
                                            <Youtube className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: About & Departments */}
                        <div className="space-y-4">
                            {cons.about && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Building2 className={`h-4 w-4 ${accent}`} />
                                        אודות
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{cons.about}</p>
                                </div>
                            )}

                            {cons.departments && cons.departments.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Music2 className={`h-4 w-4 ${accent}`} />
                                        מחלקות ותחומי לימוד
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {cons.departments.map((d, i) => (
                                            <Badge key={i} variant="secondary" className="rounded-full px-3 py-1">
                                                {d.name}
                                                {d.headTeacher && <span className="text-muted-foreground ml-1 text-xs">· {d.headTeacher}</span>}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cons.programs && cons.programs.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <BookOpen className={`h-4 w-4 ${accent}`} />
                                        תוכניות לימוד
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {cons.programs.map((p, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className={`w-1.5 h-1.5 rounded-full bg-current ${accent} flex-shrink-0`} />
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Branches */}
                            {cons.branchesInfo && cons.branchesInfo.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <MapPin className={`h-4 w-4 ${accent}`} />
                                        שלוחות
                                    </h4>
                                    <div className="space-y-2">
                                        {cons.branchesInfo.map((b, i) => (
                                            <div key={i} className="bg-muted/20 rounded-lg p-3 text-sm">
                                                <p className="font-medium">{b.name}</p>
                                                {b.address && <p className="text-xs text-muted-foreground mt-0.5">{b.address}</p>}
                                                {b.tel && <p className="text-xs text-muted-foreground mt-0.5">{b.tel}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teachers grid */}
                    {cons.teachers && cons.teachers.length > 0 && (
                        <div className="border-t border-border pt-6">
                            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                <Users className={`h-4 w-4 ${accent}`} />
                                צוות מורים ({cons.teachers.length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {cons.teachers.slice(0, 12).map((teacher, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 text-center group/teacher">
                                        <Avatar className="h-16 w-16 border-2 border-border group-hover/teacher:border-primary transition-colors">
                                            <AvatarImage src={teacher.photoUrl} alt={teacher.name} />
                                            <AvatarFallback className="text-sm font-bold">
                                                {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-xs leading-snug">{teacher.name}</p>
                                            {teacher.role && <p className="text-xs text-muted-foreground leading-snug mt-0.5">{teacher.role}</p>}
                                        </div>
                                    </div>
                                ))}
                                {cons.teachers.length > 12 && (
                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                        <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                            <span className="text-sm font-bold text-muted-foreground">+{cons.teachers.length - 12}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">מורים נוספים</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="border-t border-border pt-4 flex gap-3">
                        <Button asChild className="flex-1">
                            <Link href="/contact">צור קשר עם קונסרבטוריון זה</Link>
                        </Button>
                        {cons.officialSite && (
                            <Button asChild variant="outline">
                                <a href={cons.officialSite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    אתר רשמי
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const ALL_DEPARTMENTS = Array.from(
    new Set(conservatoriums.flatMap(c => c.departments?.map(d => d.name) || []))
).sort();

export default function AboutPage() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');

    const [search, setSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
    const [selectedCons, setSelectedCons] = useState<Conservatorium | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleLocate = useCallback(() => {
        if (!navigator.geolocation) { setLocationStatus('error'); return; }
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus('found'); setCitySearch(''); },
            () => setLocationStatus('error')
        );
    }, []);

    const referencePoint = useMemo(() => {
        if (userLocation) return userLocation;
        const cityKey = citySearch.trim().toLowerCase();
        if (cityKey) {
            for (const [key, coords] of Object.entries(CITY_COORDS)) {
                if (key.toLowerCase().includes(cityKey) || cityKey.includes(key.toLowerCase())) return coords;
            }
        }
        return null;
    }, [userLocation, citySearch]);

    const filteredAndSorted = useMemo(() => {
        let list = conservatoriums.filter(c => {
            const q = search.toLowerCase();
            const nameMatch = c.name.toLowerCase().includes(q) || (c.nameEn?.toLowerCase().includes(q)) || (c.location?.city?.toLowerCase().includes(q)) || (c.location?.cityEn?.toLowerCase().includes(q));
            const deptMatch = !deptFilter || c.departments?.some(d => d.name === deptFilter);
            return nameMatch && deptMatch;
        });

        if (referencePoint) {
            return list.sort((a, b) => {
                const coordsA = a.location?.coordinates;
                const coordsB = b.location?.coordinates;
                if (!coordsA && !coordsB) return 0;
                if (!coordsA) return 1;
                if (!coordsB) return -1;
                const distA = haversineDistance(referencePoint.lat, referencePoint.lng, coordsA.lat, coordsA.lng);
                const distB = haversineDistance(referencePoint.lat, referencePoint.lng, coordsB.lat, coordsB.lng);
                return distA - distB;
            });
        }
        return list.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }, [search, deptFilter, referencePoint]);

    function getDistance(cons: Conservatorium): number | undefined {
        if (!referencePoint || !cons.location?.coordinates) return undefined;
        return haversineDistance(referencePoint.lat, referencePoint.lng, cons.location.coordinates.lat, cons.location.coordinates.lng);
    }

    function openCons(cons: Conservatorium) {
        setSelectedCons(cons);
        setDialogOpen(true);
    }

    const hasFilters = !!search || !!deptFilter || !!citySearch || locationStatus === 'found';

    return (
        <div className="flex flex-col min-h-dvh bg-background">
            {/* Header */}
            <PublicNavbar />

            <main className="flex-1 pt-14">
                {/* Hero */}
                <section className="relative py-20 px-4 text-center overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
                    <div className="relative max-w-3xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold text-primary mb-2">
                            <Music2 className="h-4 w-4" />
                            <span>{conservatoriums.length} קונסרבטוריונים</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            מוצאים את הקונסרבטוריון שלכם
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            רשת הקונסרבטוריונים של הרמוניה — חינוך מוסיקלי מקצועי לכל הגילאים, בכל רחבי הארץ.
                        </p>
                    </div>
                </section>

                {/* Search & Filters */}
                <section className="sticky top-14 z-30 bg-background/90 backdrop-blur-md border-b border-border py-3 px-4">
                    <div className="max-w-7xl mx-auto space-y-2.5">
                        {/* Main search row */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="חיפוש לפי שם עיר, שם קונסרבטוריון..."
                                    className="w-full h-10 bg-muted/50 border border-border rounded-xl ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                                    dir="rtl"
                                />
                            </div>
                            <div className="flex gap-2">
                                {/* City for distance sort */}
                                <div className="relative flex-1 sm:w-40">
                                    <Navigation2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        value={citySearch}
                                        onChange={e => { setCitySearch(e.target.value); setUserLocation(null); setLocationStatus('idle'); }}
                                        placeholder="מיין לפי עיר..."
                                        className="w-full h-10 bg-muted/50 border border-border rounded-xl ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                                        dir="rtl"
                                    />
                                </div>
                                <Button
                                    variant={locationStatus === 'found' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={handleLocate}
                                    disabled={locationStatus === 'loading'}
                                    className="h-10 gap-2 whitespace-nowrap rounded-xl"
                                >
                                    <LocateFixed className="h-4 w-4" />
                                    {locationStatus === 'loading' ? 'מאתר...' : locationStatus === 'found' ? 'ממוין לפי מיקום' : 'מיקום נוכחי'}
                                </Button>
                            </div>
                        </div>

                        {/* Department filter chips */}
                        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                            <button
                                onClick={() => setDeptFilter('')}
                                className={`flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-all ${!deptFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:border-primary hover:text-primary'}`}
                            >
                                הכל
                            </button>
                            {ALL_DEPARTMENTS.slice(0, 15).map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setDeptFilter(deptFilter === dept ? '' : dept)}
                                    className={`flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-all ${deptFilter === dept ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:border-primary hover:text-primary'}`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Results */}
                <section className="py-8 px-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Stats row */}
                        <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
                            <span>
                                {filteredAndSorted.length === conservatoriums.length
                                    ? `מציג ${conservatoriums.length} קונסרבטוריונים`
                                    : `נמצאו ${filteredAndSorted.length} מתוך ${conservatoriums.length}`}
                                {referencePoint && ' · ממוין לפי מרחק'}
                            </span>
                            {hasFilters && (
                                <button
                                    onClick={() => { setSearch(''); setDeptFilter(''); setCitySearch(''); setUserLocation(null); setLocationStatus('idle'); }}
                                    className="flex items-center gap-1.5 text-primary hover:underline"
                                >
                                    <X className="h-3.5 w-3.5" /> נקה סינון
                                </button>
                            )}
                        </div>

                        {filteredAndSorted.length === 0 ? (
                            <div className="text-center py-24 space-y-3">
                                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                                <p className="text-lg font-medium text-muted-foreground">לא נמצאו קונסרבטוריונים תואמים</p>
                                <p className="text-sm text-muted-foreground">נסו לשנות את מילות החיפוש או לנקות את הסינון</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredAndSorted.map(cons => (
                                    <ConservatoriumCard
                                        key={cons.id}
                                        cons={cons}
                                        distance={getDistance(cons)}
                                        onClick={() => openCons(cons)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <PublicFooter />

            <ConservatoriumDialog
                cons={selectedCons}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </div>
    );
}
