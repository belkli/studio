'use client';

import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, MessageCircleQuestion, Send } from 'lucide-react';
import { getAiHelpResponse } from '@/app/actions';
import type { HelpAssistantResponse } from '@/ai/flows/help-assistant-flow';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';

interface Message {
    sender: 'user' | 'bot';
    text: string;
    response?: HelpAssistantResponse;
}

export function AiHelpAssistant() {
    const t = useTranslations('HelpAssistant');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [sidebarOffset, setSidebarOffset] = useState('0px');
    const { user } = useAuth();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const locale = useLocale();

    useEffect(() => {
        (window as any).openHelpAssistant = () => setIsOpen(true);
        return () => {
            delete (window as any).openHelpAssistant;
        };
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const updateDesktopState = () => setIsDesktop(mediaQuery.matches);

        updateDesktopState();
        mediaQuery.addEventListener('change', updateDesktopState);

        return () => {
            mediaQuery.removeEventListener('change', updateDesktopState);
        };
    }, []);

    useEffect(() => {
        if (!isDesktop || !pathname.includes('/dashboard')) {
            setSidebarOffset('0px');
            return;
        }

        const updateSidebarOffset = () => {
            const sidebar = document.querySelector('aside[data-state][data-side]');
            if (!sidebar) {
                setSidebarOffset('0px');
                return;
            }

            const side = sidebar.getAttribute('data-side');
            if (side !== 'right') {
                setSidebarOffset('0px');
                return;
            }

            const state = sidebar.getAttribute('data-state');
            const collapsible = sidebar.getAttribute('data-collapsible');

            if (state === 'collapsed' && collapsible === 'icon') {
                setSidebarOffset('var(--sidebar-width-icon, 3rem)');
                return;
            }

            if (state === 'collapsed' && collapsible === 'offcanvas') {
                setSidebarOffset('0px');
                return;
            }

            setSidebarOffset('var(--sidebar-width, 16rem)');
        };

        updateSidebarOffset();

        const observer = new MutationObserver(updateSidebarOffset);
        observer.observe(document.body, {
            subtree: true,
            attributes: true,
            childList: true,
            attributeFilter: ['data-state', 'data-collapsible', 'data-side'],
        });

        return () => {
            observer.disconnect();
        };
    }, [isDesktop, pathname]);

    const suggestedQuestions = useMemo(() => {
        const defaultQuestions = [
            '××™×š ×ž×‘×˜×œ×™× ×©×™×¢×•×¨?',
            '××™×¤×” ×× ×™ ×¨×•××” ××ª ×™×ª×¨×ª ×©×™×¢×•×¨×™ ×”×”×©×œ×ž×” ×©×œ×™?',
            '××™×š ×ž×’×™×©×™× ×˜×•×¤×¡ ×¨×¡×™×˜×œ?',
            '×›×™×¦×“ ×× ×™ ×ž×¢×“×›×Ÿ ××ª ×”×–×ž×™× ×•×ª ×©×œ×™? (×œ×ž×•×¨×™×)',
        ];

        if (pathname.includes('/dashboard/schedule')) {
            return [
                '××™×š ×× ×™ ×ž×–×ž×™×Ÿ ×©×™×¢×•×¨ ×”×©×œ×ž×”?',
                '×”×× ××¤×©×¨ ×œ×‘×˜×œ ×©×™×¢×•×¨ ×ž×”×©×‘×•×¢ ×”×‘×?',
                '×ž×”×™ ×ž×“×™× ×™×•×ª ×”×‘×™×˜×•×œ×™× ×©×œ ×”×§×•× ×¡×¨×‘×˜×•×¨×™×•×Ÿ?',
                '×›×™×¦×“ ××•×›×œ ×œ×¡× ×›×¨×Ÿ ××ª ×”×™×•×ž×Ÿ ×©×œ×™?'
            ];
        }
        if (pathname.includes('/dashboard/billing')) {
            return [
                '××™×¤×” ×× ×™ ×ž×•×¦× ××ª ×”×—×©×‘×•× ×™×•×ª ×©×œ×™?',
                '××™×š ×ž×¢×“×›× ×™× ×¤×¨×˜×™ ××©×¨××™?',
                '×ž×ª×™ ×”×—×™×•×‘ ×”×‘× ×©×œ×™ ×¦×¤×•×™?',
                '××™×š ×¢×•×‘×“×ª ×”× ×—×ª ××—×™×?'
            ];
        }
        if (pathname.includes('/dashboard/forms')) {
            return [
                '×›×ž×” ×–×ž×Ÿ ×œ×•×§×— ×œ××©×¨ ×˜×•×¤×¡ ×¨×¡×™×˜×œ?',
                '×”×˜×•×¤×¡ ×©×œ×™ × ×“×—×”, ×ž×” ×¢×•×©×™×?',
                '××™×š ×× ×™ ×ž×•×¨×™×“ ×¢×•×ª×§ PDF ×©×œ ×˜×•×¤×¡ ×ž××•×©×¨?',
                '×ž×™ ×¦×¨×™×š ×œ××©×¨ ××ª ×”×˜×•×¤×¡ ×©×œ×™?'
            ];
        }
        if (pathname.includes('/dashboard/admin')) {
            return [
                '××™×š ×× ×™ ×ž××©×¨ ×”×¨×©×ž×” ×©×œ ×ª×œ×ž×™×“ ×—×“×©?',
                '××™×¤×” ×× ×™ ×ž×’×“×™×¨ ××ª ×ž×—×™×¨×™ ×”×—×‘×™×œ×•×ª?',
                '××™×š ×× ×™ ×©×•×œ×— ×”×›×¨×–×” ×œ×›×œ ×”×”×•×¨×™×?',
                '××™×¤×” ×× ×™ ×¨×•××” ×“×•×—×•×ª ×›×¡×¤×™×™×?'
            ];
        }
        return defaultQuestions;
    }, [pathname]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { sender: 'bot', text: t('welcomeMessage') }
            ]);
        }
    }, [isOpen, messages, t]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = useCallback(async (question?: string) => {
        const userQuestion = question || input;
        if (!userQuestion.trim() || !user) return;

        const userMessage: Message = { sender: 'user', text: userQuestion };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getAiHelpResponse({
                userId: user.id,
                conservatoriumId: user.conservatoriumId,
                question: userQuestion,
                locale: locale,
            });

            const botMessage: Message = { sender: 'bot', text: response.answer, response };
            setMessages(prev => [...prev, botMessage]);
        } catch (_error) {
            setMessages(prev => [...prev, { sender: 'bot', text: t('errorMessage') }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, user, t, locale]);

    if (!user || !user.approved) return null;

    return (
        <>
            <Button
                id="help-button"
                className="fixed z-50 h-14 w-14 rounded-full shadow-lg transition-[bottom,margin-inline-end] bottom-20 [inset-inline-end:1rem] lg:bottom-6 lg:[inset-inline-end:1.5rem]"
                size="icon"
                onClick={() => setIsOpen(true)}
                style={isDesktop ? ({ marginInlineEnd: sidebarOffset } as CSSProperties) : undefined}
            >
                <MessageCircleQuestion className="h-7 w-7" />
                <span className="sr-only">{t('openAssistant')}</span>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent className="flex flex-col p-0" side="left">
                    <SheetHeader className="p-6 pb-4">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <Bot />
                            {t('title')}
                        </SheetTitle>
                        <SheetDescription>
                            {t('description')}
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
                        <div className="space-y-4 py-4">
                            {messages.map((message, index) => (
                                <div key={index} className={cn('flex items-start gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                    {message.sender === 'bot' && <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>}
                                    <div className={cn('rounded-lg px-4 py-2 max-w-[85%]', message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                        {message.sender === 'bot' && message.response?.suggestedActions && (
                                            <div className="flex flex-col gap-2 mt-3 border-t pt-3 border-muted-foreground/20">
                                                {message.response.suggestedActions.map((action, i) => (
                                                    <Button key={i} size="sm" variant="secondary" asChild className="w-full justify-start text-xs h-8">
                                                        <Link href={action.href} onClick={() => setIsOpen(false)}>{action.label}</Link>
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {message.sender === 'user' && user && <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3 justify-start">
                                    <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                                    <div className="rounded-lg px-4 py-2 bg-muted"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                </div>
                            )}
                            {messages.length <= 1 && !isLoading && (
                                <div className="pt-4">
                                    <p className="text-sm font-medium mb-2">{t('suggestionsTitle')}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {suggestedQuestions.map(q => (
                                            <Button key={q} variant="outline" size="sm" className="h-auto text-wrap justify-start" onClick={() => handleSendMessage(q)}>
                                                {q}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-background">
                        <div className="relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={t('placeholder')}
                                className="pe-12"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute end-1.5 top-1/2 h-7 w-7 -translate-y-1/2"
                                onClick={() => handleSendMessage()}
                                disabled={isLoading || !input.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-center mt-2">
                            <Button variant="link" size="sm" asChild>
                                <Link href="/help" onClick={() => setIsOpen(false)}>{t('goToHelpCenter')}</Link>
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}


