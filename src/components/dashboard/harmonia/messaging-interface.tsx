'use client';

import { useAuth } from '@/hooks/use-auth';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageThread, User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';

export function MessagingInterface() {
  const t = useTranslations('MessagesPage');
  const { user, users, mockMessageThreads, addMessage } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const threads = useMemo(() => {
    if (!user) return [];
    return mockMessageThreads
      .filter(thread => thread.participants.includes(user.id))
      .sort((a, b) => new Date(b.messages[b.messages.length - 1].sentAt).getTime() - new Date(a.messages[a.messages.length - 1].sentAt).getTime());
  }, [user, mockMessageThreads]);

  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to get the viewport. The component should expose this ref.
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [selectedThreadId, threads]);

  const selectedThread = useMemo(() => {
    return threads.find(t => t.id === selectedThreadId);
  }, [threads, selectedThreadId]);

  if (!user) return null;

  const getOtherParticipant = (thread: MessageThread): User | undefined => {
    const otherId = thread.participants.find(pId => pId !== user.id);
    return users.find(u => u.id === otherId);
  };
  
  const handleSendMessage = () => {
      if(newMessage.trim() && selectedThreadId) {
          addMessage(selectedThreadId, user.id, newMessage);
          setNewMessage('');
      }
  }

  return (
    <Card className="h-[calc(80vh)] flex">
      <div className="w-1/3 border-s">
        <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
            {threads.map(thread => {
              const otherUser = getOtherParticipant(thread);
              const lastMessage = thread.messages[thread.messages.length - 1];
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={cn(
                    "w-full text-right flex items-center gap-3 p-2 rounded-md hover:bg-muted",
                    selectedThreadId === thread.id && "bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser?.avatarUrl} />
                    <AvatarFallback>{otherUser?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="font-semibold truncate">{otherUser?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lastMessage?.body}</p>
                  </div>
                </button>
              );
            })}
            </div>
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedThread && getOtherParticipant(selectedThread) ? (
          <>
            <div className="p-3 border-b flex items-center gap-3">
              <Avatar>
                <AvatarImage src={getOtherParticipant(selectedThread)?.avatarUrl} />
                <AvatarFallback>{getOtherParticipant(selectedThread)?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{getOtherParticipant(selectedThread)?.name}</p>
            </div>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {selectedThread.messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-end gap-2",
                      message.senderId === user.id ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.senderId !== user.id && (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={getOtherParticipant(selectedThread)?.avatarUrl} />
                            <AvatarFallback>{getOtherParticipant(selectedThread)?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                      className={cn(
                        "p-3 rounded-lg max-w-xs lg:max-w-md",
                        message.senderId === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{message.body}</p>
                       <p className="text-xs opacity-70 mt-1 text-right">{new Date(message.sentAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                     {message.senderId === user.id && user && (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t flex items-center gap-2">
              <Textarea
                placeholder={t('typeMessage')}
                className="flex-1"
                rows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
               <Button size="icon" variant="ghost" disabled>
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t('selectConversation')}
          </div>
        )}
      </div>
    </Card>
  );
}
