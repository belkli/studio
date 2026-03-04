'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  response?: HelpAssistantResponse;
}

export function AiHelpAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations('HelpAssistant');
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

  const suggestedQuestions = [
    safeT('quickQuestions.default.cancelLesson', 'How do I cancel a lesson?'),
    safeT('quickQuestions.default.makeupBalance', 'Where can I see my makeup lesson balance?'),
    safeT('quickQuestions.default.recitalForm', 'How do I submit a recital form?'),
    safeT('quickQuestions.default.updateAvailability', 'How do I update my availability? (teachers)'),
  ];

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
  }, [input, user, locale, t]);

  return (
    <>
      <Button
        id="help-button"
        className="fixed bottom-6 start-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setIsOpen(true)}
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
            <SheetDescription>{t('description')}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message, index) => (
                <div key={index} className={cn('flex items-start gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn('max-w-[85%] rounded-lg px-4 py-2', message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <p className="whitespace-pre-wrap text-sm">{message.text}</p>

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
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
