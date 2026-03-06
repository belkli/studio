'use client';

import { useAuth } from '@/hooks/use-auth';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, MessageSquare, PenSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageThread, User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale, useTranslations } from 'next-intl';

export function MessagingInterface() {
  const t = useTranslations('MessagesPage');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { user, users, messageThreads, addMessage, createMessageThread } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getMessageableUsers = useMemo(() => {
    if (!user) return [] as User[];

    if (user.role === 'site_admin') {
      return users.filter((candidate) => candidate.id !== user.id);
    }

    if (user.role === 'conservatorium_admin' || user.role === 'delegated_admin') {
      return users.filter((candidate) => candidate.id !== user.id && candidate.conservatoriumId === user.conservatoriumId);
    }

    if (user.role === 'teacher') {
      return users.filter((candidate) => candidate.id !== user.id && candidate.conservatoriumId === user.conservatoriumId);
    }

    if (user.role === 'parent') {
      const childIds = new Set(user.childIds || []);
      return users.filter(
        (candidate) =>
          candidate.id !== user.id &&
          (childIds.has(candidate.id) || (candidate.role === 'teacher' && candidate.conservatoriumId === user.conservatoriumId))
      );
    }

    if (user.role === 'student') {
      return users.filter((candidate) => candidate.role === 'teacher' && candidate.conservatoriumId === user.conservatoriumId);
    }

    return [] as User[];
  }, [user, users]);

  const threads = useMemo(() => {
    if (!user) return [];
    return messageThreads
      .filter((thread) => thread.participants.includes(user.id))
      .sort((a, b) => {
        const aDate = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].sentAt).getTime() : 0;
        const bDate = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].sentAt).getTime() : 0;
        return bDate - aDate;
      });
  }, [user, messageThreads]);

  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [selectedThreadId, threads]);

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedThreadId), [threads, selectedThreadId]);

  const roleLabels: Record<string, string> = {
    site_admin: t('roles.site_admin'),
    conservatorium_admin: t('roles.conservatorium_admin'),
    delegated_admin: t('roles.delegated_admin'),
    teacher: t('roles.teacher'),
    parent: t('roles.parent'),
    student: t('roles.student'),
  };

  const recipientOptions = useMemo(
    () => getMessageableUsers
      .map((candidate) => ({
        value: candidate.id,
        label: `${candidate.name} ? ${roleLabels[candidate.role] || candidate.role}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale)),
    [getMessageableUsers, locale, roleLabels]
  );

  if (!user) return null;

  const getOtherParticipant = (thread: MessageThread): User | undefined => {
    const otherId = thread.participants.find((participantId) => participantId !== user.id);
    return users.find((candidate) => candidate.id === otherId);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedThreadId) {
      addMessage(selectedThreadId, user.id, newMessage);
      setNewMessage('');
    }
  };

  const sendNewMessage = () => {
    if (!recipientId || !composeMessage.trim()) return;
    const threadId = createMessageThread([user.id, recipientId], { senderId: user.id, body: composeMessage.trim() });
    setSelectedThreadId(threadId);
    setShowNewMessage(false);
    setRecipientId('');
    setComposeMessage('');
  };

  const createGroup = () => {
    const members = Array.from(new Set([user.id, ...groupMembers]));
    if (members.length < 3) return;
    const introMessage = groupName.trim() ? `${t('groupCreatedPrefix')}: ${groupName.trim()}` : t('groupCreatedPrefix');
    const threadId = createMessageThread(members, { senderId: user.id, body: introMessage });
    setSelectedThreadId(threadId);
    setShowNewGroup(false);
    setGroupName('');
    setGroupMembers([]);
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button onClick={() => setShowNewMessage(true)}>
            <PenSquare className="me-2 h-4 w-4" />
            {t('newMessage')}
          </Button>
          {user.role === 'teacher' && (
            <Button variant="outline" onClick={() => setShowNewGroup(true)}>
              <Users className="me-2 h-4 w-4" />
              {t('newGroup')}
            </Button>
          )}
        </div>
      </div>

      {threads.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold">{t('noMessages')}</h3>
          <p className="mb-4 text-muted-foreground">{t('noMessagesHint')}</p>
          <Button onClick={() => setShowNewMessage(true)}>{t('startConversation')}</Button>
        </Card>
      ) : (
        <Card className="flex h-[calc(80vh)]">
          <div className="w-1/3 border-e">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {threads.map((thread) => {
                  const otherUser = getOtherParticipant(thread);
                  const lastMessage = thread.messages[thread.messages.length - 1];
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md p-2 text-start hover:bg-muted',
                        selectedThreadId === thread.id && 'bg-muted'
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser?.avatarUrl} />
                        <AvatarFallback>{otherUser?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <p className="truncate font-semibold">{otherUser?.name || t('groupConversation')}</p>
                        <p className="truncate text-xs text-muted-foreground">{lastMessage?.body || t('emptyThread')}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-1 flex-col">
            {selectedThread ? (
              <>
                <div className="flex items-center gap-3 border-b p-3">
                  <Avatar>
                    <AvatarImage src={getOtherParticipant(selectedThread)?.avatarUrl} />
                    <AvatarFallback>{getOtherParticipant(selectedThread)?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{getOtherParticipant(selectedThread)?.name || t('groupConversation')}</p>
                </div>
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {selectedThread.messages.map((message, index) => (
                      <div key={index} className={cn('flex items-end gap-2', message.senderId === user.id ? 'justify-end' : 'justify-start')}>
                        {message.senderId !== user.id && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getOtherParticipant(selectedThread)?.avatarUrl} />
                            <AvatarFallback>{getOtherParticipant(selectedThread)?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn('max-w-xs rounded-lg p-3 lg:max-w-md', message.senderId === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                          <p className="text-sm">{message.body}</p>
                          <p className="mt-1 text-xs opacity-70 text-start">{new Date(message.sentAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {message.senderId === user.id && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex items-center gap-2 border-t p-4">
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
                  <Button size="icon" onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled><Paperclip className="h-4 w-4" /></Button>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">{t('selectConversation')}</div>
            )}
          </div>
        </Card>
      )}

      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('composeTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('to')}</p>
              <Combobox
                options={recipientOptions}
                selectedValue={recipientId}
                onSelectedValueChange={setRecipientId}
                placeholder={t('selectRecipient')}
                searchPlaceholder={t('searchRecipients')}
                notFoundMessage={t('noRecipientsFound')}
              />
            </div>
            <Textarea
              placeholder={t('messagePlaceholder')}
              value={composeMessage}
              onChange={(e) => setComposeMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button onClick={sendNewMessage} disabled={!recipientId || !composeMessage.trim()}>{t('send')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('createGroup')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder={t('groupName')} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('addMembers')}</p>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                {getMessageableUsers.map((candidate) => {
                  const checked = groupMembers.includes(candidate.id);
                  return (
                    <label key={candidate.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setGroupMembers((prev) => [...prev, candidate.id]);
                          else setGroupMembers((prev) => prev.filter((id) => id !== candidate.id));
                        }}
                      />
                      <span>{candidate.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createGroup} disabled={groupMembers.length < 2}>{t('create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
