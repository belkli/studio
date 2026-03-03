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
import { getLocalizedConservatorium } from "@/lib/utils/localized-content";

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
    const t = useTranslations('AboutPage');
    const locale = useLocale();
    const localizedCons = getLocalizedConservatorium(cons, locale);
    const gradient = getCardGradient(localizedCons.id);
    const accent = getAccentColor(localizedCons.id);
    const heroPhoto = localizedCons.photoUrls?.[0];

    const name = localizedCons.name;
    const city = localizedCons.location?.city;
    const about = localizedCons.about;

    return (
        <button
            onClick={onClick}
            className="group relative bg-card border border-border rounded-2xl overflow-hidden text-start transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 w-full"
        >
            {/* Hero strip */}
            <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
                {heroPhoto ? (
                    <img src={heroPhoto} alt={name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Music2 className={`h-16 w-16 ${accent} opacity-20 group-hover:opacity-30 transition-opacity`} />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                {distance !== undefined && (
                    <div className="absolute top-3 start-3 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-semibold">
                        <Navigation2 className="h-3 w-3 text-primary" />
                        <span>{distance < 1 ? t('unitMeters', { count: Math.round(distance * 1000) }) : t('unitKm', { count: distance.toFixed(1) })}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                <div>
                    <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">{name}</h3>
                </div>

                {city && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{city}</span>
                    </div>
                )}

                {about && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{about}</p>
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
    const t = useTranslations('AboutPage');
    const locale = useLocale();

    if (!cons) return null;

    const localizedCons = getLocalizedConservatorium(cons, locale);
    const translation = localizedCons.translations?.[locale as keyof typeof localizedCons.translations];
    const name = localizedCons.name;
    const about = localizedCons.about;
    const openingHours = localizedCons.openingHours;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-start">
                    <DialogTitle className="text-2xl font-bold">{name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {about && <p className="text-sm text-muted-foreground leading-relaxed">{about}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-semibold">{t('contactDetails')}</h4>
                            {localizedCons.location?.city && <p>{localizedCons.location?.address || localizedCons.location?.city}</p>}
                            {cons.tel && <a href={'tel:' + cons.tel} className="hover:underline">{cons.tel}</a>}
                            {cons.email && <a href={'mailto:' + cons.email} className="hover:underline break-all">{cons.email}</a>}
                            {cons.secondaryEmail && <a href={'mailto:' + cons.secondaryEmail} className="hover:underline break-all">{cons.secondaryEmail}</a>}
                            {openingHours && <p>{openingHours}</p>}
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold">{t('departments')}</h4>
                            {cons.departments && cons.departments.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {cons.departments.map((d, i) => (
                                        <Badge key={i} variant="secondary">{d.name}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">{t('noDepartments')}</p>
                            )}
                        </div>
                    </div>

                    {cons.teachers && cons.teachers.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold">{t('teachers', { count: cons.teachers.length })}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {cons.teachers.slice(0, 8).map((teacher, i) => (
                                    <div key={i} className="text-center text-xs">
                                        <Avatar className="h-12 w-12 mx-auto mb-1">
                                            <AvatarImage src={teacher.photoUrl} alt={teacher.name} />
                                            <AvatarFallback>{teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium">{teacher.name}</p>
                                        {teacher.role && <p className="text-muted-foreground">{teacher.role}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <Button asChild className="flex-1">
                            <Link href="/contact">{t('contactThisCons')}</Link>
                        </Button>
                        {cons.officialSite && (
                            <Button asChild variant="outline" className="flex-1">
                                <a href={cons.officialSite} target="_blank" rel="noopener noreferrer">
                                    {t('officialSite')}
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function AboutPage() {
    const t = useTranslations('AboutPage');
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const locale = useLocale();

    const localizedConservatoriums = useMemo(() => {
        return conservatoriums.map(c => getLocalizedConservatorium(c, locale));
    }, [locale]);

    const allDepartments = useMemo(() => {
        const uniqueNames = Array.from(
            new Set(localizedConservatoriums.flatMap(c => c.departments?.map(d => d.name) || []))
        ).sort();
        return uniqueNames;
    }, [localizedConservatoriums]);

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
        let list = localizedConservatoriums.filter(c => {
            const q = search.toLowerCase();
            const name = c.name || '';
            const city = c.location?.city || '';

            const nameMatch = name.toLowerCase().includes(q) || (city.toLowerCase().includes(q));
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
        return list.sort((a, b) => a.name.localeCompare(b.name, locale === 'he' ? 'he' : 'en'));
    }, [search, deptFilter, referencePoint, locale]);

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
        <div className="flex flex-col min-h-dvh bg-background" dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <PublicNavbar />

            <main className="flex-1 pt-14 text-start">
                {/* Hero */}
                <section className="relative py-20 px-4 text-center overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
                    <div className="relative max-w-3xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold text-primary mb-2">
                            <Music2 className="h-4 w-4" />
                            <span>{t('showingCount', { count: conservatoriums.length })}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            {t('subtitle')}
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
                                    placeholder={t('searchPlaceholder')}
                                    className="w-full h-10 bg-muted/50 border border-border rounded-xl ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                                />
                            </div>
                            <div className="flex gap-2">
                                {/* City for distance sort */}
                                <div className="relative flex-1 sm:w-40">
                                    <Navigation2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        value={citySearch}
                                        onChange={e => { setCitySearch(e.target.value); setUserLocation(null); setLocationStatus('idle'); }}
                                        placeholder={t('citySortPlaceholder')}
                                        className="w-full h-10 bg-muted/50 border border-border rounded-xl ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
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
                                    {locationStatus === 'loading' ? t('locating') : locationStatus === 'found' ? t('sortedByLocation') : t('locateMe')}
                                </Button>
                            </div>
                        </div>

                        {/* Department filter chips */}
                        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                            <button
                                onClick={() => setDeptFilter('')}
                                className={`flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-all ${!deptFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:border-primary hover:text-primary'}`}
                            >
                                {t('allDepartments')}
                            </button>
                            {allDepartments.slice(0, 15).map(dept => (
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
                                    ? t('showingCount', { count: conservatoriums.length })
                                    : t('foundCount', { found: filteredAndSorted.length, total: conservatoriums.length })}
                                {referencePoint && ` · ${t('sortedByDistance')}`}
                            </span>
                            {hasFilters && (
                                <button
                                    onClick={() => { setSearch(''); setDeptFilter(''); setCitySearch(''); setUserLocation(null); setLocationStatus('idle'); }}
                                    className="flex items-center gap-1.5 text-primary hover:underline"
                                >
                                    <X className="h-3.5 w-3.5" /> {t('clearFilters')}
                                </button>
                            )}
                        </div>

                        {filteredAndSorted.length === 0 ? (
                            <div className="text-center py-24 space-y-3">
                                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                                <p className="text-lg font-medium text-muted-foreground">{t('noResults')}</p>
                                <p className="text-sm text-muted-foreground">{t('noResultsSub')}</p>
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
