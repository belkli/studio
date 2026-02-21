import { BookLessonWizard } from '@/components/dashboard/harmonia/book-lesson-wizard';

export default function BookLessonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הזמנת שיעור חדש</h1>
        <p className="text-muted-foreground">
          בחר כלי, מורה ומועד פנוי כדי לקבוע שיעור חדש מהחבילה שלך.
        </p>
      </div>
      <BookLessonWizard />
    </div>
  );
}
