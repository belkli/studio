import path from 'path';
import { readTranslationFile, writeTranslationFile, getLocaleDir } from './utils.mjs';

const STATUS_TRANSLATIONS = {
  PENDING: { he: 'ממתין לאישור', en: 'Pending', ru: 'Ожидание', ar: 'قيد الانتظار' },
  APPROVED: { he: 'מאושר', en: 'Approved', ru: 'Одобрено', ar: 'موافق عليه' },
  REJECTED: { he: 'נדחה', en: 'Rejected', ru: 'Отклонено', ar: 'مرفوض' },
  REVISION_REQUIRED: { he: 'נדרש תיקון', en: 'Revision Required', ru: 'Требует правок', ar: 'يتطلب مراجعة' },
  DRAFT: { he: 'טיוטה', en: 'Draft', ru: 'Черновик', ar: 'مسودة' },
  CANCELLED: { he: 'בוטל', en: 'Cancelled', ru: 'Отменено', ar: 'ملغى' },
  COMPLETED: { he: 'הושלם', en: 'Completed', ru: 'Завершено', ar: 'مكتمل' },
};

const LOCALES = ['he', 'en', 'ru', 'ar'];

for (const locale of LOCALES) {
  const filePath = path.join(getLocaleDir(locale), 'common.json');
  let data = {};
  try {
    data = readTranslationFile(filePath);
  } catch (error) {
    // File may not exist yet.
  }

  if (!data.Status || typeof data.Status !== 'object' || Array.isArray(data.Status)) {
    data.Status = {};
  }

  for (const [key, translations] of Object.entries(STATUS_TRANSLATIONS)) {
    data.Status[key] = translations[locale] ?? translations.en;
  }

  writeTranslationFile(filePath, data);
}

console.log('Status keys added to all locales');
