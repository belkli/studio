'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, MessageCircleQuestion, Send, User as UserIcon } from 'lucide-react';
import { getAiHelpResponse } from '@/app/actions';
import type { HelpAssistantResponse } from '@/ai/flows/help-assistant-flow';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname } from '@/i18n/routing';


interface Message {
    sender: 'user' | 'bot';
    text: string;
    response?: HelpAssistantResponse;
}

export function HelpAssistantFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        (window as any).openHelpAssistant = () => setIsOpen(true);
        return () => {
            delete (window as any).openHelpAssistant;
        };
    }, []);

    const suggestedQuestions = useMemo(() => {
        const defaultQuestions = [
            'איך מבטלים שיעור?',
            'איפה אני רואה את יתרת שיעורי ההשלמה שלי?',
            'איך מגישים טופס רסיטל?',
            'כיצד אני מעדכן את הזמינות שלי? (למורים)',
        ];

        if (pathname.includes('/dashboard/schedule')) {
            return [
                'איך אני מזמין שיעור השלמה?',
                'האם אפשר לבטל שיעור מהשבוע הבא?',
                'מהי מדיניות הביטולים של הקונסרבטוריון?',
                'כיצד אוכל לסנכרן את היומן שלי?'
            ];
        }
        if (pathname.includes('/dashboard/billing')) {
            return [
                'איפה אני מוצא את החשבוניות שלי?',
                'איך מעדכנים פרטי אשראי?',
                'מתי החיוב הבא שלי צפוי?',
                'איך עובדת הנחת אחים?'
            ];
        }
        if (pathname.includes('/dashboard/forms')) {
            return [
                'כמה זמן לוקח לאשר טופס רסיטל?',
                'הטופס שלי נדחה, מה עושים?',
                'איך אני מוריד עותק PDF של טופס מאושר?',
                'מי צריך לאשר את הטופס שלי?'
            ];
        }
        if (pathname.includes('/dashboard/admin')) {
             return [
                'איך אני מאשר הרשמה של תלמיד חדש?',
                'איפה אני מגדיר את מחירי החבילות?',
                'איך אני שולח הכרזה לכל ההורים?',
                'איפה אני רואה דוחות כספיים?'
            ];
        }
        return defaultQuestions;
    }, [pathname]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { sender: 'bot', text: 'שלום! אני הרמוני, עוזר ה-AI. איך אוכל לעזור לך היום?' }
            ]);
        }
    }, [isOpen, messages]);

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
                locale: 'he', // Default locale for the prompt context
            });

            const botMessage: Message = { sender: 'bot', text: response.answer, response };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
             setMessages(prev => [...prev, { sender: 'bot', text: 'אני מצטער, אירעה שגיאה. אנא נסה שוב מאוחר יותר.' }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, user]);

    if (!user || !user.approved) return null;

    return (
        <>
            <Button
                id="help-button"
                className="fixed bottom-6 end-6 h-14 w-14 rounded-full shadow-lg"
                size="icon"
                onClick={() => setIsOpen(true)}
            >
                <MessageCircleQuestion className="h-7 w-7" />
                <span className="sr-only">פתח עוזר AI</span>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent className="flex flex-col p-0" side="left">
                    <SheetHeader className="p-6 pb-4">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <Bot />
                            עוזר AI של הרמוניה
                        </SheetTitle>
                        <SheetDescription>
                            שאל אותי כל דבר על המערכת, ואעשה כמיטב יכולתי לעזור.
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
                        <div className="space-y-4 py-4">
                            {messages.map((message, index) => (
                                <div key={index} className={cn("flex items-start gap-3", message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                    {message.sender === 'bot' && <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>}
                                    <div className={cn("rounded-lg px-4 py-2 max-w-[85%]", message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
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
                                    <p className="text-sm font-medium mb-2">הצעות:</p>
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
                                placeholder="שאל אותי משהו..."
                                className="pe-12"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
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
