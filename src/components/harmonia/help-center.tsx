'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, BookOpen } from 'lucide-react';
import { helpArticles, helpCategories } from '@/lib/help-articles';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export function HelpCenter() {
    const t = useTranslations('HelpCenter');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [searchTerm, setSearchTerm] = useState('');

    const filteredArticles = searchTerm
        ? helpArticles.filter(
            article =>
              article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              article.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : helpArticles;

    const categoryLabel = (cat: string) => {
      const key = ('category_' + cat.replace(/[^a-zA-Z]/g, '')) as Parameters<typeof t>[0];
      try { return t(key); } catch { return cat; }
    };

    return (
        <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="text-center py-12 bg-muted/50 rounded-lg">
                <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
                <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
                <div className="mt-6 relative max-w-xl mx-auto">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t('searchPlaceholder')}
                        className="w-full h-12 text-lg ps-12"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

             {searchTerm ? (
                 <div className="space-y-4">
                     <h2 className="text-2xl font-semibold">{t('resultsTitle', { query: searchTerm })}</h2>
                     {filteredArticles.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {filteredArticles.map(article => (
                                <Link key={article.id} href={"/help/" + article.id} passHref>
                                    <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer h-full">
                                        <h3 className="font-semibold">{article.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stripMarkdown(article.content).substring(0, 120)}</p>
                                    </div>
                                </Link>
                           ))}
                        </div>
                     ) : (
                        <p>{t('noResults')}</p>
                     )}
                 </div>
             ) : (
                helpCategories.map(category => (
                    <div key={category}>
                        <h2 className="text-2xl font-semibold mb-4">{categoryLabel(category)}</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {helpArticles.filter(a => a.category === category).map(article => (
                                <Link key={article.id} href={"/help/" + article.id} passHref>
                                     <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer flex items-start gap-3 h-full">
                                         <BookOpen className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold">{article.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stripMarkdown(article.content).substring(0, 120)}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
