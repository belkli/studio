'use client';

import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Maximize2, MessageCircleQuestion, Minimize2, Send } from 'lucide-react';
import { getAiHelpResponse } from '@/app/actions';
import type { HelpAssistantResponse } from '@/ai/flows/help-assistant-flow';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, usePathname } from '@/i18n/routing';
import { BRAND_HELP_FAB_POSITION_KEY, BRAND_HELP_FAB_MINIMIZED_KEY } from '@/lib/brand';
import { useTranslations, useLocale } from 'next-intl';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  response?: HelpAssistantResponse;
}

const FAB_POSITION_KEY = BRAND_HELP_FAB_POSITION_KEY;
const FAB_MINIMIZED_KEY = BRAND_HELP_FAB_MINIMIZED_KEY;

export function AiHelpAssistant() {
  const t = useTranslations('HelpAssistant');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState('0px');
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);
  const [fabMinimized, setFabMinimized] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);
  const suppressClickRef = useRef(false);
  const pathname = usePathname();
  const locale = useLocale();
  const safeT = useCallback((key: string, fallback: string) => {
    const value = t(key);
    if (
      !value ||
      value === key ||
      /\?{3,}/.test(value) ||
      value.includes('\uFFFD') ||
      value.includes('\u00D7')
    ) {
      return fallback;
    }
    return value;
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).openHelpAssistant = () => setIsOpen(true);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const clampFabPosition = useCallback((x: number, y: number, minimized = fabMinimized) => {
    const size = minimized ? 40 : 56;
    const maxX = Math.max(8, window.innerWidth - size - 8);
    const maxY = Math.max(8, window.innerHeight - size - 8);
    return {
      x: Math.max(8, Math.min(x, maxX)),
      y: Math.max(8, Math.min(y, maxY)),
    };
  }, [fabMinimized]);

  useEffect(() => {
    try {
      const rawMini = localStorage.getItem(FAB_MINIMIZED_KEY);
      const minimized = rawMini === '1';
      setFabMinimized(minimized);

      const rawPosition = localStorage.getItem(FAB_POSITION_KEY);
      if (rawPosition) {
        const parsed = JSON.parse(rawPosition) as { x?: number; y?: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setFabPosition(clampFabPosition(parsed.x, parsed.y, minimized));
        }
      }
    } catch {
      // Ignore storage failures.
    }
    // Storage should only initialize once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAB_MINIMIZED_KEY, fabMinimized ? '1' : '0');
    } catch {
      // Ignore storage failures.
    }
  }, [fabMinimized]);

  useEffect(() => {
    if (!fabPosition) return;
    try {
      localStorage.setItem(FAB_POSITION_KEY, JSON.stringify(fabPosition));
    } catch {
      // Ignore storage failures.
    }
  }, [fabPosition]);

  useEffect(() => {
    if (fabPosition) return;
    const raf = requestAnimationFrame(() => {
      const rect = fabRef.current?.getBoundingClientRect();
      if (!rect) return;
      setFabPosition(clampFabPosition(rect.left, rect.top, fabMinimized));
    });
    return () => cancelAnimationFrame(raf);
  }, [fabPosition, clampFabPosition, sidebarOffset, isDesktop, fabMinimized]);

  useEffect(() => {
    const onResize = () => {
      setFabPosition((prev) => (prev ? clampFabPosition(prev.x, prev.y) : prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampFabPosition]);

  const onFabPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!fabPosition) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX - fabPosition.x,
      startY: event.clientY - fabPosition.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onFabPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = clampFabPosition(event.clientX - drag.startX, event.clientY - drag.startY, fabMinimized);
    if (Math.abs(event.movementX) > 1 || Math.abs(event.movementY) > 1) {
      suppressClickRef.current = true;
    }
    setFabPosition(next);
  };

  const onFabPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const suggestedQuestions = useMemo(() => {
    const defaultQuestions = [
      safeT('quickQuestions.default.cancelLesson', 'How do I cancel a lesson?'),
      safeT('quickQuestions.default.makeupBalance', 'Where can I see my makeup lesson balance?'),
      safeT('quickQuestions.default.recitalForm', 'How do I submit a recital form?'),
      safeT('quickQuestions.default.updateAvailability', 'How do I update my availability? (teachers)'),
    ];

    if (pathname.includes('/dashboard/schedule')) {
      return [
        safeT('quickQuestions.schedule.bookMakeup', 'How do I book a makeup lesson?'),
        safeT('quickQuestions.schedule.cancelNextWeek', "Can I cancel next week's lesson?"),
        safeT('quickQuestions.schedule.cancellationPolicy', 'What is the conservatory cancellation policy?'),
        safeT('quickQuestions.schedule.syncCalendar', 'How can I sync my calendar?'),
      ];
    }
    if (pathname.includes('/dashboard/billing')) {
      return [
        safeT('quickQuestions.billing.invoices', 'Where can I find my invoices?'),
        safeT('quickQuestions.billing.updateCard', 'How do I update my payment card?'),
        safeT('quickQuestions.billing.nextCharge', 'When is my next charge due?'),
        safeT('quickQuestions.billing.siblingDiscount', 'How does sibling discount work?'),
      ];
    }
    if (pathname.includes('/dashboard/forms')) {
      return [
        safeT('quickQuestions.forms.approveRecital', 'How long does recital form approval take?'),
        safeT('quickQuestions.forms.rejectedForm', 'My form was rejected, what should I do?'),
        safeT('quickQuestions.forms.downloadPdf', 'How do I download approved form PDF?'),
        safeT('quickQuestions.forms.whoApproves', 'Who needs to approve my form?'),
      ];
    }
    if (pathname.includes('/dashboard/admin')) {
      return [
        safeT('quickQuestions.admin.approveEnrollment', 'How do I approve a new student enrollment?'),
        safeT('quickQuestions.admin.packagePricing', 'Where do I configure package pricing?'),
        safeT('quickQuestions.admin.sendAnnouncement', 'How do I send an announcement to all parents?'),
        safeT('quickQuestions.admin.financialReports', 'Where can I view financial reports?'),
      ];
    }
    return defaultQuestions;
  }, [pathname, safeT]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ sender: 'bot', text: t('welcomeMessage') }]);
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
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAiHelpResponse({
        userId: user.id,
        conservatoriumId: user.conservatoriumId,
        question: userQuestion,
        locale,
      });

      const botMessage: Message = { sender: 'bot', text: response.answer, response };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'bot', text: t('errorMessage') }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, user, t, locale]);

  if (!user || !user.approved) return null;

  const floatingStyle: CSSProperties | undefined = fabPosition
    ? { left: `${fabPosition.x}px`, top: `${fabPosition.y}px` }
    : isDesktop
      ? ({ marginInlineEnd: sidebarOffset } as CSSProperties)
      : undefined;

  return (
    <>
      <div
        className={cn(
          'fixed z-50',
          fabPosition ? '' : 'bottom-20 [inset-inline-end:1rem] lg:bottom-6 lg:[inset-inline-end:1.5rem]'
        )}
        style={floatingStyle}
      >
        <button
          type="button"
          className="absolute -top-2 -end-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-card text-muted-foreground shadow"
          onClick={() => setFabMinimized((v) => !v)}
          aria-label={t('openAssistant')}
        >
          {fabMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
        </button>

        <Button
          ref={fabRef}
          id="help-button"
          className={cn(
            'rounded-full shadow-lg transition-[width,height] touch-none',
            fabMinimized ? 'h-10 w-10' : 'h-14 w-14'
          )}
          size="icon"
          onClick={() => {
            if (suppressClickRef.current) return;
            setIsOpen(true);
          }}
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
        >
          <MessageCircleQuestion className={cn(fabMinimized ? 'h-5 w-5' : 'h-7 w-7')} />
          <span className="sr-only">{t('openAssistant')}</span>
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col p-0" side="left">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Bot />
              {t('title')}
            </SheetTitle>
            <SheetDescription>{t('description')}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message, index) => (
                <div key={index} className={cn('flex items-start gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                  )}
                  <div className={cn('rounded-lg px-4 py-2 max-w-[85%]', message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {message.sender === 'bot' && message.response?.suggestedActions && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-muted-foreground/20 pt-3">
                        {message.response.suggestedActions.map((action, i) => (
                          <Button key={i} size="sm" variant="secondary" asChild className="h-8 w-full justify-start text-xs">
                            <Link href={action.href} onClick={() => setIsOpen(false)}>{action.label}</Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.sender === 'user' && user && (
                    <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start justify-start gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                  <div className="rounded-lg bg-muted px-4 py-2"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                </div>
              )}
              {messages.length <= 1 && !isLoading && (
                <div className="pt-4">
                  <p className="mb-2 text-sm font-medium">{t('suggestionsTitle')}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {suggestedQuestions.map((q) => (
                      <Button key={q} variant="outline" size="sm" className="h-auto justify-start text-wrap" onClick={() => handleSendMessage(q)}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t bg-background p-4">
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
            <div className="mt-2 text-center">
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
