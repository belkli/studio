'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import type { OpenDayAppointment, User } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

type OpenDaySession = {
  id: string;
  openDayId: string;
  time: string;
  instrument: string;
  teacherId: string;
  roomId?: string;
  maxAttendees: number;
};

type OpenDayRegistration = {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string;
  childName: string;
  childAge: number;
  instrument: string;
  sessionId?: string;
  status: 'pending' | 'confirmed' | 'attended' | 'no_show';
  notes?: string;
};

function appointmentToRegistration(item: OpenDayAppointment): OpenDayRegistration {
  return {
    id: item.id,
    visitorName: item.familyName,
    visitorPhone: item.parentPhone,
    visitorEmail: item.parentEmail,
    childName: item.childName,
    childAge: item.childAge,
    instrument: item.instrumentInterest,
    status: item.status === 'ATTENDED' ? 'attended' : item.status === 'NO_SHOW' ? 'no_show' : 'pending',
  };
}

export function OpenDayAdminDashboard() {
  const { user, users, openDayAppointments, openDayEvents } = useAuth();
  const t = useTranslations('AdminOpenDay');
  const { toast } = useToast();

  const [time, setTime] = useState('');
  const [instrument, setInstrument] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('6');
  const [sessions, setSessions] = useState<OpenDaySession[]>([]);
  const [registrations, setRegistrations] = useState<OpenDayRegistration[]>([]);

  const currentEvent = useMemo(() => {
    if (!user) return null;
    return openDayEvents.find((item) => item.conservatoriumId === user.conservatoriumId && item.isActive) || null;
  }, [openDayEvents, user]);

  useEffect(() => {
    if (!currentEvent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegistrations([]);
      return;
    }
    const filtered = openDayAppointments
      .filter((item) => item.eventId === currentEvent.id)
      .map(appointmentToRegistration);
    setRegistrations(filtered);
  }, [currentEvent, openDayAppointments]);

  const teachers = useMemo(() => {
    if (!user) return [] as User[];
    return users.filter((item) => item.role === 'teacher' && item.approved && item.conservatoriumId === user.conservatoriumId);
  }, [user, users]);

  const sessionsWithDetails = useMemo(() => {
    return sessions.map((session) => {
      const teacher = teachers.find((item) => item.id === session.teacherId);
      const assigned = registrations.filter((item) => item.sessionId === session.id);
      return { session, teacher, assigned };
    });
  }, [registrations, sessions, teachers]);

  const addSession = () => {
    if (!currentEvent || !time || !instrument || !teacherId) {
      toast({ variant: 'destructive', title: t('errors.missingSessionFields') });
      return;
    }

    const next: OpenDaySession = {
      id: `open-day-session-${Date.now()}`,
      openDayId: currentEvent.id,
      time,
      instrument,
      teacherId,
      maxAttendees: Number(maxAttendees) || 1,
    };

    setSessions((prev) => [...prev, next]);
    setTime('');
    setInstrument('');
    setTeacherId('');
    setMaxAttendees('6');
    toast({ title: t('toasts.sessionAdded') });
  };

  const updateRegistration = (id: string, patch: Partial<OpenDayRegistration>) => {
    setRegistrations((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!currentEvent ? (
          <p className="text-sm text-muted-foreground">{t('noActiveEvent')}</p>
        ) : (
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="sessions">{t('sessions')}</TabsTrigger>
              <TabsTrigger value="registrations">{t('registrations')}</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-6 space-y-5">
              <div className="grid gap-3 rounded-md border p-4 md:grid-cols-5">
                <div>
                  <Label htmlFor="open-day-session-time">{t('sessionTime')}</Label>
                  <Input id="open-day-session-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="open-day-session-instrument">{t('sessionInstrument')}</Label>
                  <Input id="open-day-session-instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)} />
                </div>
                <div>
                  <Label>{t('sessionTeacher')}</Label>
                  <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger><SelectValue placeholder={t('sessionTeacher')} /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="open-day-session-capacity">{t('sessionCapacity')}</Label>
                  <Input id="open-day-session-capacity" type="number" min={1} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="button" className="w-full" onClick={addSession}>{t('addSession')}</Button>
                </div>
              </div>

              <div className="space-y-3">
                {sessionsWithDetails.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('noSessions')}</p>
                )}
                {sessionsWithDetails.map(({ session, teacher, assigned }) => (
                  <Card key={session.id}>
                    <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{session.time} - {session.instrument}</p>
                        <p className="text-sm text-muted-foreground">{t('teacherLabel')}: {teacher?.name || t('unknownTeacher')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{assigned.length}/{session.maxAttendees}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="registrations" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('childName')}</TableHead>
                    <TableHead>{t('instrument')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('assignedSession')}</TableHead>
                    <TableHead>{t('notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">{t('noAppointments')}</TableCell>
                    </TableRow>
                  )}
                  {registrations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.childName}</div>
                        <div className="text-xs text-muted-foreground">{item.visitorName}</div>
                      </TableCell>
                      <TableCell>{item.instrument}</TableCell>
                      <TableCell>
                        <Select value={item.status} onValueChange={(value) => updateRegistration(item.id, { status: value as OpenDayRegistration['status'] })}>
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('statuses.pending')}</SelectItem>
                            <SelectItem value="confirmed">{t('statuses.confirmed')}</SelectItem>
                            <SelectItem value="attended">{t('statuses.attended')}</SelectItem>
                            <SelectItem value="no_show">{t('statuses.no_show')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={item.sessionId || 'unassigned'} onValueChange={(value) => updateRegistration(item.id, { sessionId: value === 'unassigned' ? undefined : value })}>
                          <SelectTrigger className="w-44"><SelectValue placeholder={t('selectSession')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                            {sessions.map((session) => (
                              <SelectItem key={session.id} value={session.id}>{session.time} - {session.instrument}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.notes || ''}
                          onChange={(event) => updateRegistration(item.id, { notes: event.target.value })}
                          placeholder={t('notesPlaceholder')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
