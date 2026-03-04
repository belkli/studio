-- scripts/db/seed.sql
-- Truncate in reverse FK order
TRUNCATE TABLE
  payroll_snapshots,
  master_classes,
  alumni_profiles,
  donation_causes,
  scholarship_applications,
  instrument_rentals,
  forms,
  events,
  lesson_packages,
  lessons,
  teacher_assignments,
  room_blocks,
  rooms,
  branches,
  conservatorium_instruments,
  teacher_profiles,
  student_profiles,
  users,
  conservatoriums
CASCADE;

-- ============================================================
-- CONSERVATORIUMS
-- ============================================================
INSERT INTO conservatoriums (id, name, city, address, phone, email, established_year) VALUES
('00000000-0000-0000-0000-000000000001', '{"he":"קונסרבטוריון הוד השרון - אלומה","en":"Hod HaSharon Municipal Conservatory - Aluma"}', 'הוד השרון', 'שד'' הרצל 12, הוד השרון', '073-3808880', 'office@alumahod.com', 2009),
('00000000-0000-0000-0000-000000000002', '{"he":"קונסרבטוריון רעננה למוזיקה","en":"Raanana Music Conservatory"}', 'רעננה', 'אחוזה 127, רעננה', '09-7705800', 'music@raanana.muni.il', 1975),
('00000000-0000-0000-0000-000000000003', '{"he":"המרכז למוזיקה ירושלים","en":"Jerusalem Music Center"}', 'ירושלים', 'דרך בית לחם 5, ירושלים', '02-6719666', 'info@jmc.org.il', 1960);

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, last_name, national_id, phone) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@alumahod.com', 'CONSERVATORIUM_ADMIN', 'יעל', 'פלוסניארו', '012345678', '050-1111111'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'admin@raanana.muni.il', 'CONSERVATORIUM_ADMIN', 'דנה', 'לוי', '023456789', '052-2222222'),
('10000000-0000-0000-0000-000000000003', NULL, 'site@harmonia.co.il', 'SITE_ADMIN', 'שי', 'ישראלי', '034567890', '054-0000000'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'miriam.cohen@alumahod.com', 'TEACHER', 'מרים', 'כהן', '111111111', '050-3333333'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'david.hamelech@alumahod.com', 'TEACHER', 'דוד', 'המלך', '222222222', '050-4444444'),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'sara.levi@alumahod.com', 'TEACHER', 'שרה', 'לוי', '333333333', '050-5555555'),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'roni.levi@gmail.com', 'PARENT', 'רוני', 'לוי', '666666661', '050-1234567'),
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'dana.cohen@gmail.com', 'PARENT', 'דנה', 'כהן', '666666662', '050-2345678'),
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'ariel.levi@student.harmonia.co.il', 'STUDENT_UNDER_13', 'אריאל', 'לוי', '777777771', NULL),
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'tamar.cohen@student.harmonia.co.il', 'STUDENT_UNDER_13', 'תמר', 'כהן', '777777772', NULL),
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'yoni.bar@student.harmonia.co.il', 'STUDENT_OVER_13', 'יוני', 'בר', '777777773', '052-9876543'),
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', 'alumni@jmc.org.il', 'STUDENT_OVER_13', 'תום', 'אביטל', '999999991', '050-9999991');

INSERT INTO teacher_profiles (user_id, instruments, bio) VALUES
('10000000-0000-0000-0000-000000000004', '{"piano"}', '{"he":"פסנתרנית ומורה עם ניסיון של 20 שנה","en":"Experienced piano teacher with 20 years experience"}'),
('10000000-0000-0000-0000-000000000005', '{"violin","viola"}', '{"he":"כנר ומורה ותיק","en":"Senior violin and viola teacher"}'),
('10000000-0000-0000-0000-000000000006', '{"flute","recorder"}', '{"he":"מורה לחליל וסולפז''","en":"Flute and recorder teacher"}');

INSERT INTO student_profiles (user_id, parent_id, grade, school_name) VALUES
('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000007', '5', 'בית ספר דרכא הוד השרון'),
('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000008', '7', 'חטיבת ביאליק'),
('10000000-0000-0000-0000-000000000011', NULL, '10', 'תיכון הוד השרון');

-- ============================================================
-- INSTRUMENTS, BRANCHES, ROOMS
-- ============================================================
INSERT INTO conservatorium_instruments (id, conservatorium_id, names, available_for_registration, available_for_rental) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"he":"פסנתר","en":"Piano"}', TRUE, TRUE),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '{"he":"כינור","en":"Violin"}', TRUE, TRUE),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '{"he":"חליל","en":"Flute"}', TRUE, FALSE),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '{"he":"גיטרה","en":"Guitar"}', TRUE, TRUE);

INSERT INTO branches (id, conservatorium_id, name, address) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'סניף מרכזי', 'שד'' הרצל 12, הוד השרון'),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'סניף גני הדר', 'הנרקיס 5, גני הדר');

