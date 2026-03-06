export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: (userId: string) => [...queryKeys.auth.all, 'user', userId] as const,
  },

  users: {
    all: ['users'] as const,
    list: (conservatoriumId: string) =>
      [...queryKeys.users.all, 'list', conservatoriumId] as const,
    detail: (userId: string) =>
      [...queryKeys.users.all, 'detail', userId] as const,
    pending: (conservatoriumId: string) =>
      [...queryKeys.users.all, 'pending', conservatoriumId] as const,
  },

  lessons: {
    all: ['lessons'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.lessons.all, 'list', filters] as const,
    byTeacher: (teacherId: string) =>
      [...queryKeys.lessons.all, 'teacher', teacherId] as const,
    byStudent: (studentId: string) =>
      [...queryKeys.lessons.all, 'student', studentId] as const,
    byConservatorium: (conservatoriumId: string) =>
      [...queryKeys.lessons.all, 'conservatorium', conservatoriumId] as const,
    detail: (lessonId: string) =>
      [...queryKeys.lessons.all, 'detail', lessonId] as const,
  },

  invoices: {
    all: ['invoices'] as const,
    byPayer: (payerId: string) =>
      [...queryKeys.invoices.all, 'payer', payerId] as const,
    byConservatorium: (conservatoriumId: string) =>
      [...queryKeys.invoices.all, 'conservatorium', conservatoriumId] as const,
  },

  forms: {
    all: ['forms'] as const,
    list: (conservatoriumId: string) =>
      [...queryKeys.forms.all, 'list', conservatoriumId] as const,
    detail: (formId: string) =>
      [...queryKeys.forms.all, 'detail', formId] as const,
    templates: (conservatoriumId: string) =>
      [...queryKeys.forms.all, 'templates', conservatoriumId] as const,
  },

  practice: {
    all: ['practice'] as const,
    logs: (studentId: string) =>
      [...queryKeys.practice.all, 'logs', studentId] as const,
    repertoire: (studentId: string) =>
      [...queryKeys.practice.all, 'repertoire', studentId] as const,
    videos: (studentId: string) =>
      [...queryKeys.practice.all, 'videos', studentId] as const,
  },

  events: {
    all: ['events'] as const,
    list: (conservatoriumId: string) =>
      [...queryKeys.events.all, 'list', conservatoriumId] as const,
    detail: (eventId: string) =>
      [...queryKeys.events.all, 'detail', eventId] as const,
    bookings: (conservatoriumId: string) =>
      [...queryKeys.events.all, 'bookings', conservatoriumId] as const,
  },

  instruments: {
    all: ['instruments'] as const,
    inventory: (conservatoriumId: string) =>
      [...queryKeys.instruments.all, 'inventory', conservatoriumId] as const,
    rentals: (conservatoriumId: string) =>
      [...queryKeys.instruments.all, 'rentals', conservatoriumId] as const,
  },

  messages: {
    all: ['messages'] as const,
    threads: (userId: string) =>
      [...queryKeys.messages.all, 'threads', userId] as const,
    thread: (threadId: string) =>
      [...queryKeys.messages.all, 'thread', threadId] as const,
  },

  config: {
    all: ['config'] as const,
    conservatorium: (conservatoriumId: string) =>
      [...queryKeys.config.all, 'conservatorium', conservatoriumId] as const,
    branches: (conservatoriumId: string) =>
      [...queryKeys.config.all, 'branches', conservatoriumId] as const,
    rooms: (conservatoriumId: string) =>
      [...queryKeys.config.all, 'rooms', conservatoriumId] as const,
    packages: (conservatoriumId: string) =>
      [...queryKeys.config.all, 'packages', conservatoriumId] as const,
  },

  stats: {
    all: ['stats'] as const,
    live: (conservatoriumId: string) =>
      [...queryKeys.stats.all, 'live', conservatoriumId] as const,
  },

  scholarships: {
    all: ['scholarships'] as const,
    list: (conservatoriumId: string) =>
      [...queryKeys.scholarships.all, 'list', conservatoriumId] as const,
  },

  donations: {
    all: ['donations'] as const,
    causes: (conservatoriumId: string) =>
      [...queryKeys.donations.all, 'causes', conservatoriumId] as const,
  },

  alumni: {
    all: ['alumni'] as const,
    list: (conservatoriumId: string) =>
      [...queryKeys.alumni.all, 'list', conservatoriumId] as const,
    masterClasses: (conservatoriumId: string) =>
      [...queryKeys.alumni.all, 'masterClasses', conservatoriumId] as const,
  },

  payroll: {
    all: ['payroll'] as const,
    list: (conservatoriumId: string) =>
      [...queryKeys.payroll.all, 'list', conservatoriumId] as const,
  },

  makeupCredits: {
    all: ['makeupCredits'] as const,
    byStudent: (studentId: string) =>
      [...queryKeys.makeupCredits.all, 'student', studentId] as const,
  },
} as const;
