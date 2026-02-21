
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { getAiHelpResponse } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    actions?: { label: string; href: string }[];
};

export function HelpAssistantFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputData, setInputData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const pathname = usePathname();

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
                {
                    role: 'assistant',
                    content: 'שלום! אני הרמוניה, העוזרת החכמה שלך. איך אפשר לעזור היום?',
                },
            ]);
        }
    }, [isOpen, messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = useCallback(async (question?: string) => {
        const userQuestion = question || inputData;
        if (!userQuestion.trim() || !user) return;

        setInputData('');
        setMessages((prev) => [...prev, { role: 'user', content: userQuestion }]);
        setIsLoading(true);

        try {
            const response = await getAiHelpResponse({
                question: userQuestion,
                userId: user.id,
                conservatoriumId: user.conservatoriumId,
                locale: 'he',
            });

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: response.answer,
                    actions: response.suggestedActions,
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'מצטערת, אירעה שגיאה. אנא נסה שוב מאוחר יותר.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [inputData, user]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end">
            {isOpen && (
                <Card className="mb-4 w-80 sm:w-96 shadow-2xl border-primary/20 backdrop-blur-md bg-background/95 glass animate-in slide-in-from-bottom-5">
                    <CardHeader className="bg-primary text-primary-foreground rounded-t-xl py-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <CardTitle className="text-lg">הרמוניה - עזרה חכמה</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary-foreground hover:bg-primary/80 -me-2"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-80 p-4" ref={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                            }`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'bg-primary/10 text-primary'
                                                }`}
                                        >
                                            {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div
                                            className={`text-sm px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tl-sm'
                                                    : 'bg-muted rounded-tr-sm whitespace-pre-line'
                                                }`}
                                        >
                                            {msg.content}
                                            {msg.actions && msg.actions.length > 0 && (
                                                <div className="flex flex-col gap-2 mt-3 p-2 bg-background/50 rounded-md">
                                                    {msg.actions.map((action, aIdx) => (
                                                        <Button key={aIdx} variant="outline" size="sm" asChild className="w-full text-xs h-8">
                                                            <Link href={action.href} onClick={() => setIsOpen(false)}>
                                                                {action.label}
                                                            </Link>
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-start gap-3 flex-row">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="text-sm px-4 py-3 rounded-2xl bg-muted rounded-tr-sm flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            <span className="text-muted-foreground">מקלידה...</span>
                                        </div>
                                    </div>
                                )}
                                 {messages.length <= 1 && !isLoading && (
                                    <div className="pt-4">
                                        <p className="text-sm font-medium mb-2">הצעות:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {suggestedQuestions.map(q => (
                                                <Button key={q} variant="outline" size="sm" className="h-auto text-wrap justify-start" onClick={() => handleSend(q)}>
                                                    {q}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 border-t bg-card rounded-b-xl">
                        <div className="flex w-full items-center gap-2">
                            <Input
                                placeholder="שאל אותי משהו..."
                                value={inputData}
                                onChange={(e) => setInputData(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-background"
                                dir="auto"
                                disabled={isLoading}
                            />
                            <Button size="icon" onClick={() => handleSend()} disabled={isLoading || !inputData.trim()} className="shrink-0 rounded-full">
                                <Send className="w-4 h-4 rtl:-scale-x-100" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            {/* Primary Floating Action Button */}
            <Button
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl transition-transform duration-300 hover:scale-110 ${isOpen ? 'rotate-90 bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary text-primary-foreground'}`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </Button>
        </div>
    );
}