INSERT INTO rooms (id, conservatorium_id, branch_id, name, capacity, instrument_equipment) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'חדר פסנתר 1', 2, '[{"instrumentId":"piano","quantity":1,"notes":"Steinway grand"}]'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'חדר כינור', 2, '[{"instrumentId":"violin","quantity":2}]');

-- ============================================================
-- LESSONS, PACKAGES, EVENTS
-- ============================================================
INSERT INTO lesson_packages (id, conservatorium_id, names, type, lesson_count, duration_minutes, price_ils, instruments) VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"he":"חבילת חודשית","en":"Monthly Package"}', 'monthly', 4, 45, 780.00, '{"piano","violin"}');

INSERT INTO lessons (id, conservatorium_id, student_id, teacher_id, room_id, instrument_id, scheduled_at, duration_minutes, status) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-03-02 16:00:00+02', 45, 'completed'),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '2026-03-04 17:00:00+02', 45, 'scheduled'),
('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000006', NULL, '20000000-0000-0000-0000-000000000003', '2026-03-06 15:30:00+02', 45, 'scheduled'),
('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-03-09 16:00:00+02', 45, 'scheduled');

INSERT INTO events (id, conservatorium_id, title, event_date, event_time, is_free, status) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"he":"קונצרט אביב 2026","en":"Spring Concert 2026"}', '2026-04-15', '18:30', TRUE, 'published'),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"he":"יום פתוח בקונסרבטוריון","en":"Open Day at the Conservatory"}', '2026-03-20', '10:00', TRUE, 'published');

-- ============================================================
-- FORMS / APPROVALS
-- ============================================================
INSERT INTO forms (id, conservatorium_id, type, student_id, submitted_by_user_id, form_data, status, required_approver_role) VALUES
('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'recital_form', '10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000007', '{"studentName":"אריאל לוי","instrument":"כינור","teacher":"מרים כהן"}', 'PENDING', 'CONSERVATORIUM_ADMIN'),
('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'recital_form', '10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000008', '{"studentName":"תמר כהן","instrument":"פסנתר","teacher":"דוד המלך"}', 'REVISION_REQUIRED', 'CONSERVATORIUM_ADMIN'),
('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'exam_form', NULL, '10000000-0000-0000-0000-000000000002', '{"notes":"Awaiting documents"}', 'PENDING', 'CONSERVATORIUM_ADMIN');

-- ============================================================
-- RENTALS, SCHOLARSHIPS, DONATIONS
-- ============================================================
INSERT INTO instrument_rentals (
  id, conservatorium_id, instrument_name, student_id, parent_id, rental_model, deposit_amount_ils,
  monthly_fee_ils, start_date, expected_return_date, status, notes
) VALUES
('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Violin 3/4', '10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000007', 'monthly', 450.00, 120.00, '2026-02-01', '2026-08-01', 'pending_signature', 'Starter violin');

INSERT INTO scholarship_applications (id, conservatorium_id, student_id, amount_ils, reason, status, approved_by) VALUES
('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 1200.00, 'Family hardship', 'PENDING', NULL),
('91000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 900.00, 'Outstanding performance', 'APPROVED', '10000000-0000-0000-0000-000000000001');

INSERT INTO donation_causes (id, conservatorium_id, names, descriptions, category, priority, target_amount_ils, raised_amount_ils) VALUES
('92000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"he":"קרן מלגות","en":"Scholarship Fund"}', '{"he":"סיוע לתלמידים מצטיינים","en":"Support for gifted students"}', 'scholarship', 1, 250000.00, 74000.00);

-- ============================================================
-- ALUMNI, MASTER CLASSES, PAYROLL
-- ============================================================
INSERT INTO alumni_profiles (
  user_id, conservatorium_id, graduation_year, primary_instrument, current_occupation,
  bio, is_public, achievements, available_for_master_classes
) VALUES
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', 2021, 'Piano', 'Performer',
 '{"he":"בוגר המרכז למוזיקה ירושלים","en":"Jerusalem Music Center graduate"}', TRUE, '{"Prize winner"}', TRUE);

INSERT INTO master_classes (
  id, conservatorium_id, title, description, instructor_id, instrument, max_participants,
  event_date, start_time, duration_minutes, location, price_ils, status
) VALUES
('93000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"he":"כיתת אמן לפסנתר","en":"Piano Masterclass"}',
 '{"he":"עבודה על רפרטואר מתקדם","en":"Advanced repertoire workshop"}', '10000000-0000-0000-0000-000000000004', 'Piano', 18,
 '2026-03-25', '19:00', 120, 'Main Hall', 180.00, 'published');

INSERT INTO payroll_snapshots (
  id, conservatorium_id, teacher_id, period_year, period_month, total_minutes,
  lesson_count, absent_count, makeup_count, notes
) VALUES
('94000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 2026, 3, 720, 16, 1, 2, 'March payroll ready'),
('94000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 2026, 3, 645, 14, 0, 1, 'March payroll ready');
