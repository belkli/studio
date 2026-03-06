\encoding UTF8

-- ============================================================
-- scripts/db/seed-i18n-demo.sql
-- Localized seed data for production demos
-- Covers all 4 locales: he, en, ar, ru
-- Designed for Israeli music conservatorium context
-- ============================================================

-- ============================================================
-- DEMO CONSERVATORIUMS (2)
-- ============================================================
INSERT INTO conservatoriums (id, name, city, city_i18n, address, address_i18n, phone, email, website_url, logo_url, description)
VALUES
(
  'demo0000-0000-0000-0000-000000000001',
  '{"he":"בית ספר למוזיקה תל אביב","en":"Tel Aviv Music School","ar":"مدرسة تل أبيب للموسيقى","ru":"Музыкальная школа Тель-Авива"}',
  'תל אביב',
  '{"he":"תל אביב","en":"Tel Aviv","ar":"تل أبيب","ru":"Тель-Авив"}',
  'שדרות רוטשילד 45, תל אביב',
  '{"he":"שדרות רוטשילד 45, תל אביב","en":"45 Rothschild Blvd, Tel Aviv","ar":"شارع روتشيلد 45، تل أبيب","ru":"бульвар Ротшильд 45, Тель-Авив"}',
  '03-5551234',
  'info@tlv-music.co.il',
  'https://tlv-music.co.il',
  NULL,
  '{"sourceId":"demo1","about":{"he":"בית ספר למוזיקה עירוני מוביל בתל אביב, מציע לימודי כלי נגינה ותיאוריה מוזיקלית לילדים ומבוגרים מגיל 5 ועד 18. 15 מחלקות, 40 מורים, 800 תלמידים.","en":"Leading municipal music school in Tel Aviv, offering instrumental and music theory education for children and adults ages 5-18. 15 departments, 40 teachers, 800 students.","ar":"مدرسة موسيقية بلدية رائدة في تل أبيب، تقدم دروس آلات موسيقية ونظرية موسيقية للأطفال والكبار من سن 5 إلى 18. 15 قسماً، 40 معلماً، 800 طالب.","ru":"Ведущая муниципальная музыкальная школа в Тель-Авиве, предлагающая обучение игре на инструментах и теории музыки для детей и взрослых от 5 до 18 лет. 15 отделений, 40 преподавателей, 800 учеников."}}'
),
(
  'demo0000-0000-0000-0000-000000000002',
  '{"he":"קונסרבטוריון ירושלים","en":"Jerusalem Conservatory","ar":"معهد القدس الموسيقي","ru":"Иерусалимская консерватория"}',
  'ירושלים',
  '{"he":"ירושלים","en":"Jerusalem","ar":"القدس","ru":"Иерусалим"}',
  'רחוב בצלאל 22, ירושלים',
  '{"he":"רחוב בצלאל 22, ירושלים","en":"22 Bezalel St, Jerusalem","ar":"شارع بتسلئيل 22، القدس","ru":"ул. Бецалель 22, Иерусалим"}',
  '02-6221234',
  'info@jlm-conservatory.co.il',
  'https://jlm-conservatory.co.il',
  NULL,
  '{"sourceId":"demo2","about":{"he":"קונסרבטוריון ירושלים נוסד בשנת 1958 ומהווה מוסד חינוך מוסיקלי מוביל בבירה. מציע מסלולים קלאסיים, מזרחיים ומודרניים.","en":"Founded in 1958, the Jerusalem Conservatory is a leading music education institution in the capital. Offers classical, Middle Eastern, and modern music tracks.","ar":"تأسس معهد القدس الموسيقي عام 1958 وهو مؤسسة تعليمية موسيقية رائدة في العاصمة. يقدم مسارات كلاسيكية وشرقية وحديثة.","ru":"Основана в 1958 году, Иерусалимская консерватория является ведущим учреждением музыкального образования в столице. Предлагает классическое, ближневосточное и современное направления."}}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  city_i18n = EXCLUDED.city_i18n,
  address = EXCLUDED.address,
  address_i18n = EXCLUDED.address_i18n,
  description = EXCLUDED.description;


-- ============================================================
-- LOCALIZED INSTRUMENT CATALOG (overwrite English-only defaults)
-- ============================================================
UPDATE instrument_catalog SET names = '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}' WHERE id = 'piano';
UPDATE instrument_catalog SET names = '{"he":"כינור","en":"Violin","ar":"كمان","ru":"Скрипка"}' WHERE id = 'violin';
UPDATE instrument_catalog SET names = '{"he":"ויולה","en":"Viola","ar":"فيولا","ru":"Альт"}' WHERE id = 'viola';
UPDATE instrument_catalog SET names = '{"he":"צ''לו","en":"Cello","ar":"تشيلو","ru":"Виолончель"}' WHERE id = 'cello';
UPDATE instrument_catalog SET names = '{"he":"חליל","en":"Flute","ar":"فلوت","ru":"Флейта"}' WHERE id = 'flute';
UPDATE instrument_catalog SET names = '{"he":"קלרינט","en":"Clarinet","ar":"كلارينيت","ru":"Кларнет"}' WHERE id = 'clarinet';
UPDATE instrument_catalog SET names = '{"he":"סקסופון","en":"Saxophone","ar":"ساكسفون","ru":"Саксофон"}' WHERE id = 'saxophone';
UPDATE instrument_catalog SET names = '{"he":"חצוצרה","en":"Trumpet","ar":"بوق","ru":"Труба"}' WHERE id = 'trumpet';
UPDATE instrument_catalog SET names = '{"he":"טרומבון","en":"Trombone","ar":"ترومبون","ru":"Тромбон"}' WHERE id = 'trombone';
UPDATE instrument_catalog SET names = '{"he":"קרן יער","en":"French Horn","ar":"الهورن الفرنسي","ru":"Валторна"}' WHERE id = 'french_horn';
UPDATE instrument_catalog SET names = '{"he":"אבוב","en":"Oboe","ar":"أوبوا","ru":"Гобой"}' WHERE id = 'oboe';
UPDATE instrument_catalog SET names = '{"he":"גיטרה","en":"Guitar","ar":"جيتار","ru":"Гитара"}' WHERE id = 'guitar';
UPDATE instrument_catalog SET names = '{"he":"קונטרבס","en":"Double Bass","ar":"كونتراباص","ru":"Контрабас"}' WHERE id = 'double_bass';
UPDATE instrument_catalog SET names = '{"he":"תופים","en":"Drums","ar":"طبول","ru":"Ударные"}' WHERE id = 'drums';
UPDATE instrument_catalog SET names = '{"he":"זמרה","en":"Voice","ar":"غناء","ru":"Вокал"}' WHERE id = 'voice';
UPDATE instrument_catalog SET names = '{"he":"קומפוזיציה","en":"Composition","ar":"تأليف","ru":"Композиция"}' WHERE id = 'composition';
UPDATE instrument_catalog SET names = '{"he":"ליווי","en":"Accompaniment","ar":"مرافقة","ru":"Аккомпанемент"}' WHERE id = 'accompaniment';
UPDATE instrument_catalog SET names = '{"he":"מוזיקה כללית","en":"General Music","ar":"موسيقى عامة","ru":"Общая музыка"}' WHERE id = 'general_music';


-- ============================================================
-- DEMO USERS: ADMIN
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, phone, is_active)
VALUES
-- Admin TLV
(
  'demo0000-1000-0000-0000-000000000001',
  'demo0000-0000-0000-0000-000000000001',
  'admin@tlv-music.co.il',
  'CONSERVATORIUM_ADMIN',
  'דוד',
  '{"he":"דוד","en":"David","ar":"داود","ru":"Давид"}',
  'ישראלי',
  '{"he":"ישראלי","en":"Israeli","ar":"إسرائيلي","ru":"Исраэли"}',
  '050-1112233',
  TRUE
),
-- Admin Jerusalem
(
  'demo0000-1000-0000-0000-000000000002',
  'demo0000-0000-0000-0000-000000000002',
  'admin@jlm-conservatory.co.il',
  'CONSERVATORIUM_ADMIN',
  'שרה',
  '{"he":"שרה","en":"Sarah","ar":"سارة","ru":"Сара"}',
  'מזרחי',
  '{"he":"מזרחי","en":"Mizrachi","ar":"مزراحي","ru":"Мизрахи"}',
  '050-2223344',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n;


-- ============================================================
-- DEMO USERS: HEBREW-SPEAKING TEACHERS
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, phone, is_active)
VALUES
(
  'demo0000-2000-0000-0000-000000000001',
  'demo0000-0000-0000-0000-000000000001',
  'noa.cohen@tlv-music.co.il',
  'TEACHER',
  'נועה',
  '{"he":"נועה","en":"Noa","ar":"نوعا","ru":"Ноа"}',
  'כהן',
  '{"he":"כהן","en":"Cohen","ar":"كوهين","ru":"Коэн"}',
  '052-3334455',
  TRUE
),
(
  'demo0000-2000-0000-0000-000000000002',
  'demo0000-0000-0000-0000-000000000001',
  'yosef.levi@tlv-music.co.il',
  'TEACHER',
  'יוסף',
  '{"he":"יוסף","en":"Yosef","ar":"يوسف","ru":"Иосиф"}',
  'לוי',
  '{"he":"לוי","en":"Levi","ar":"ليفي","ru":"Леви"}',
  '052-4445566',
  TRUE
),
(
  'demo0000-2000-0000-0000-000000000003',
  'demo0000-0000-0000-0000-000000000002',
  'michal.avraham@jlm-conservatory.co.il',
  'TEACHER',
  'מיכל',
  '{"he":"מיכל","en":"Michal","ar":"ميخال","ru":"Михаль"}',
  'אברהם',
  '{"he":"אברהם","en":"Avraham","ar":"إبراهيم","ru":"Авраам"}',
  '052-5556677',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n;


-- ============================================================
-- DEMO USERS: ARABIC-SPEAKING TEACHERS
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, phone, is_active)
VALUES
(
  'demo0000-2000-0000-0000-000000000004',
  'demo0000-0000-0000-0000-000000000002',
  'ahmad.khalil@jlm-conservatory.co.il',
  'TEACHER',
  'אחמד',
  '{"he":"אחמד","en":"Ahmad","ar":"أحمد","ru":"Ахмад"}',
  'חליל',
  '{"he":"חליל","en":"Khalil","ar":"خليل","ru":"Халиль"}',
  '052-6667788',
  TRUE
),
(
  'demo0000-2000-0000-0000-000000000005',
  'demo0000-0000-0000-0000-000000000002',
  'fatima.nasr@jlm-conservatory.co.il',
  'TEACHER',
  'פאטמה',
  '{"he":"פאטמה","en":"Fatima","ar":"فاطمة","ru":"Фатима"}',
  'נסר',
  '{"he":"נסר","en":"Nasr","ar":"نصر","ru":"Наср"}',
  '052-7778899',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n;


-- ============================================================
-- DEMO USERS: RUSSIAN-SPEAKING TEACHER
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, phone, is_active)
VALUES
(
  'demo0000-2000-0000-0000-000000000006',
  'demo0000-0000-0000-0000-000000000001',
  'marina.volkov@tlv-music.co.il',
  'TEACHER',
  'מרינה',
  '{"he":"מרינה","en":"Marina","ar":"مارينا","ru":"Марина"}',
  'וולקוב',
  '{"he":"וולקוב","en":"Volkov","ar":"فولكوف","ru":"Волкова"}',
  '052-8889900',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n;


-- ============================================================
-- DEMO USERS: PARENTS (multilingual)
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, phone, is_active)
VALUES
-- Hebrew-speaking parent
(
  'demo0000-3000-0000-0000-000000000001',
  'demo0000-0000-0000-0000-000000000001',
  'rina.shapira@gmail.com',
  'PARENT',
  'רינה',
  '{"he":"רינה","en":"Rina","ar":"رينا","ru":"Рина"}',
  'שפירא',
  '{"he":"שפירא","en":"Shapira","ar":"شبيرا","ru":"Шапира"}',
  '054-1112233',
  TRUE
),
-- Arabic-speaking parent
(
  'demo0000-3000-0000-0000-000000000002',
  'demo0000-0000-0000-0000-000000000002',
  'layla.hassan@gmail.com',
  'PARENT',
  'לילה',
  '{"he":"לילה","en":"Layla","ar":"ليلى","ru":"Лейла"}',
  'חסן',
  '{"he":"חסן","en":"Hassan","ar":"حسن","ru":"Хасан"}',
  '054-2223344',
  TRUE
),
-- Russian-speaking parent
(
  'demo0000-3000-0000-0000-000000000003',
  'demo0000-0000-0000-0000-000000000001',
  'elena.petrov@gmail.com',
  'PARENT',
  'אלנה',
  '{"he":"אלנה","en":"Elena","ar":"إلينا","ru":"Елена"}',
  'פטרוב',
  '{"he":"פטרוב","en":"Petrov","ar":"بتروف","ru":"Петрова"}',
  '054-3334455',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n;


-- ============================================================
-- DEMO USERS: STUDENTS (multilingual)
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, phone, date_of_birth, is_active)
VALUES
-- Hebrew students
(
  'demo0000-4000-0000-0000-000000000001',
  'demo0000-0000-0000-0000-000000000001',
  'itay.shapira@student.harmonia.co.il',
  'STUDENT_OVER_13',
  'איתי',
  '{"he":"איתי","en":"Itay","ar":"إيتاي","ru":"Итай"}',
  'שפירא',
  '{"he":"שפירא","en":"Shapira","ar":"شبيرا","ru":"Шапира"}',
  NULL,
  '2012-05-15',
  TRUE
),
(
  'demo0000-4000-0000-0000-000000000002',
  'demo0000-0000-0000-0000-000000000001',
  'shira.shapira@student.harmonia.co.il',
  'STUDENT_UNDER_13',
  'שירה',
  '{"he":"שירה","en":"Shira","ar":"شيرا","ru":"Шира"}',
  'שפירא',
  '{"he":"שפירא","en":"Shapira","ar":"شبيرا","ru":"Шапира"}',
  NULL,
  '2016-09-22',
  TRUE
),
-- Arabic student
(
  'demo0000-4000-0000-0000-000000000003',
  'demo0000-0000-0000-0000-000000000002',
  'omar.hassan@student.harmonia.co.il',
  'STUDENT_OVER_13',
  'עומר',
  '{"he":"עומר","en":"Omar","ar":"عمر","ru":"Омар"}',
  'חסן',
  '{"he":"חסן","en":"Hassan","ar":"حسن","ru":"Хасан"}',
  NULL,
  '2011-03-10',
  TRUE
),
(
  'demo0000-4000-0000-0000-000000000004',
  'demo0000-0000-0000-0000-000000000002',
  'yasmin.hassan@student.harmonia.co.il',
  'STUDENT_UNDER_13',
  'יאסמין',
  '{"he":"יאסמין","en":"Yasmin","ar":"ياسمين","ru":"Ясмин"}',
  'חסן',
  '{"he":"חסן","en":"Hassan","ar":"حسن","ru":"Хасан"}',
  NULL,
  '2015-07-08',
  TRUE
),
-- Russian-speaking student
(
  'demo0000-4000-0000-0000-000000000005',
  'demo0000-0000-0000-0000-000000000001',
  'dima.petrov@student.harmonia.co.il',
  'STUDENT_OVER_13',
  'דימה',
  '{"he":"דימה","en":"Dima","ar":"ديما","ru":"Дима"}',
  'פטרוב',
  '{"he":"פטרוב","en":"Petrov","ar":"بتروف","ru":"Петров"}',
  NULL,
  '2010-12-01',
  TRUE
),
-- English-speaking student
(
  'demo0000-4000-0000-0000-000000000006',
  'demo0000-0000-0000-0000-000000000001',
  'emma.goldberg@student.harmonia.co.il',
  'STUDENT_OVER_13',
  'אמה',
  '{"he":"אמה","en":"Emma","ar":"إيما","ru":"Эмма"}',
  'גולדברג',
  '{"he":"גולדברג","en":"Goldberg","ar":"غولدبرغ","ru":"Гольдберг"}',
  NULL,
  '2011-08-18',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n;


-- ============================================================
-- STUDENT PROFILES
-- ============================================================
INSERT INTO student_profiles (user_id, parent_id, grade, school_name, status)
VALUES
('demo0000-4000-0000-0000-000000000001', 'demo0000-3000-0000-0000-000000000001', 'ח', 'בית ספר נורדאו תל אביב', 'active'),
('demo0000-4000-0000-0000-000000000002', 'demo0000-3000-0000-0000-000000000001', 'ד', 'בית ספר ביאליק תל אביב', 'active'),
('demo0000-4000-0000-0000-000000000003', 'demo0000-3000-0000-0000-000000000002', 'ט', 'בית ספר אל-מותנבי', 'active'),
('demo0000-4000-0000-0000-000000000004', 'demo0000-3000-0000-0000-000000000002', 'ה', 'בית ספר אל-מותנבי', 'active'),
('demo0000-4000-0000-0000-000000000005', 'demo0000-3000-0000-0000-000000000003', 'י', 'בית ספר בן גוריון', 'active'),
('demo0000-4000-0000-0000-000000000006', NULL, 'ט', 'Ironi Alef High School', 'active')
ON CONFLICT (user_id) DO UPDATE SET
  grade = EXCLUDED.grade,
  school_name = EXCLUDED.school_name;


-- ============================================================
-- TEACHER PROFILES
-- ============================================================
INSERT INTO teacher_profiles (user_id, bio, instruments, hourly_rate, is_accepting_students)
VALUES
('demo0000-2000-0000-0000-000000000001', '{"he":"מורה לפסנתר עם 12 שנות ניסיון. בוגרת האקדמיה למוזיקה בירושלים.","en":"Piano teacher with 12 years of experience. Graduate of the Jerusalem Academy of Music.","ar":"معلمة بيانو ذات خبرة 12 عاماً. خريجة أكاديمية الموسيقى في القدس.","ru":"Преподаватель фортепиано с 12-летним опытом. Выпускница Иерусалимской академии музыки."}', ARRAY['piano'], 180, TRUE),
('demo0000-2000-0000-0000-000000000002', '{"he":"מורה לכינור וויולה. מוסיקאי בתזמורת הפילהרמונית הישראלית.","en":"Violin and viola teacher. Musician with the Israel Philharmonic Orchestra.","ar":"معلم كمان وفيولا. عازف في الأوركسترا الفلهارمونية الإسرائيلية.","ru":"Преподаватель скрипки и альта. Музыкант Израильского филармонического оркестра."}', ARRAY['violin','viola'], 200, TRUE),
('demo0000-2000-0000-0000-000000000003', '{"he":"מורה לחליל צד וחליל גיתרה. מתמחה בהוראת ילדים צעירים.","en":"Flute and recorder teacher. Specializes in teaching young children.","ar":"معلمة فلوت وريكوردر. متخصصة في تعليم الأطفال الصغار.","ru":"Преподаватель флейты и блокфлейты. Специализируется на обучении маленьких детей."}', ARRAY['flute'], 160, TRUE),
('demo0000-2000-0000-0000-000000000004', '{"he":"מורה לעוד ולקנון. מומחה למוזיקה ערבית קלאסית.","en":"Oud and qanun teacher. Expert in classical Arabic music.","ar":"معلم عود وقانون. خبير في الموسيقى العربية الكلاسيكية.","ru":"Преподаватель уда и кануна. Эксперт по классической арабской музыке."}', ARRAY['guitar'], 170, TRUE),
('demo0000-2000-0000-0000-000000000005', '{"he":"מורה לזמרה ופסנתר. בוגרת קונסרבטוריון מוסקבה.","en":"Voice and piano teacher. Graduate of the Moscow Conservatory.","ar":"معلمة غناء وبيانو. خريجة معهد موسكو الموسيقي.","ru":"Преподаватель вокала и фортепиано. Выпускница Московской консерватории."}', ARRAY['voice','piano'], 190, TRUE),
('demo0000-2000-0000-0000-000000000006', '{"he":"מורה לפסנתר קלאסי ורומנטי. בוגרת קונסרבטוריון סנט פטרסבורג.","en":"Classical and romantic piano teacher. Graduate of the Saint Petersburg Conservatory.","ar":"معلمة بيانو كلاسيكي ورومانسي. خريجة معهد سانت بطرسبرغ.","ru":"Преподаватель классического и романтического фортепиано. Выпускница Санкт-Петербургской консерватории."}', ARRAY['piano'], 210, TRUE)
ON CONFLICT (user_id) DO UPDATE SET
  bio = EXCLUDED.bio,
  instruments = EXCLUDED.instruments,
  hourly_rate = EXCLUDED.hourly_rate;


-- ============================================================
-- DEMO LESSONS
-- ============================================================
INSERT INTO lessons (id, conservatorium_id, student_id, teacher_id, instrument, day_of_week, start_time, end_time, duration_minutes, status, room_id, notes)
VALUES
-- Itay (piano with Noa)
('demo0000-5000-0000-0000-000000000001', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000001', 'demo0000-2000-0000-0000-000000000001', 'piano', 1, '16:00', '16:45', 45, 'SCHEDULED', NULL, '{"he":"תלמיד מצוין, עובד על סונטה של מוצרט","en":"Excellent student, working on Mozart Sonata","ar":"طالب ممتاز، يعمل على سوناتا موتسارت","ru":"Отличный ученик, работает над сонатой Моцарта"}'),
-- Shira (flute with Michal)
('demo0000-5000-0000-0000-000000000002', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000002', 'demo0000-2000-0000-0000-000000000003', 'flute', 3, '15:00', '15:30', 30, 'SCHEDULED', NULL, '{"he":"מתחילה, לומדת טכניקה בסיסית","en":"Beginner, learning basic technique","ar":"مبتدئة، تتعلم التقنيات الأساسية","ru":"Начинающая, изучает базовую технику"}'),
-- Omar (oud with Ahmad)
('demo0000-5000-0000-0000-000000000003', 'demo0000-0000-0000-0000-000000000002', 'demo0000-4000-0000-0000-000000000003', 'demo0000-2000-0000-0000-000000000004', 'guitar', 2, '17:00', '17:45', 45, 'SCHEDULED', NULL, '{"he":"תלמיד מתקדם, עובד על מקאמים","en":"Advanced student, working on maqams","ar":"طالب متقدم، يعمل على المقامات","ru":"Продвинутый ученик, работает над макамами"}'),
-- Yasmin (voice with Fatima)
('demo0000-5000-0000-0000-000000000004', 'demo0000-0000-0000-0000-000000000002', 'demo0000-4000-0000-0000-000000000004', 'demo0000-2000-0000-0000-000000000005', 'voice', 4, '14:00', '14:30', 30, 'SCHEDULED', NULL, '{"he":"תלמידה צעירה עם קול יפה","en":"Young student with a beautiful voice","ar":"طالبة صغيرة ذات صوت جميل","ru":"Юная ученица с красивым голосом"}'),
-- Dima (piano with Marina)
('demo0000-5000-0000-0000-000000000005', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000005', 'demo0000-2000-0000-0000-000000000006', 'piano', 1, '17:00', '18:00', 60, 'SCHEDULED', NULL, '{"he":"תלמיד מוכשר, מתכונן לבחינת דרגה ה","en":"Talented student, preparing for Level 5 exam","ar":"طالب موهوب، يستعد لامتحان المستوى الخامس","ru":"Талантливый ученик, готовится к экзамену 5 уровня"}'),
-- Emma (violin with Yosef)
('demo0000-5000-0000-0000-000000000006', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000006', 'demo0000-2000-0000-0000-000000000002', 'violin', 5, '16:00', '16:45', 45, 'SCHEDULED', NULL, '{"he":"עולה חדשה, מתקדמת יפה","en":"New immigrant, progressing nicely","ar":"مهاجرة جديدة، تتقدم بشكل جيد","ru":"Новая репатриантка, хорошо продвигается"}')
ON CONFLICT (id) DO UPDATE SET
  notes = EXCLUDED.notes;


-- ============================================================
-- DEMO LESSON PACKAGES
-- ============================================================
INSERT INTO lesson_packages (id, conservatorium_id, student_id, instrument, teacher_id, total_lessons, used_lessons, price_per_lesson, status, start_date, end_date)
VALUES
('demo0000-6000-0000-0000-000000000001', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000001', 'piano', 'demo0000-2000-0000-0000-000000000001', 36, 12, 180, 'active', '2025-09-01', '2026-06-30'),
('demo0000-6000-0000-0000-000000000002', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000002', 'flute', 'demo0000-2000-0000-0000-000000000003', 36, 10, 160, 'active', '2025-09-01', '2026-06-30'),
('demo0000-6000-0000-0000-000000000003', 'demo0000-0000-0000-0000-000000000002', 'demo0000-4000-0000-0000-000000000003', 'guitar', 'demo0000-2000-0000-0000-000000000004', 36, 14, 170, 'active', '2025-09-01', '2026-06-30'),
('demo0000-6000-0000-0000-000000000004', 'demo0000-0000-0000-0000-000000000002', 'demo0000-4000-0000-0000-000000000004', 'voice', 'demo0000-2000-0000-0000-000000000005', 36, 8, 190, 'active', '2025-09-01', '2026-06-30'),
('demo0000-6000-0000-0000-000000000005', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000005', 'piano', 'demo0000-2000-0000-0000-000000000006', 36, 16, 210, 'active', '2025-09-01', '2026-06-30'),
('demo0000-6000-0000-0000-000000000006', 'demo0000-0000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000006', 'violin', 'demo0000-2000-0000-0000-000000000002', 36, 11, 200, 'active', '2025-09-01', '2026-06-30')
ON CONFLICT (id) DO UPDATE SET
  used_lessons = EXCLUDED.used_lessons;


-- ============================================================
-- DEMO INVOICES
-- ============================================================
INSERT INTO invoices (id, conservatorium_id, payer_id, student_id, amount, currency, status, due_date, description, created_at)
VALUES
('demo0000-7000-0000-0000-000000000001', 'demo0000-0000-0000-0000-000000000001', 'demo0000-3000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000001', 810, 'ILS', 'PENDING', '2026-03-10', '{"he":"שכ\"ל מרץ 2026 - איתי שפירא - פסנתר","en":"March 2026 tuition - Itay Shapira - Piano","ar":"رسوم مارس 2026 - إيتاي شبيرا - بيانو","ru":"Оплата за март 2026 - Итай Шапира - Фортепиано"}', '2026-02-25'),
('demo0000-7000-0000-0000-000000000002', 'demo0000-0000-0000-0000-000000000001', 'demo0000-3000-0000-0000-000000000001', 'demo0000-4000-0000-0000-000000000002', 640, 'ILS', 'PAID', '2026-02-10', '{"he":"שכ\"ל פברואר 2026 - שירה שפירא - חליל","en":"February 2026 tuition - Shira Shapira - Flute","ar":"رسوم فبراير 2026 - شيرا شبيرا - فلوت","ru":"Оплата за февраль 2026 - Шира Шапира - Флейта"}', '2026-01-25'),
('demo0000-7000-0000-0000-000000000003', 'demo0000-0000-0000-0000-000000000002', 'demo0000-3000-0000-0000-000000000002', 'demo0000-4000-0000-0000-000000000003', 765, 'ILS', 'OVERDUE', '2026-02-10', '{"he":"שכ\"ל פברואר 2026 - עומר חסן - עוד","en":"February 2026 tuition - Omar Hassan - Oud","ar":"رسوم فبراير 2026 - عمر حسن - عود","ru":"Оплата за февраль 2026 - Омар Хасан - Уд"}', '2026-01-25'),
('demo0000-7000-0000-0000-000000000004', 'demo0000-0000-0000-0000-000000000001', 'demo0000-3000-0000-0000-000000000003', 'demo0000-4000-0000-0000-000000000005', 1050, 'ILS', 'PENDING', '2026-03-10', '{"he":"שכ\"ל מרץ 2026 - דימה פטרוב - פסנתר (60 דקות)","en":"March 2026 tuition - Dima Petrov - Piano (60 min)","ar":"رسوم مارس 2026 - ديما بتروف - بيانو (60 دقيقة)","ru":"Оплата за март 2026 - Дима Петров - Фортепиано (60 мин)"}', '2026-02-25')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description;


-- ============================================================
-- DEMO EVENTS
-- ============================================================
INSERT INTO events (id, conservatorium_id, title, description, event_type, start_date, end_date, location, status)
VALUES
(
  'demo0000-8000-0000-0000-000000000001',
  'demo0000-0000-0000-0000-000000000001',
  '{"he":"קונצרט אביב 2026","en":"Spring Concert 2026","ar":"حفل الربيع 2026","ru":"Весенний концерт 2026"}',
  '{"he":"קונצרט שנתי של תלמידי בית הספר למוזיקה תל אביב. כל המשפחות מוזמנות.","en":"Annual concert by Tel Aviv Music School students. All families welcome.","ar":"حفل سنوي لطلاب مدرسة تل أبيب للموسيقى. جميع العائلات مدعوة.","ru":"Ежегодный концерт учеников Музыкальной школы Тель-Авива. Приглашаются все семьи."}',
  'RECITAL',
  '2026-04-15 19:00:00+03',
  '2026-04-15 21:00:00+03',
  '{"he":"אולם התרבות תל אביב","en":"Tel Aviv Cultural Hall","ar":"قاعة الثقافة تل أبيب","ru":"Культурный зал Тель-Авива"}',
  'PUBLISHED'
),
(
  'demo0000-8000-0000-0000-000000000002',
  'demo0000-0000-0000-0000-000000000002',
  '{"he":"ערב מוזיקה ערבית","en":"Arabic Music Evening","ar":"أمسية موسيقى عربية","ru":"Вечер арабской музыки"}',
  '{"he":"ערב מיוחד בהשתתפות תלמידי מחלקת המוזיקה המזרחית.","en":"Special evening featuring students from the Middle Eastern music department.","ar":"أمسية خاصة تضم طلاب قسم الموسيقى الشرقية.","ru":"Специальный вечер с участием учеников отделения ближневосточной музыки."}',
  'RECITAL',
  '2026-05-20 19:30:00+03',
  '2026-05-20 21:30:00+03',
  '{"he":"אולם הקונסרבטוריון, ירושלים","en":"Conservatory Hall, Jerusalem","ar":"قاعة المعهد الموسيقي، القدس","ru":"Зал консерватории, Иерусалим"}',
  'PUBLISHED'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;


-- ============================================================
-- Done
-- ============================================================
-- To run: psql -U harmonia -d harmonia_dev -f scripts/db/seed-i18n-demo.sql
