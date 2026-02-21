'use client';
import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, BrainCircuit, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { processNlpRescheduleRequest } from '@/app/actions';
import type { RescheduleResponse } from '@/ai/flows/reschedule-flow';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format, add, set } from 'date-fns';
import { he } from 'date-fns/locale';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  response?: RescheduleResponse;
}

export function ReschedulingChatWidget() {
  const [messages, setMessages] = useState<Message[]>([{ sender: 'bot', text: 'שלום! אני סוכן ה-AI של הרמוניה. איך אוכל לעזור לך עם מערכת השעות שלך היום? למשל: "אני צריך/ה לבטל את השיעור שלי מחר" או "מתי השיעור הבא שלי?"' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, mockLessons, users, cancelLesson, rescheduleLesson } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Prepare context for the AI flow
    const upcomingLessons = mockLessons.filter(l => l.studentId === user.id && new Date(l.startTime) > new Date());

    // Create some mock availability for the teacher
    const teacher = users.find(u => u.id === upcomingLessons[0]?.teacherId);
    let mockAvailability: string[] = [];
    if (teacher) {
      const today = new Date();
      for (let i = 1; i < 7; i++) { // Next 7 days
        const day = add(today, { days: i });
        teacher.availability?.forEach(block => {
          let currentTime = set(day, { hours: parseInt(block.startTime.split(':')[0]), minutes: 0 });
          const endTime = set(day, { hours: parseInt(block.endTime.split(':')[0]), minutes: 0 });
          while (currentTime < endTime) {
            mockAvailability.push(currentTime.toISOString());
            currentTime = add(currentTime, { minutes: 45 }); // Assuming 45 min slots
          }
        })
      }
    }

    const response = await processNlpRescheduleRequest({
      userId: user.id,
      userMessage: input,
      upcomingLessons: upcomingLessons.map(l => ({ id: l.id, startTime: l.startTime, instrument: l.instrument, teacherId: l.teacherId })),
      teacherAvailability: mockAvailability,
      currentTime: new Date().toISOString(),
    });

    const botMessage: Message = { sender: 'bot', text: response.responseText, response };
    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleConfirmation = (response: RescheduleResponse, accepted: boolean) => {
    if (!response.proposedChange) return;

    const { type, lessonId } = response.proposedChange;

    if (!accepted) {
      const clarificationMessage: Message = { sender: 'bot', text: 'בסדר, הפעולה בוטלה. איך עוד אוכל לעזור?' };
      setMessages(prev => [...prev, clarificationMessage]);
      return;
    }

    if (type === 'CANCEL' && lessonId) {
      cancelLesson(lessonId);
      const lesson = mockLessons.find(l => l.id === lessonId);
      toast({ title: 'השיעור בוטל', description: `שיעור ${lesson?.instrument} בוטל בהצלחה.` });
    } else if (type === 'RESCHEDULE' && lessonId && 'newStartTime' in response.proposedChange) {
      rescheduleLesson(lessonId, response.proposedChange.newStartTime);
      const lesson = mockLessons.find(l => l.id === lessonId);
      toast({ title: 'השיעור נקבע מחדש', description: `שיעור ${lesson?.instrument} נקבע למועד חדש.` });
    }

    const confirmationMessage: Message = { sender: 'bot', text: 'מצוין, עדכנתי את המערכת. האם יש משהו נוסף שאוכל לעזור בו?' };
    setMessages(prev => [...prev, confirmationMessage]);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-full"><BrainCircuit className="h-6 w-6 text-primary" /></div>
        <div>
          <CardTitle>עוזר תיאום שיעורים AI</CardTitle>
          <p className="text-sm text-muted-foreground">נהל את השיעורים שלך באמצעות שיחה פשוטה.</p>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full rounded-md border p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-end gap-2", message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                {message.sender === 'bot' && <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>}
                <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  {message.response?.actionType === 'CONFIRMATION_NEEDED' && (
                    <div className="flex gap-2 mt-3 border-t pt-2 border-muted-foreground/20">
                      <Button size="sm" variant="secondary" className="flex-1 bg-green-200 text-green-800 hover:bg-green-300" onClick={() => handleConfirmation(message.response!, true)}>
                        <Check className="ms-1 h-4 w-4" /> כן, אשר
                      </Button>
                      <Button size="sm" variant="secondary" className="flex-1 bg-red-200 text-red-800 hover:bg-red-300" onClick={() => handleConfirmation(message.response!, false)}>
                        <X className="ms-1 h-4 w-4" /> לא, בטל
                      </Button>
                    </div>
                  )}
                </div>
                {message.sender === 'user' && user && <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="כתוב הודעה..."
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
