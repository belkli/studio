
'use client';

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Share2, MessageCircle, Copy, Check, ExternalLink, BarChart3, Filter, Users, TrendingUp, Handshake } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const MOCK_FUNNEL = [
    { label: 'Leads (Finder)', value: 450, color: 'bg-slate-200' },
    { label: 'Token Scanned', value: 310, color: 'bg-indigo-200' },
    { label: 'Started Wizard', value: 185, color: 'bg-indigo-400' },
    { label: 'Enrolled (Paid)', value: 142, color: 'bg-emerald-500' },
];

export default function PlayingSchoolDistributionPage() {
    const t = useTranslations('PlayingSchool.admin');
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        toast({ title: 'Copied to clipboard' });
    };

    const handleWhatsAppShare = (school: string, token: string) => {
        const url = `https://harmony.app/register/school?token=${token}`;
        const message = encodeURIComponent(`Hi! Registration for the music program at ${school} is now open! Sign up here: ${url}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Handshake className="h-8 w-8 text-indigo-600" />
                        Token Distribution & Analytics
                    </h1>
                    <p className="text-slate-500 mt-1">Manage registration links and track enrollment conversion for your school partners.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Funnel Widget */}
                <Card className="lg:col-span-1 shadow-sm border-slate-200 overflow-hidden bg-gradient-to-b from-white to-slate-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-indigo-600" />
                            Enrollment Funnel
                        </CardTitle>
                        <CardDescription>Overall conversion across all schools</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {MOCK_FUNNEL.map((step, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-600">{step.label}</span>
                                    <span className="text-slate-900">{step.value}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={step.color}
                                        style={{ width: `${(step.value / MOCK_FUNNEL[0].value) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-slate-200 mt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Conversion Rate</p>
                                    <p className="text-2xl font-black text-indigo-600">31.5%</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-emerald-500 opacity-20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Token Table */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-indigo-600" />
                            Active Registration Tokens
                        </CardTitle>
                        <CardDescription>Share these links with school coordinators for parent distribution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold">School Partnership</TableHead>
                                    <TableHead className="font-bold">Registration Token</TableHead>
                                    <TableHead className="font-bold">Conversion</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { school: 'בית ספר אורט רמת גן', token: 'TOKEN_ORT_26', enrolled: 45, max: 60 },
                                    { school: 'בית ספר ממלכתי דינור', token: 'TOKEN_DINUR_26', enrolled: 12, max: 40 },
                                ].map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="font-bold text-slate-900">{row.school}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Academic Year: תשפ"ו</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center gap-2 p-1 px-2 rounded-lg bg-slate-50 border border-slate-200">
                                                <code className="text-xs font-mono text-indigo-600">{row.token}</code>
                                                <button
                                                    onClick={() => handleCopy(`https://harmony.app/register/school?token=${row.token}`, row.token)}
                                                    className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-indigo-600"
                                                >
                                                    {copied === row.token ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 w-24">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span>{row.enrolled}/{row.max}</span>
                                                    <span>{Math.round((row.enrolled / row.max) * 100)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${(row.enrolled / row.max) * 100}%` }} />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                                                    onClick={() => handleWhatsAppShare(row.school, row.token)}
                                                >
                                                    <MessageCircle className="h-4 w-4 me-1" />
                                                    WhatsApp
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
