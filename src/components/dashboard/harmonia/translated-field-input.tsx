'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit2, Check, Sparkles, User, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface TranslatedFieldInputProps {
    label: string;
    value: string; // The primary language (Hebrew)
    translations: {
        en?: string;
        ar?: string;
        ru?: string;
    };
    fieldKey: string;
    onSourceChange: (val: string) => void;
    onTranslationChange: (locale: string, val: string) => void;
    isTextArea?: boolean;
    isStale?: boolean;
    isTranslating?: boolean;
    overriddenLocales?: string[];
}

export function TranslatedFieldInput({
    label,
    value,
    translations,
    fieldKey: _fieldKey,
    onSourceChange,
    onTranslationChange,
    isTextArea = false,
    isStale = false,
    isTranslating = false,
    overriddenLocales = []
}: TranslatedFieldInputProps) {
    const t = useTranslations('Common.translationEditor');
    const [activeLocale, setActiveLocale] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    const handleEdit = (locale: string) => {
        setActiveLocale(locale);
        setEditingValue(translations[locale as keyof typeof translations] || '');
    };

    const handleSave = () => {
        if (activeLocale) {
            onTranslationChange(activeLocale, editingValue);
            setActiveLocale(null);
        }
    };

    const locales = [
        { id: 'en', label: t('language.english'), dir: 'ltr' },
        { id: 'ar', label: t('language.arabic'), dir: 'rtl' },
        { id: 'ru', label: t('language.russian'), dir: 'ltr' }
    ];

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-card shadow-sm">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-primary">{label}</Label>
                {isStale && !isTranslating && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 animate-pulse">
                        <History className="w-3 h-3" />
                        {t('stale')}
                    </Badge>
                )}
                {isTranslating && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 gap-1">
                        <Sparkles className="w-3 h-3 animate-spin" />
                        {t('aiTranslating')}
                    </Badge>
                )}
            </div>

            {/* Primary Language Input (Hebrew) */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase">HE</Badge>
                    <span className="text-xs text-muted-foreground">{t('sourceContent')}</span>
                </div>
                {isTextArea ? (
                    <Textarea
                        value={value}
                        onChange={(e) => onSourceChange(e.target.value)}
                        dir="rtl"
                        className="min-h-[100px] text-lg font-medium leading-relaxed"
                    />
                ) : (
                    <Input
                        value={value}
                        onChange={(e) => onSourceChange(e.target.value)}
                        dir="rtl"
                        className="text-lg font-medium"
                    />
                )}
            </div>

            {/* Translations Grid — always LTR layout so EN/AR/RU order is consistent */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2" dir="ltr">
                {locales.map((lang) => {
                    const isOverridden = overriddenLocales.includes(lang.id);
                    const currentText = translations[lang.id as keyof typeof translations];
                    const isEditing = activeLocale === lang.id;

                    return (
                        <div key={lang.id} className="flex flex-col space-y-2 group relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] uppercase">
                                        {lang.id}
                                    </Badge>
                                    <span className="text-xs font-medium">{lang.label}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    {isOverridden ? (
                                        <Badge variant="outline" className="px-1 py-0 h-4 text-[9px] bg-green-50 text-green-700 border-green-200 gap-1">
                                            <User className="w-2.5 h-2.5" />
                                            {t('human')}
                                        </Badge>
                                    ) : currentText ? (
                                        <Badge variant="outline" className="px-1 py-0 h-4 text-[9px] bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                            <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                                            {t('ai')}
                                        </Badge>
                                    ) : null}

                                    {!isEditing && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleEdit(lang.id)}
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-2">
                                    {isTextArea ? (
                                        <Textarea
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            dir={lang.dir as any}
                                            className="min-h-[80px] text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <Input
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            dir={lang.dir as any}
                                            className="h-8 text-sm"
                                            autoFocus
                                        />
                                    )}
                                    <div className="flex justify-end gap-1">
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setActiveLocale(null)}>
                                            {t('cancel')}
                                        </Button>
                                        <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleSave}>
                                            <Check className="w-3 h-3" />
                                            {t('override')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "p-2 rounded border bg-muted/30 text-xs min-h-[40px] whitespace-pre-wrap cursor-pointer hover:bg-muted/50 transition-colors",
                                        !currentText && "italic text-muted-foreground flex items-center justify-center"
                                    )}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    dir={lang.dir as any}
                                    onClick={() => handleEdit(lang.id)}
                                >
                                    {currentText || t('noTranslationYet')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
