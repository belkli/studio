\encoding UTF8

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
  teacher_ratings,
  teacher_profiles,
  student_profiles,
  users,
  conservatoriums
CASCADE;

-- ============================================================
-- AUTO GENERATED ADMIN DIRECTORY (docs + csv)
-- ============================================================
INSERT INTO instrument_catalog (id, names, family, is_active)
VALUES
('general_music', '{"he":"מוסיקה כללית","en":"General Music","ar":"موسيقى عامة","ru":"Общая музыка"}', 'general', TRUE),
('piano', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}', 'general', TRUE),
('violin', '{"he":"כינור","en":"Violin","ar":"كمان","ru":"Скрипка"}', 'general', TRUE),
('viola', '{"he":"ויולה","en":"Viola","ar":"فيولا","ru":"Альт"}', 'general', TRUE),
('cello', '{"he":"צ''לו","en":"Cello","ar":"تشيلو","ru":"Виолончель"}', 'general', TRUE),
('flute', '{"he":"חליל","en":"Flute","ar":"فلوت","ru":"Флейта"}', 'general', TRUE),
('clarinet', '{"he":"קלרינט","en":"Clarinet","ar":"كلارينيت","ru":"Кларнет"}', 'general', TRUE),
('saxophone', '{"he":"סקסופון","en":"Saxophone","ar":"ساكسوفون","ru":"Саксофон"}', 'general', TRUE),
('trumpet', '{"he":"חצוצרה","en":"Trumpet","ar":"بوق","ru":"Труба"}', 'general', TRUE),
('trombone', '{"he":"טרומבון","en":"Trombone","ar":"ترومبون","ru":"Тромбон"}', 'general', TRUE),
('french_horn', '{"he":"קרן יער","en":"French Horn","ar":"هورن فرنسي","ru":"Валторна"}', 'general', TRUE),
('oboe', '{"he":"אבוב","en":"Oboe","ar":"أوبوا","ru":"Гобой"}', 'general', TRUE),
('guitar', '{"he":"גיטרה","en":"Guitar","ar":"غيتار","ru":"Гитара"}', 'general', TRUE),
('double_bass', '{"he":"קונטרבס","en":"Double Bass","ar":"كونترباس","ru":"Контрабас"}', 'general', TRUE),
('drums', '{"he":"תופים","en":"Drums","ar":"طبول","ru":"Барабаны"}', 'general', TRUE),
('voice', '{"he":"שירה","en":"Voice","ar":"غناء","ru":"Вокал"}', 'general', TRUE),
('composition', '{"he":"קומפוזיציה","en":"Composition","ar":"تأليف موسيقي","ru":"Композиция"}', 'general', TRUE),
('accompaniment', '{"he":"ליווי","en":"Accompaniment","ar":"مرافقة","ru":"Аккомпанемент"}', 'general', TRUE)
ON CONFLICT (id) DO UPDATE SET
  names = EXCLUDED.names,
  family = EXCLUDED.family,
  is_active = EXCLUDED.is_active;

INSERT INTO conservatoriums (id, name, city, city_i18n, address, address_i18n, phone, email, website_url, logo_url, description)
VALUES
('a1000000-0000-0000-0000-000000000001', '{"he":"קונסרבטוריון אור עקיבא","en":"Or Akiva Municipal Conservatory","ar":"يفتاح - جمعية التطوير الاقتصادي أور عقيفا","ru":"Ифтах - Ассоциация экономического развития Ор-Акива"}', 'אור עקיבא', '{"he":"אור עקיבא","en":"Or Akiva","ar":"أور عقيفا","ru":"Ор-Акива"}', 'הקונסרבטוריון העירוני, אור עקיבא', '{"he":"הקונסרבטוריון העירוני, אור עקיבא","en":"Municipal Conservatorium, Or Akiva","ar":"المعهد الموسيقي البلدي، أور عقيفا","ru":"Городская консерватория, Ор-Акива"}', '04-6703991', 'tsahgertner@gmail.com', NULL, NULL, '{"sourceId": 1, "about": {"he": "קונסרבטוריון עירוני בפיקוח משרד החינוך המפעיל תכניות לימוד מוסיקה לתושבי אור עקיבא.", "en": "A municipal conservatory supervised by the Ministry of Education, offering music education programs for Or Akiva residents.", "ar": "كونسرفاتوار بلدي تحت إشراف وزارة التربية والتعليم، يقدم برامج تعليم الموسيقى لسكان أور عكيفا.", "ru": "Муниципальная консерватория под надзором Министерства образования, предлагающая программы музыкального обучения для жителей Ор-Акива."}, "photoUrls": [], "logoUrl": null, "location": {"city": "אור עקיבא", "cityEn": "Or Akiva", "coordinates": {"lat": 32.5027, "lng": 34.9219}}, "translations": {"en": {"name": "Or Akiva Municipal Conservatory", "city": "Or Akiva", "address": "Municipal Conservatorium, Or Akiva", "about": "A municipal conservatory supervised by the Ministry of Education, offering music education programs for Or Akiva residents."}, "ar": {"name": "يفتاح - جمعية التطوير الاقتصادي أور عقيفا", "city": "أور عقيفا", "address": "المعهد الموسيقي البلدي، أور عقيفا", "about": "كونسرفاتوار بلدي تحت إشراف وزارة التربية والتعليم، يقدم برامج تعليم الموسيقى لسكان أور عكيفا."}, "ru": {"name": "Ифтах - Ассоциация экономического развития Ор-Акива", "city": "Ор-Акива", "address": "Городская консерватория, Ор-Акива", "about": "Муниципальная консерватория под надзором Министерства образования, предлагающая программы музыкального обучения для жителей Ор-Акива."}}}'),
('a1000000-0000-0000-0000-000000000002', '{"he":"קונסרבטוריון אילת","en":"Eilat Conservatory","ar":"مركز الموسيقى - البحر الأحمر","ru":"Музыкальный центр Красного моря"}', 'אילת', '{"he":"אילת","en":"Eilat","ar":"إيلات","ru":"Эйлат"}', 'שדרות חטיבת הנגב 36, אילת', '{"he":"שדרות חטיבת הנגב 36, אילת","en":"36 Hativat HaNegev Blvd, Eilat","ar":"شارع حطيفات هنيغف 36، إيلات","ru":"Сдерот Хативат а-Негев 36, Эйлат"}', '08-6377036', 'eilatcons@gmail.com', NULL, NULL, '{"sourceId": 2, "about": {"he": "הקונסרבטוריון העירוני של אילת, מרכז לחינוך מוסיקלי בדרום הארץ.", "en": "The municipal conservatory of Eilat, a center for music education in the south of Israel.", "ar": "الكونسرفاتوار البلدي في إيلات، مركز للتعليم الموسيقي في جنوب البلاد.", "ru": "Муниципальная консерватория Эйлата, центр музыкального образования на юге страны."}, "photoUrls": [], "logoUrl": null, "location": {"city": "אילת", "cityEn": "Eilat", "coordinates": {"lat": 29.5581, "lng": 34.9482}}, "translations": {"en": {"name": "Eilat Conservatory", "city": "Eilat", "address": "36 Hativat HaNegev Blvd, Eilat", "about": "The municipal conservatory of Eilat, a center for music education in the south of Israel."}, "ar": {"name": "مركز الموسيقى - البحر الأحمر", "city": "إيلات", "address": "شارع حطيفات هنيغف 36، إيلات", "about": "الكونسرفاتوار البلدي في إيلات، مركز للتعليم الموسيقي في جنوب البلاد."}, "ru": {"name": "Музыкальный центр Красного моря", "city": "Эйлат", "address": "Сдерот Хативат а-Негев 36, Эйлат", "about": "Муниципальная консерватория Эйлата, центр музыкального образования на юге страны."}}}'),
('a1000000-0000-0000-0000-000000000003', '{"he":"קונסרבטוריון אקדמא אשדוד","en":"Akadma Conservatory Ashdod","ar":"جمعية عامة لتعزيز الثقافة والموسيقى في أشدود","ru":"Общественная ассоциация по развитию культуры и музыки в Ашдоде"}', 'אשדוד', '{"he":"אשדוד","en":"Ashdod","ar":"أشدود","ru":"Ашдод"}', 'דרך ארץ 8, אשדוד', '{"he":"דרך ארץ 8, אשדוד","en":"8 Derech Eretz, Ashdod","ar":"ديرخ إيرتس 8، أشدود","ru":"Дерех Эрец 8, Ашдод"}', '08-8545135', 'yanina.kudlik@gmail.com;akadma66@gmail.com', 'https://www.akadma.co.il/', NULL, '{"sourceId": 3, "about": {"he": "הוקם בשנת 1966, מהקונסרבטוריונים הוותיקים בישראל. מונה כ-10 מחלקות עם מאות תלמידים.", "en": "Founded in 1966, one of the oldest conservatories in Israel. Has about 10 departments with hundreds of students.", "ar": "تأسس عام 1966، من أقدم المعاهد الموسيقية في إسرائيل. يضم حوالي 10 أقسام ومئات الطلاب.", "ru": "Основана в 1966 году, одна из старейших консерваторий Израиля. Насчитывает около 10 отделений с сотнями учеников."}, "photoUrls": [], "logoUrl": null, "location": {"city": "אשדוד", "cityEn": "Ashdod", "coordinates": {"lat": 31.8014, "lng": 34.6461}}, "translations": {"en": {"name": "Akadma Conservatory Ashdod", "city": "Ashdod", "address": "8 Derech Eretz, Ashdod", "about": "Founded in 1966, one of the oldest conservatories in Israel. Has about 10 departments with hundreds of students."}, "ar": {"name": "جمعية عامة لتعزيز الثقافة والموسيقى في أشدود", "city": "أشدود", "address": "ديرخ إيرتس 8، أشدود", "about": "تأسس عام 1966، من أقدم المعاهد الموسيقية في إسرائيل. يضم حوالي 10 أقسام ومئات الطلاب."}, "ru": {"name": "Общественная ассоциация по развитию культуры и музыки в Ашдоде", "city": "Ашдод", "address": "Дерех Эрец 8, Ашдод", "about": "Основана в 1966 году, одна из старейших консерваторий Израиля. Насчитывает около 10 отделений с сотнями учеников."}}}'),
('a1000000-0000-0000-0000-000000000004', '{"he": "קונסרבטוריון אשכול גב מערבי א", "en": "Eshkol West Negev Conservatory A", "ar": "كونسرفاتوار إشكول الجليل الغربي أ", "ru": "Консерватория Эшколь Западная Галилея А"}', 'אשכול גליל מערבי', '{"he":"אשכול גליל מערבי","en":"Eshkol Galil Maaravi","ar":"إشكول الجليل الغربي","ru":"Эшколь Западная Галилея"}', 'הקונסרבטוריון העירוני, מועצה אזורית מטה אשר', '{"he":"הקונסרבטוריון העירוני, מועצה אזורית מטה אשר","en":"Municipal Conservatorium, Eshkol Galil Maaravi","ar":"المعهد الموسيقي البلدي، إشكول الجليل الغربي","ru":"Городская консерватория, Эшколь Западная Галилея"}', NULL, 'music@wegalil.org.il', 'https://www.wegalil.org.il/', NULL, '{"sourceId": 4, "about": {"he": "קונסרבטוריון האגף המוסיקלי של מועצת אשכול.", "en": "Conservatory of the music division of Eshkol Regional Council.", "ar": "كونسرفاتوار القسم الموسيقي لمجلس إشكول الإقليمي.", "ru": "Консерватория музыкального отделения регионального совета Эшколь."}, "photoUrls": [], "logoUrl": null, "location": {"city": "אשכול גליל מערבי", "cityEn": "Eshkol Galil Maaravi", "coordinates": {"lat": 31.35, "lng": 34.55}}, "translations": {"en": {"name": "Eshkol West Negev Conservatory A", "city": "Eshkol Galil Maaravi", "address": "Municipal Conservatorium, Eshkol Galil Maaravi", "about": "Conservatory of the music division of Eshkol Regional Council."}, "ar": {"name": "كونسرفاتوار إشكول الجليل الغربي أ", "city": "إشكول الجليل الغربي", "address": "المعهد الموسيقي البلدي، إشكول الجليل الغربي", "about": "كونسرفاتوار القسم الموسيقي لمجلس إشكول الإقليمي."}, "ru": {"name": "Консерватория Эшколь Западная Галилея А", "city": "Эшколь Западная Галилея", "address": "Городская консерватория, Эшколь Западная Галилея", "about": "Консерватория музыкального отделения регионального совета Эшколь."}}}'),
('a1000000-0000-0000-0000-000000000005', '{"he": "קונסרבטוריון אשכול גב מערבי ב", "en": "Eshkol West Negev Conservatory B", "ar": "كونسرفاتوار إشكول النقب الغربي ب", "ru": "Консерватория Эшколь Западный Негев Б"}', 'אשכול נגב מערבי', '{"he":"אשכול נגב מערבי","en":"Eshkol Negev Maaravi","ar":"إشكول النقب الغربي","ru":"Эшколь Западный Негев"}', 'הקונסרבטוריון העירוני, מועצה אזורית אשכול', '{"he":"הקונסרבטוריון העירוני, מועצה אזורית אשכול","en":"Municipal Conservatorium, Eshkol Negev Maaravi","ar":"المعهد الموسيقي البلدي، إشكول النقب الغربي","ru":"Городская консерватория, Эшколь Западный Негев"}', NULL, 'music@westnegev.org.il', 'https://www.westnegev.org.il/', NULL, '{"sourceId": 5, "about": {"he": "ענף מוסיקלי נוסף של מועצת אשכול.", "en": "An additional music branch of Eshkol Regional Council.", "ar": "فرع موسيقي إضافي لمجلس إشكول الإقليمي.", "ru": "Дополнительный музыкальный филиал регионального совета Эшколь."}, "photoUrls": [], "logoUrl": null, "location": {"city": "אשכול נגב מערבי", "cityEn": "Eshkol Negev Maaravi", "coordinates": {"lat": 31.35, "lng": 34.55}}, "translations": {"en": {"name": "Eshkol West Negev Conservatory B", "city": "Eshkol Negev Maaravi", "address": "Municipal Conservatorium, Eshkol Negev Maaravi", "about": "An additional music branch of Eshkol Regional Council."}, "ar": {"name": "كونسرفاتوار إشكول النقب الغربي ب", "city": "إشكول النقب الغربي", "address": "المعهد الموسيقي البلدي، إشكول النقب الغربي", "about": "فرع موسيقي إضافي لمجلس إشكول الإقليمي."}, "ru": {"name": "Консерватория Эшколь Западный Негев Б", "city": "Эшколь Западный Негев", "address": "Городская консерватория, Эшколь Западный Негев", "about": "Дополнительный музыкальный филиал регионального совета Эшколь."}}}'),
('a1000000-0000-0000-0000-000000000006', '{"he":"קונסרבטוריון אשקלון","en":"Ashkelon Conservatory","ar":"الشركة البلدية للثقافة والشباب والرياضة والترفيه في عسقلان","ru":"Муниципальная компания культуры спорта и отдыха Ашкелона"}', 'אשקלון', '{"he":"אשקלון","en":"Ashkelon","ar":"عسقلان","ru":"Ашкелон"}', 'הסוכנות היהודית 3, אשקלון', '{"he":"הסוכנות היהודית 3, אשקלון","en":"3 HaSochnut HaYehudit, Ashkelon","ar":"الوكالة اليهودية 3، عسقلان","ru":"А-Сохнут А-Ехудит 3, Ашкелон"}', '08-6792330', 'gil-ad@ironitash.org.il', 'https://www.ironitash.org.il/', NULL, '{"sourceId": 6, "about": {"he": "קונסרבטוריון עירוני אשקלון, מציע לימודים על 15 כלי נגינה עם 19 מורים.", "en": "Ashkelon municipal conservatory, offering instruction on 15 instruments with 19 teachers.", "ar": "كونسرفاتوار أشكلون البلدي، يقدم تعليم 15 آلة موسيقية مع 19 معلمًا.", "ru": "Муниципальная консерватория Ашкелона, предлагающая обучение на 15 инструментах с 19 преподавателями."}, "photoUrls": [], "logoUrl": null, "location": {"city": "אשקלון", "cityEn": "Ashkelon", "coordinates": {"lat": 31.6688, "lng": 34.5742}}, "translations": {"en": {"name": "Ashkelon Conservatory", "city": "Ashkelon", "address": "3 HaSochnut HaYehudit, Ashkelon", "about": "Ashkelon municipal conservatory, offering instruction on 15 instruments with 19 teachers."}, "ar": {"name": "الشركة البلدية للثقافة والشباب والرياضة والترفيه في عسقلان", "city": "عسقلان", "address": "الوكالة اليهودية 3، عسقلان", "about": "كونسرفاتوار أشكلون البلدي، يقدم تعليم 15 آلة موسيقية مع 19 معلمًا."}, "ru": {"name": "Муниципальная компания культуры спорта и отдыха Ашкелона", "city": "Ашкелон", "address": "А-Сохнут А-Ехудит 3, Ашкелон", "about": "Муниципальная консерватория Ашкелона, предлагающая обучение на 15 инструментах с 19 преподавателями."}}}'),
('a1000000-0000-0000-0000-000000000007', '{"he":"קונסרבטוריון באר שבע ע\"ש סמואל רובין","en":"Samuel Rubin Conservatory Beer Sheva","ar":"معهد الموسيقى البلدي بئر السبع","ru":"Муниципальная консерватория Беэр-Шевы"}', 'באר שבע', '{"he":"באר שבע","en":"Beer Sheva","ar":"بئر السبع","ru":"Беэр-Шева"}', 'דרך המשחררים 10, באר שבע', '{"he":"דרך המשחררים 10, באר שבע","en":"10 Derech HaMeshachrerim, Beer Sheva","ar":"طريق همشحرريم 10، بئر السبع","ru":"Дерех а-Мешахрерим 10, Беэр-Шева"}', '08-6279606', 'noammal@br7.org.il;shai4199@gmail.com', 'http://www.musicbr7.org.il/', NULL, '{"sourceId": 7, "about": {"he": "נוסד בשנת 1961, אחד הקונסרבטוריונים הוותיקים בנגב. נושא שם הנדיב שמואל רובין.", "en": "Founded in 1961, one of the oldest conservatories in the Negev. Named after benefactor Shmuel Rubin.", "ar": "تأسس عام 1961، من أقدم المعاهد الموسيقية في النقب. يحمل اسم المتبرع شموئيل روبين.", "ru": "Основана в 1961 году, одна из старейших консерваторий Негева. Названа в честь мецената Шмуэля Рубина."}, "photoUrls": [], "logoUrl": null, "location": {"city": "באר שבע", "cityEn": "Beer Sheva", "coordinates": {"lat": 31.253, "lng": 34.7915}}, "translations": {"en": {"name": "Samuel Rubin Conservatory Beer Sheva", "city": "Beer Sheva", "address": "10 Derech HaMeshachrerim, Beer Sheva", "about": "Founded in 1961, one of the oldest conservatories in the Negev. Named after benefactor Shmuel Rubin."}, "ar": {"name": "معهد الموسيقى البلدي بئر السبع", "city": "بئر السبع", "address": "طريق همشحرريم 10، بئر السبع", "about": "تأسس عام 1961، من أقدم المعاهد الموسيقية في النقب. يحمل اسم المتبرع شموئيل روبين."}, "ru": {"name": "Муниципальная консерватория Беэр-Шевы", "city": "Беэр-Шева", "address": "Дерех а-Мешахрерим 10, Беэр-Шева", "about": "Основана в 1961 году, одна из старейших консерваторий Негева. Названа в честь мецената Шмуэля Рубина."}}}'),
('a1000000-0000-0000-0000-000000000008', '{"he":"קונסרבטוריון בית שמש א","en":"Beit Shemesh Conservatory A","ar":"المركز الجماهيري في بيسان على اسم الكتيبة النسائية","ru":"Общинный центр в Бейт-Шеане имени Женской бригады"}', 'בית שאן', '{"he":"בית שאן","en":"Beit She''an","ar":"بيسان","ru":"Бейт-Шеан"}', 'הקונסרבטוריון העירוני, בית שאן', '{"he":"הקונסרבטוריון העירוני, בית שאן","en":"Municipal Conservatorium, Beit She''an","ar":"المعهد الموسيقي البلدي، بيسان","ru":"Городская консерватория, Бейт-Шеан"}', NULL, 'yoelcohenbs@gmail.com', NULL, NULL, '{"sourceId": 8, "about": {"he": "קונסרבטוריון בפיקוח משרד החינוך לתושבי בית שמש.", "en": "A conservatory supervised by the Ministry of Education for Beit Shemesh residents.", "ar": "كونسرفاتوار تحت إشراف وزارة التربية والتعليم لسكان بيت شيمش.", "ru": "Консерватория под надзором Министерства образования для жителей Бейт-Шемеша."}, "photoUrls": [], "logoUrl": null, "location": {"city": "בית שאן", "cityEn": "Beit She''''an", "coordinates": {"lat": 31.7516, "lng": 34.988}}, "translations": {"en": {"name": "Beit Shemesh Conservatory A", "city": "Beit She''''an", "address": "Municipal Conservatorium, Beit She''''an", "about": "A conservatory supervised by the Ministry of Education for Beit Shemesh residents."}, "ar": {"name": "المركز الجماهيري في بيسان على اسم الكتيبة النسائية", "city": "بيسان", "address": "المعهد الموسيقي البلدي، بيسان", "about": "كونسرفاتوار تحت إشراف وزارة التربية والتعليم لسكان بيت شيمش."}, "ru": {"name": "Общинный центр в Бейт-Шеане имени Женской бригады", "city": "Бейт-Шеан", "address": "Городская консерватория, Бейт-Шеан", "about": "Консерватория под надзором Министерства образования для жителей Бейт-Шемеша."}}}'),
('a1000000-0000-0000-0000-000000000009', '{"he":"קונסרבטוריון בית שמש ב","en":"Beit Shemesh Conservatory B","ar":"شبكة المراكز الجماهيرية بيت شيمش","ru":"Сеть общинных центров Бейт-Шемеша"}', 'בית שמש', '{"he":"בית שמש","en":"Beit Shemesh","ar":"بيت شيمش","ru":"Бейт-Шемеш"}', 'התבור 18, בית שמש', '{"he":"התבור 18, בית שמש","en":"18 HaTavor, Beit Shemesh","ar":"طابور 18، بيت شيمش","ru":"Ха-Тавор 18, Бейт-Шемеш"}', NULL, 'kon@BS.matnasim.co.il', 'https://bs.matnasim.co.il/', NULL, '{"sourceId": 9, "about": {"he": "ענף נוסף של מרכז הקהילה בית שמש.", "en": "An additional branch of the Beit Shemesh community center.", "ar": "فرع إضافي لمركز مجتمع بيت شيمش.", "ru": "Дополнительный филиал общинного центра Бейт-Шемеша."}, "photoUrls": [], "logoUrl": null, "location": {"city": "בית שמש", "cityEn": "Beit Shemesh", "coordinates": {"lat": 31.7516, "lng": 34.988}}, "translations": {"en": {"name": "Beit Shemesh Conservatory B", "city": "Beit Shemesh", "address": "18 HaTavor, Beit Shemesh", "about": "An additional branch of the Beit Shemesh community center."}, "ar": {"name": "شبكة المراكز الجماهيرية بيت شيمش", "city": "بيت شيمش", "address": "طابور 18، بيت شيمش", "about": "فرع إضافي لمركز مجتمع بيت شيمش."}, "ru": {"name": "Сеть общинных центров Бейт-Шемеша", "city": "Бейт-Шемеш", "address": "Ха-Тавор 18, Бейт-Шемеш", "about": "Дополнительный филиал общинного центра Бейт-Шемеша."}}}'),
('a1000000-0000-0000-0000-000000000010', '{"he":"קונסרבטוריון בלוט","en":"Blot Conservatory","ar":"المجلس الإقليمي برينر","ru":"Региональный совет Бреннер"}', 'ברנר', '{"he":"ברנר","en":"Brenner","ar":"برينر","ru":"Бреннер"}', 'הקונסרבטוריון העירוני, בני עי"ש', '{"he":"הקונסרבטוריון העירוני, בני עי\"ש","en":"Municipal Conservatorium, Bnei Ayish","ar":"المعهد الموسيقي البلدي، بني عايش","ru":"Городская консерватория, Бней-Аиш"}', NULL, 'shani@brener.org.il', 'https://www.brener.org.il/', NULL, '{"sourceId": 10, "about": {"he": "קונסרבטוריון אזורי.", "en": "A regional conservatory.", "ar": "كونسرفاتوار إقليمي.", "ru": "Региональная консерватория."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ברנר", "cityEn": "Brenner", "coordinates": {"lat": 31.8, "lng": 34.95}}, "translations": {"en": {"name": "Blot Conservatory", "city": "Brenner", "address": "Municipal Conservatorium, Bnei Ayish", "about": "A regional conservatory."}, "ar": {"name": "المجلس الإقليمي برينر", "city": "برينر", "address": "المعهد الموسيقي البلدي، بني عايش", "about": "كونسرفاتوار إقليمي."}, "ru": {"name": "Региональный совет Бреннер", "city": "Бреннер", "address": "Городская консерватория, Бней-Аиш", "about": "Региональная консерватория."}}}'),
('a1000000-0000-0000-0000-000000000011', '{"he":"קונסרבטוריון בת ים","en":"Bat Yam Conservatory","ar":"بلدية بات يام","ru":"Муниципалитет Бат-Яма"}', 'בת ים', '{"he":"בת ים","en":"Bat Yam","ar":"بات يام","ru":"Бат-Ям"}', 'ליבורנו 24, בת ים', '{"he":"ליבורנו 24, בת ים","en":"24 Livorno, Bat Yam","ar":"ليفورنو 24، بات يام","ru":"Ливорно 24, Бат-Ям"}', NULL, 'hila@tarbut-batyam.co.il', 'https://www.tarbut-batyam.co.il/', NULL, '{"sourceId": 11, "about": {"he": "קונסרבטוריון עירוני של בת ים, תחת מרחב התרבות של העיר.", "en": "Bat Yam municipal conservatory, under the city''s cultural center.", "ar": "كونسرفاتوار بات يام البلدي، تحت المركز الثقافي للمدينة.", "ru": "Муниципальная консерватория Бат-Яма, при городском культурном центре."}, "photoUrls": [], "logoUrl": null, "location": {"city": "בת ים", "cityEn": "Bat Yam", "coordinates": {"lat": 32.0239, "lng": 34.7497}}, "translations": {"en": {"name": "Bat Yam Conservatory", "city": "Bat Yam", "address": "24 Livorno, Bat Yam", "about": "Bat Yam municipal conservatory, under the city''s cultural center."}, "ar": {"name": "بلدية بات يام", "city": "بات يام", "address": "ليفورنو 24، بات يام", "about": "كونسرفاتوار بات يام البلدي، تحت المركز الثقافي للمدينة."}, "ru": {"name": "Муниципалитет Бат-Яма", "city": "Бат-Ям", "address": "Ливорно 24, Бат-Ям", "about": "Муниципальная консерватория Бат-Яма, при городском культурном центре."}}}'),
('a1000000-0000-0000-0000-000000000012', '{"he":"קונסרבטוריון גבעתיים","en":"Givatayim Conservatory","ar":"المجتمعية - ثقافة الترفيه والمجتمع في جفعاتايم","ru":"Общинные центры - культура и досуг в Гиватаиме"}', 'גבעתיים', '{"he":"גבעתיים","en":"Givatayim","ar":"جفعاتايم","ru":"Гиватаим"}', 'הקונסרבטוריון העירוני, גבעתיים', '{"he":"הקונסרבטוריון העירוני, גבעתיים","en":"Municipal Conservatorium, Givatayim","ar":"المعهد الموسيقي البلدي، جفعاتايم","ru":"Городская консерватория, Гиватаим"}', '03-7323349', 'omoboe1@gmail.com', 'https://kehilatayim.org.il/62', NULL, '{"sourceId": 12, "about": {"he": "קונסרבטוריון עירוני של גבעתיים, מרכז מוסיקלי חינוכי.", "en": "Givatayim municipal conservatory, a music education center.", "ar": "كونسرفاتوار غفعتايم البلدي، مركز للتعليم الموسيقي.", "ru": "Муниципальная консерватория Гиватаима, музыкально-образовательный центр."}, "photoUrls": [], "logoUrl": null, "location": {"city": "גבעתיים", "cityEn": "Givatayim", "coordinates": {"lat": 32.0714, "lng": 34.8124}}, "translations": {"en": {"name": "Givatayim Conservatory", "city": "Givatayim", "address": "Municipal Conservatorium, Givatayim", "about": "Givatayim municipal conservatory, a music education center."}, "ar": {"name": "المجتمعية - ثقافة الترفيه والمجتمع في جفعاتايم", "city": "جفعاتايم", "address": "المعهد الموسيقي البلدي، جفعاتايم", "about": "كونسرفاتوار غفعتايم البلدي، مركز للتعليم الموسيقي."}, "ru": {"name": "Общинные центры - культура и досуг в Гиватаиме", "city": "Гиватаим", "address": "Городская консерватория, Гиватаим", "about": "Муниципальная консерватория Гиватаима, музыкально-образовательный центр."}}}'),
('a1000000-0000-0000-0000-000000000013', '{"he":"קונסרבטוריון דימונה","en":"Dimona Conservatory","ar":"المركز الجماهيري ديمونا على اسم الكتيبة النسائية في نيويورك","ru":"Общинный центр Димоны имени Женской бригады Нью-Йорка"}', 'דימונה', '{"he":"דימונה","en":"Dimona","ar":"ديمونا","ru":"Димона"}', 'הקונסרבטוריון העירוני, גבעת שמואל', '{"he":"הקונסרבטוריון העירוני, גבעת שמואל","en":"Municipal Conservatorium, Givat Shmuel","ar":"المعهد الموسيقي البلدي، جفعات شموئيل","ru":"Городская консерватория, Гиват-Шмуэль"}', NULL, 'mazulai@gmail.com', NULL, NULL, '{"sourceId": 13, "about": {"he": "קונסרבטוריון עירוני דימונה.", "en": "Dimona municipal conservatory.", "ar": "كونسرفاتوار ديمونا البلدي.", "ru": "Муниципальная консерватория Димоны."}, "photoUrls": [], "logoUrl": null, "location": {"city": "דימונה", "cityEn": "Dimona", "coordinates": {"lat": 31.0676, "lng": 35.0324}}, "translations": {"en": {"name": "Dimona Conservatory", "city": "Dimona", "address": "Municipal Conservatorium, Givat Shmuel", "about": "Dimona municipal conservatory."}, "ar": {"name": "المركز الجماهيري ديمونا على اسم الكتيبة النسائية في نيويورك", "city": "ديمونا", "address": "المعهد الموسيقي البلدي، جفعات شموئيل", "about": "كونسرفاتوار ديمونا البلدي."}, "ru": {"name": "Общинный центр Димоны имени Женской бригады Нью-Йорка", "city": "Димона", "address": "Городская консерватория, Гиват-Шмуэль", "about": "Муниципальная консерватория Димоны."}}}'),
('a1000000-0000-0000-0000-000000000014', '{"he":"קונסרבטוריון הגליל העליון","en":"Upper Galilee Conservatory","ar":"المجلس الإقليمي الجليل الأعلى","ru":"Региональный совет Верхняя Галилея"}', 'הגליל העליון', '{"he":"הגליל העליון","en":"Upper Galilee","ar":"الجليل الأعلى","ru":"Верхняя Галилея"}', 'הקונסרבטוריון העירוני, גליל עליון', '{"he":"הקונסרבטוריון העירוני, גליל עליון","en":"Municipal Conservatorium, Upper Galilee","ar":"المعهد الموسيقي البلدي، الجليل الأعلى","ru":"Городская консерватория, Верхняя Галилея"}', NULL, 'ShiraTK@galil-elion.org.il;stoleralon@gmail.com', 'https://www.galil-elion.org.il/', NULL, '{"sourceId": 14, "about": {"he": "קונסרבטוריון מועצת גליל עליון.", "en": "Upper Galilee Regional Council conservatory.", "ar": "كونسرفاتوار مجلس الجليل الأعلى الإقليمي.", "ru": "Консерватория регионального совета Верхней Галилеи."}, "photoUrls": [], "logoUrl": null, "location": {"city": "הגליל העליון", "cityEn": "Upper Galilee", "coordinates": {"lat": 33.05, "lng": 35.5}}, "translations": {"en": {"name": "Upper Galilee Conservatory", "city": "Upper Galilee", "address": "Municipal Conservatorium, Upper Galilee", "about": "Upper Galilee Regional Council conservatory."}, "ar": {"name": "المجلس الإقليمي الجليل الأعلى", "city": "الجليل الأعلى", "address": "المعهد الموسيقي البلدي، الجليل الأعلى", "about": "كونسرفاتوار مجلس الجليل الأعلى الإقليمي."}, "ru": {"name": "Региональный совет Верхняя Галилея", "city": "Верхняя Галилея", "address": "Городская консерватория, Верхняя Галилея", "about": "Консерватория регионального совета Верхней Галилеи."}}}'),
('a1000000-0000-0000-0000-000000000015', '{"he":"קונסרבטוריון הוד השרון - אלומה","en":"Hod HaSharon Municipal Conservatory – Aluma","ar":"ألوما","ru":"Алума"}', 'הוד השרון', '{"he":"הוד השרון","en":"Hod HaSharon","ar":"هود هشارون","ru":"Од-а-Шарон"}', 'יאנוש קורצ''אק 1, הוד השרון', '{"he":"יאנוש קורצ''אק 1, הוד השרון","en":"1 Janusz Korczak St, Hod Hasharon","ar":"يانوش كوركزاك 1، هود هشارون","ru":"ул. Януша Корчака 1, Од-а-Шарон"}', '09-7425184', 'yael@alumahod.com;music@alumahod.com', 'https://alumahod.com/', 'https://alumahod.com/wp-content/uploads/2025/09/AVT_3620-scaled.jpg', '{"sourceId": 15, "about": {"he": "הוקם בשנת 2009 על ידי המנצח ירוחם שרובסקי. קונסרבטוריון עירוני בפיקוח משרד החינוך, מציע מסלולים מקלאסי ועד מוסיקה קלה, הרכבים ותזמורות. תחת מיסודה של הסוכנות היהודית.", "en": "Founded in 2009 by conductor Yeruham Sharavsky. A municipal conservatory supervised by the Ministry of Education, offering programs from classical to popular music, ensembles and orchestras. Established by the Jewish Agency.", "ar": "تأسس عام 2009 على يد المايسترو يروحام شرافسكي. كونسرفاتوار بلدي تحت إشراف وزارة التربية والتعليم، يقدم مسارات من الموسيقى الكلاسيكية إلى الموسيقى الخفيفة، فرق وأوركسترات. تحت رعاية الوكالة اليهودية.", "ru": "Основана в 2009 году дирижёром Ерухамом Шаравским. Муниципальная консерватория под надзором Министерства образования, предлагающая программы от классики до лёгкой музыки, ансамбли и оркестры. Создана при Еврейском агентстве."}, "photoUrls": ["https://alumahod.com/wp-content/uploads/2025/09/AVT_3620-scaled.jpg", "https://alumahod.com/wp-content/uploads/2025/09/MCG01051-e1759057641586.jpeg", "https://alumahod.com/wp-content/uploads/2025/09/A6108108-scaled.jpg", "https://alumahod.com/wp-content/uploads/2025/09/358363289_677438947761507_5215693081281009364_n.jpg", "https://alumahod.com/wp-content/uploads/2025/09/A6108037-scaled.jpg", "https://alumahod.com/wp-content/uploads/2025/09/logos-12.png"], "logoUrl": "https://alumahod.com/wp-content/uploads/2025/09/AVT_3620-scaled.jpg", "location": {"city": "הוד השרון", "cityEn": "Hod HaSharon", "coordinates": {"lat": 32.1528, "lng": 34.8927}}, "translations": {"en": {"name": "Hod HaSharon Municipal Conservatory – Aluma", "city": "Hod HaSharon", "address": "1 Janusz Korczak St, Hod Hasharon", "about": "Founded in 2009 by conductor Yeruham Sharavsky. A municipal conservatory supervised by the Ministry of Education, offering programs from classical to popular music, ensembles and orchestras. Established by the Jewish Agency."}, "ar": {"name": "ألوما", "city": "هود هشارون", "address": "يانوش كوركزاك 1، هود هشارون", "about": "تأسس عام 2009 على يد المايسترو يروحام شرافسكي. كونسرفاتوار بلدي تحت إشراف وزارة التربية والتعليم، يقدم مسارات من الموسيقى الكلاسيكية إلى الموسيقى الخفيفة، فرق وأوركسترات. تحت رعاية الوكالة اليهودية."}, "ru": {"name": "Алума", "city": "Од-а-Шарон", "address": "ул. Януша Корчака 1, Од-а-Шарон", "about": "Основана в 2009 году дирижёром Ерухамом Шаравским. Муниципальная консерватория под надзором Министерства образования, предлагающая программы от классики до лёгкой музыки, ансамбли и оркестры. Создана при Еврейском агентстве."}}}'),
('a1000000-0000-0000-0000-000000000016', '{"he":"קונסרבטוריון הערבה","en":"Arava Conservatory","ar":"مركز مجتمع العربة","ru":"Общинный центр Арава"}', 'הערבה התיכונה', '{"he":"הערבה התיכונה","en":"Central Arava","ar":"العربة الوسطى","ru":"Центральная Арава"}', 'הקונסרבטוריון העירוני, ערבה תיכונה', '{"he":"הקונסרבטוריון העירוני, ערבה תיכונה","en":"Municipal Conservatorium, Central Arava","ar":"المعهد الموسيقي البلدي، العربة الوسطى","ru":"Городская консерватория, Центральная Арава"}', NULL, 'omerooly@gmail.com;music@arava.info', 'https://www.arava.info/', NULL, '{"sourceId": 16, "about": {"he": "קונסרבטוריון מרחב הערבה.", "en": "Arava region conservatory.", "ar": "كونسرفاتوار منطقة العربة.", "ru": "Консерватория региона Арава."}, "photoUrls": [], "logoUrl": null, "location": {"city": "הערבה התיכונה", "cityEn": "Central Arava", "coordinates": {"lat": 30.36, "lng": 35.12}}, "translations": {"en": {"name": "Arava Conservatory", "city": "Central Arava", "address": "Municipal Conservatorium, Central Arava", "about": "Arava region conservatory."}, "ar": {"name": "مركز مجتمع العربة", "city": "العربة الوسطى", "address": "المعهد الموسيقي البلدي، العربة الوسطى", "about": "كونسرفاتوار منطقة العربة."}, "ru": {"name": "Общинный центр Арава", "city": "Центральная Арава", "address": "Городская консерватория, Центральная Арава", "about": "Консерватория региона Арава."}}}'),
('a1000000-0000-0000-0000-000000000017', '{"he":"קונסרבטוריון מערב הרצליה | מרכז תאו","en":"West Herzliya Conservatory - Tao Center","ar":"شركة الفنون والثقافة هرتسليا","ru":"Компания искусства и культуры Герцлии"}', 'הרצליה', '{"he":"הרצליה","en":"Herzliya","ar":"هرتسليا","ru":"Герцлия"}', 'הקונסרבטוריון העירוני, חיפה', '{"he":"הקונסרבטוריון העירוני, חיפה","en":"Municipal Conservatorium, Haifa","ar":"المعهد الموسيقي البلدي، حيفا","ru":"Городская консерватория, Хайфа"}', '09-9506625', 'dudi@music-herzliya.co.il;guy@music-herzliya.co.il', 'https://teo.org.il/conservatory/', 'https://teo.org.il/wp-content/uploads/2020/03/23782-1024x683.jpg', '{"sourceId": 17, "about": {"he": "הקונסרבטוריון שפעל במשך שנים בחטיבת הביניים סמדר עבר למרכז תאו החדש והמשודרג. מציע שיעורי מוזיקה פרטניים, הרכבים ולהקות, תיאוריה, הפקה מוזיקלית, קונצרטים וסדנאות אמן. חינוך מוסיקלי מותאם אישית לכל ילד.", "en": "The conservatory, which operated for years at Smadar middle school, has moved to the new and upgraded Tau Center. Offers private music lessons, ensembles and bands, theory, music production, concerts and master workshops. Personalized music education for every child.", "ar": "الكونسرفاتوار الذي عمل لسنوات في مدرسة سمدار الإعدادية انتقل إلى مركز تاو الجديد والمُحدَّث. يقدم دروس موسيقى خاصة، فرق ومجموعات، نظرية، إنتاج موسيقي، حفلات وورش عمل فنية. تعليم موسيقي مخصص لكل طفل.", "ru": "Консерватория, работавшая много лет в средней школе Смадар, переехала в новый и модернизированный центр Тау. Предлагает частные уроки музыки, ансамбли и группы, теорию, музыкальное продюсирование, концерты и мастер-классы. Индивидуальное музыкальное образование для каждого ребёнка."}, "photoUrls": ["https://teo.org.il/wp-content/uploads/2020/03/23782-1024x683.jpg", "https://teo.org.il/wp-content/uploads/2020/03/MG_0979-scaled-e1583670910478-1024x1024.jpg"], "logoUrl": "https://teo.org.il/wp-content/uploads/2020/03/23782-1024x683.jpg", "location": {"city": "הרצליה", "cityEn": "Herzliya", "coordinates": {"lat": 32.165, "lng": 34.849}}, "translations": {"en": {"name": "West Herzliya Conservatory - Tao Center", "city": "Herzliya", "address": "Municipal Conservatorium, Haifa", "about": "The conservatory, which operated for years at Smadar middle school, has moved to the new and upgraded Tau Center. Offers private music lessons, ensembles and bands, theory, music production, concerts and master workshops. Personalized music education for every child."}, "ar": {"name": "شركة الفنون والثقافة هرتسليا", "city": "هرتسليا", "address": "المعهد الموسيقي البلدي، حيفا", "about": "الكونسرفاتوار الذي عمل لسنوات في مدرسة سمدار الإعدادية انتقل إلى مركز تاو الجديد والمُحدَّث. يقدم دروس موسيقى خاصة، فرق ومجموعات، نظرية، إنتاج موسيقي، حفلات وورش عمل فنية. تعليم موسيقي مخصص لكل طفل."}, "ru": {"name": "Компания искусства и культуры Герцлии", "city": "Герцлия", "address": "Городская консерватория, Хайфа", "about": "Консерватория, работавшая много лет в средней школе Смадар, переехала в новый и модернизированный центр Тау. Предлагает частные уроки музыки, ансамбли и группы, теорию, музыкальное продюсирование, концерты и мастер-классы. Индивидуальное музыкальное образование для каждого ребёнка."}}}'),
('a1000000-0000-0000-0000-000000000018', '{"he":"קונסרבטוריון זכרון יעקב","en":"Zikhron Ya''akov Conservatory","ar":"زامارين جمعية ثقافة الترفيه","ru":"Замарин Ассоциация культуры и досуга"}', 'זכרון יעקב', '{"he":"זכרון יעקב","en":"Zikhron Ya''akov","ar":"زخرون يعكوف","ru":"Зихрон-Яаков"}', 'הקונסרבטוריון העירוני, זכרון יעקב', '{"he":"הקונסרבטוריון העירוני, זכרון יעקב","en":"Municipal Conservatorium, Zikhron Ya''akov","ar":"المعهد الموسيقي البلدي، زخرون يعكوف","ru":"Городская консерватория, Зихрон-Яаков"}', '04-6297018', 'music@zamarin.org.il;rzmusic@zamarin.org.il', 'https://www.zamarin.org.il/', NULL, '{"sourceId": 18, "about": {"he": "קונסרבטוריון עירוני זכרון יעקב.", "en": "Zikhron Ya''akov municipal conservatory.", "ar": "كونسرفاتوار زخرون يعقوب البلدي.", "ru": "Муниципальная консерватория Зихрон-Яакова."}, "photoUrls": [], "logoUrl": null, "location": {"city": "זכרון יעקב", "cityEn": "Zikhron Ya''''akov", "coordinates": {"lat": 32.57, "lng": 34.95}}, "translations": {"en": {"name": "Zikhron Ya''''akov Conservatory", "city": "Zikhron Ya''''akov", "address": "Municipal Conservatorium, Zikhron Ya''''akov", "about": "Zikhron Ya''akov municipal conservatory."}, "ar": {"name": "زامارين جمعية ثقافة الترفيه", "city": "زخرون يعكوف", "address": "المعهد الموسيقي البلدي، زخرون يعكوف", "about": "كونسرفاتوار زخرون يعقوب البلدي."}, "ru": {"name": "Замарин Ассоциация культуры и досуга", "city": "Зихрон-Яаков", "address": "Городская консерватория, Зихрон-Яаков", "about": "Муниципальная консерватория Зихрон-Яакова."}}}'),
('a1000000-0000-0000-0000-000000000019', '{"he":"קונסרבטוריון חדרה","en":"Hadera Conservatory","ar":"حيفيل إيلوت","ru":"Хевель-Эйлот"}', 'חבל אילות', '{"he":"חבל אילות","en":"Hevel Eilot","ar":"حيفيل إيلوت","ru":"Хевель-Эйлот"}', 'הקונסרבטוריון העירוני, חבל אילות', '{"he":"הקונסרבטוריון העירוני, חבל אילות","en":"Municipal Conservatorium, Hevel Eilot","ar":"المعهد الموسيقي البلدي، حيفيل إيلوت","ru":"Городская консерватория, Хевель-Эйлот"}', '04-6331686', 'viola.bull@gmail.com', NULL, NULL, '{"sourceId": 19, "about": {"he": "קונסרבטוריון עירוני חדרה.", "en": "Hadera municipal conservatory.", "ar": "كونسرفاتوار الخضيرة البلدي.", "ru": "Муниципальная консерватория Хадеры."}, "photoUrls": [], "logoUrl": null, "location": {"city": "חבל אילות", "cityEn": "Hevel Eilot", "coordinates": {"lat": 32.4365, "lng": 34.9196}}, "translations": {"en": {"name": "Hadera Conservatory", "city": "Hevel Eilot", "address": "Municipal Conservatorium, Hevel Eilot", "about": "Hadera municipal conservatory."}, "ar": {"name": "حيفيل إيلوت", "city": "حيفيل إيلوت", "address": "المعهد الموسيقي البلدي، حيفيل إيلوت", "about": "كونسرفاتوار الخضيرة البلدي."}, "ru": {"name": "Хевель-Эйлот", "city": "Хевель-Эйлот", "address": "Городская консерватория, Хевель-Эйлот", "about": "Муниципальная консерватория Хадеры."}}}'),
('a1000000-0000-0000-0000-000000000020', '{"he":"קונסרבטוריון חולון","en":"Holon Conservatory","ar":"المجلس الإقليمي إشكول","ru":"Региональный совет Эшколь"}', 'חבל אשכול', '{"he":"חבל אשכול","en":"Eshkol Region","ar":"حيفيل إشكول","ru":"Регион Эшколь"}', 'הקונסרבטוריון העירוני, מועצה אזורית אשכול', '{"he":"הקונסרבטוריון העירוני, מועצה אזורית אשכול","en":"Municipal Conservatorium, Eshkol Region","ar":"المعهد الموسيقي البلدي، حيفيل إشكول","ru":"Городская консерватория, Регион Эшколь"}', '08-9929166', 'roieshkol@gmail.com', NULL, NULL, '{"sourceId": 20, "about": {"he": "קונסרבטוריון עירוני חולון.", "en": "Holon municipal conservatory.", "ar": "كونسرفاتوار حولون البلدي.", "ru": "Муниципальная консерватория Холона."}, "photoUrls": [], "logoUrl": null, "location": {"city": "חבל אשכול", "cityEn": "Eshkol Region", "coordinates": {"lat": 32.0107, "lng": 34.7782}}, "translations": {"en": {"name": "Holon Conservatory", "city": "Eshkol Region", "address": "Municipal Conservatorium, Eshkol Region", "about": "Holon municipal conservatory."}, "ar": {"name": "المجلس الإقليمي إشكول", "city": "حيفيل إشكول", "address": "المعهد الموسيقي البلدي، حيفيل إشكول", "about": "كونسرفاتوار حولون البلدي."}, "ru": {"name": "Региональный совет Эшколь", "city": "Регион Эшколь", "address": "Городская консерватория, Регион Эшколь", "about": "Муниципальная консерватория Холона."}}}'),
('a1000000-0000-0000-0000-000000000021', '{"he":"קונסרבטוריון חוף הכרמל","en":"Hof HaCarmel Conservatory","ar":"بلدية الخضيرة","ru":"Муниципалитет Хадеры"}', 'חדרה', '{"he":"חדרה","en":"Hadera","ar":"الخضيرة","ru":"Хадера"}', 'הקונסרבטוריון העירוני, טבריה', '{"he":"הקונסרבטוריון העירוני, טבריה","en":"Municipal Conservatorium, Tiberias","ar":"المعهد الموسيقي البلدي، طبريا","ru":"Городская консерватория, Тверия"}', '04-6331686', 'marrom.tofik@gmail.com;tofik-m@hadera.muni.il;cons-hadera@hadera.muni.il', 'https://www.hadera.muni.il/', NULL, '{"sourceId": 21, "about": {"he": "קונסרבטוריון מועצת חוף הכרמל.", "en": "Hof HaCarmel Regional Council conservatory.", "ar": "كونسرفاتوار مجلس ساحل الكرمل الإقليمي.", "ru": "Консерватория регионального совета Хоф а-Кармель."}, "photoUrls": [], "logoUrl": null, "location": {"city": "חדרה", "cityEn": "Hadera", "coordinates": {"lat": 32.65, "lng": 34.95}}, "translations": {"en": {"name": "Hof HaCarmel Conservatory", "city": "Hadera", "address": "Municipal Conservatorium, Tiberias", "about": "Hof HaCarmel Regional Council conservatory."}, "ar": {"name": "بلدية الخضيرة", "city": "الخضيرة", "address": "المعهد الموسيقي البلدي، طبريا", "about": "كونسرفاتوار مجلس ساحل الكرمل الإقليمي."}, "ru": {"name": "Муниципалитет Хадеры", "city": "Хадера", "address": "Городская консерватория, Тверия", "about": "Консерватория регионального совета Хоф а-Кармель."}}}'),
('a1000000-0000-0000-0000-000000000022', '{"he":"קונסרבטוריון דוניה ויצמן - חיפה","en":"Dunie Weizman Conservatory Haifa","ar":"شبكة المجتمع والترفيه - حولون","ru":"Сеть общинных и досуговых центров Холона"}', 'חולון', '{"he":"חולון","en":"Holon","ar":"حولون","ru":"Холон"}', 'הקונסרבטוריון העירוני, טירת כרמל', '{"he":"הקונסרבטוריון העירוני, טירת כרמל","en":"Municipal Conservatorium, Tirat Carmel","ar":"المعهد الموسيقي البلدي، طيرة الكرمل","ru":"Городская консерватория, Тират-Кармель"}', '03-5500012', 'omergab@gmail.com', 'https://musicschoolhaifa.co.il/', NULL, '{"sourceId": 22, "about": {"he": "קונסרבטוריון ויצמן - חוג הכרמל לחינוך המוסיקה.", "en": "Weizmann Conservatory - Carmel Circle for Music Education.", "ar": "كونسرفاتوار وايزمان - حلقة الكرمل للتعليم الموسيقي.", "ru": "Консерватория Вейцмана — Кармельский кружок музыкального образования."}, "photoUrls": [], "logoUrl": null, "location": {"city": "חולון", "cityEn": "Holon", "coordinates": {"lat": 32.8156, "lng": 34.9895}}, "translations": {"en": {"name": "Dunie Weizman Conservatory Haifa", "city": "Holon", "address": "Municipal Conservatorium, Tirat Carmel", "about": "Weizmann Conservatory - Carmel Circle for Music Education."}, "ar": {"name": "شبكة المجتمع والترفيه - حولون", "city": "حولون", "address": "المعهد الموسيقي البلدي، طيرة الكرمل", "about": "كونسرفاتوار وايزمان - حلقة الكرمل للتعليم الموسيقي."}, "ru": {"name": "Сеть общинных и досуговых центров Холона", "city": "Холон", "address": "Городская консерватория, Тират-Кармель", "about": "Консерватория Вейцмана — Кармельский кружок музыкального образования."}}}'),
('a1000000-0000-0000-0000-000000000023', '{"he":"קונסרבטוריון רובין - חיפה","en":"Rubin Conservatory Haifa","ar":"حوف هكرمل - استوديو الموسيقى","ru":"Хоф-а-Кармель - Музыкальная студия"}', 'חוף הכרמל', '{"he":"חוף הכרמל","en":"Hof HaCarmel","ar":"حوف هكرمل","ru":"Хоф-а-Кармель"}', 'הקונסרבטוריון העירוני, חוף הכרמל', '{"he":"הקונסרבטוריון העירוני, חוף הכרמל","en":"Municipal Conservatorium, Hof HaCarmel","ar":"المعهد الموسيقي البلدي، حوف هكرمل","ru":"Городская консерватория, Хоф-а-Кармель"}', '04-6299712', 'amirstoler@gmail.com', 'https://www.haifacons.co.il/', NULL, '{"sourceId": 23, "about": {"he": "קונסרבטוריון רובין חיפה, מוסד ממלכתי מוביל ברוב כלי הנגינה.", "en": "Rubin Conservatory Haifa, a leading public institution for most instruments.", "ar": "كونسرفاتوار روبين حيفا، مؤسسة حكومية رائدة في معظم الآلات الموسيقية.", "ru": "Консерватория Рубина в Хайфе, ведущее государственное учреждение по большинству инструментов."}, "photoUrls": [], "logoUrl": null, "location": {"city": "חוף הכרמל", "cityEn": "Hof HaCarmel", "coordinates": {"lat": 32.8156, "lng": 34.9895}}, "translations": {"en": {"name": "Rubin Conservatory Haifa", "city": "Hof HaCarmel", "address": "Municipal Conservatorium, Hof HaCarmel", "about": "Rubin Conservatory Haifa, a leading public institution for most instruments."}, "ar": {"name": "حوف هكرمل - استوديو الموسيقى", "city": "حوف هكرمل", "address": "المعهد الموسيقي البلدي، حوف هكرمل", "about": "كونسرفاتوار روبين حيفا، مؤسسة حكومية رائدة في معظم الآلات الموسيقية."}, "ru": {"name": "Хоф-а-Кармель - Музыкальная студия", "city": "Хоф-а-Кармель", "address": "Городская консерватория, Хоф-а-Кармель", "about": "Консерватория Рубина в Хайфе, ведущее государственное учреждение по большинству инструментов."}}}'),
('a1000000-0000-0000-0000-000000000024', '{"he":"קונסרבטוריון טבריה","en":"Tiberias Conservatory","ar":"مركز يوفال للموسيقى وأوركسترا الشباب - حيفا","ru":"Центр музыки и молодежных оркестров Юваль - Хайфа"}', 'חיפה-יובל', '{"he":"חיפה-יובל","en":"Haifa - Yuval","ar":"حيفا - يوفال","ru":"Хайфа - Юваль"}', 'הקונסרבטוריון העירוני, חולון', '{"he":"הקונסרבטוריון העירוני, חולון","en":"Municipal Conservatorium, Holon","ar":"المعهد الموسيقي البلدي، حولون","ru":"Городская консерватория, Холон"}', '04-8629787', 'snr@bezeqint.net', NULL, NULL, '{"sourceId": 24, "about": {"he": "קונסרבטוריון עירוני טבריה.", "en": "Tiberias municipal conservatory.", "ar": "كونسرفاتوار طبريا البلدي.", "ru": "Муниципальная консерватория Тверии."}, "photoUrls": [], "logoUrl": null, "location": {"city": "חיפה-יובל", "cityEn": "Haifa - Yuval", "coordinates": {"lat": 32.794, "lng": 35.5308}}, "translations": {"en": {"name": "Tiberias Conservatory", "city": "Haifa - Yuval", "address": "Municipal Conservatorium, Holon", "about": "Tiberias municipal conservatory."}, "ar": {"name": "مركز يوفال للموسيقى وأوركسترا الشباب - حيفا", "city": "حيفا - يوفال", "address": "المعهد الموسيقي البلدي، حولون", "about": "كونسرفاتوار طبريا البلدي."}, "ru": {"name": "Центр музыки и молодежных оркестров Юваль - Хайфа", "city": "Хайфа - Юваль", "address": "Городская консерватория, Холон", "about": "Муниципальная консерватория Тверии."}}}'),
('a1000000-0000-0000-0000-000000000025', '{"he":"קונסרבטוריון טבריה ב","en":"Tiberias Conservatory B","ar":"معهد روبين الموسيقي","ru":"Консерватория им. Рубина"}', 'חיפה-רובין', '{"he":"חיפה-רובין","en":"Haifa - Rubin","ar":"حيفا - روبين","ru":"Хайфа - Рубин"}', 'הקונסרבטוריון העירוני, חוף אשקלון', '{"he":"הקונסרבטוריון העירוני, חוף אשקלון","en":"Municipal Conservatorium, Hof Ashkelon","ar":"المعهد الموسيقي البلدي، حوف عسقلان","ru":"Городская консерватория, Хоф Ашкелон"}', '04-8521530', 'srubincons@barak.net.il', 'https://www.rubin-cons.co.il/', NULL, '{"sourceId": 25, "about": {"he": "ענף נוסף של הקונסרבטוריון בטבריה.", "en": "An additional branch of the Tiberias conservatory.", "ar": "فرع إضافي للكونسرفاتوار في طبريا.", "ru": "Дополнительный филиал консерватории в Тверии."}, "photoUrls": [], "logoUrl": null, "location": {"city": "חיפה-רובין", "cityEn": "Haifa - Rubin", "coordinates": {"lat": 32.794, "lng": 35.5308}}, "translations": {"en": {"name": "Tiberias Conservatory B", "city": "Haifa - Rubin", "address": "Municipal Conservatorium, Hof Ashkelon", "about": "An additional branch of the Tiberias conservatory."}, "ar": {"name": "معهد روبين الموسيقي", "city": "حيفا - روبين", "address": "المعهد الموسيقي البلدي، حوف عسقلان", "about": "فرع إضافي للكونسرفاتوار في طبريا."}, "ru": {"name": "Консерватория им. Рубина", "city": "Хайфа - Рубин", "address": "Городская консерватория, Хоф Ашкелон", "about": "Дополнительный филиал консерватории в Тверии."}}}'),
('a1000000-0000-0000-0000-000000000026', '{"he":"קונסרבטוריון יהוד","en":"Yehud Conservatory","ar":"بلدية طبريا","ru":"Муниципалитет Тверии"}', 'טבריה', '{"he":"טבריה","en":"Tiberias","ar":"طبريا","ru":"Тверия"}', 'הקונסרבטוריון העירוני, חצור הגלילית', '{"he":"הקונסרבטוריון העירוני, חצור הגלילית","en":"Municipal Conservatorium, Hatzor HaGlilit","ar":"المعهد الموسيقي البلدي، حتسور هجليليت","ru":"Городская консерватория, Хацор-а-Глилит"}', '04-6731733', 'Tiberias.cons@gmail.com', NULL, NULL, '{"sourceId": 26, "about": {"he": "קונסרבטוריון עירוני יהוד.", "en": "Yehud municipal conservatory.", "ar": "كونسرفاتوار يهود البلدي.", "ru": "Муниципальная консерватория Йеуда."}, "photoUrls": [], "logoUrl": null, "location": {"city": "טבריה", "cityEn": "Tiberias", "coordinates": {"lat": 31.9944, "lng": 34.8886}}, "translations": {"en": {"name": "Yehud Conservatory", "city": "Tiberias", "address": "Municipal Conservatorium, Hatzor HaGlilit", "about": "Yehud municipal conservatory."}, "ar": {"name": "بلدية طبريا", "city": "طبريا", "address": "المعهد الموسيقي البلدي، حتسور هجليليت", "about": "كونسرفاتوار يهود البلدي."}, "ru": {"name": "Муниципалитет Тверии", "city": "Тверия", "address": "Городская консерватория, Хацор-а-Глилит", "about": "Муниципальная консерватория Йеуда."}}}'),
('a1000000-0000-0000-0000-000000000027', '{"he":"קונסרבטוריון יוקנעם-מגדל","en":"Yokneam-Migdal Conservatory","ar":"جمعية التربية الموسيقية في طيرة الكرمل","ru":"Ассоциация музыкального образования в Тират-Кармеле"}', 'טירת הכרמל', '{"he":"טירת הכרמל","en":"Tirat Carmel","ar":"طيرة الكرمل","ru":"Тират-Кармель"}', 'הקונסרבטוריון העירוני, יבנה', '{"he":"הקונסרבטוריון העירוני, יבנה","en":"Municipal Conservatorium, Yavne","ar":"المعهد الموسيقي البلدي، يفنه","ru":"Городская консерватория, Явне"}', '04-6598212', 'alexfridman750@gmail.com', NULL, NULL, '{"sourceId": 27, "about": {"he": "בית המוסיקה יוקנעם-מגדל.", "en": "Yokneam-Migdal Music House.", "ar": "بيت الموسيقى يوكنعام-مجدال.", "ru": "Дом музыки Йокнеам-Мигдаль."}, "photoUrls": [], "logoUrl": null, "location": {"city": "טירת הכרמל", "cityEn": "Tirat Carmel", "coordinates": {"lat": 32.6561, "lng": 35.1006}}, "translations": {"en": {"name": "Yokneam-Migdal Conservatory", "city": "Tirat Carmel", "address": "Municipal Conservatorium, Yavne", "about": "Yokneam-Migdal Music House."}, "ar": {"name": "جمعية التربية الموسيقية في طيرة الكرمل", "city": "طيرة الكرمل", "address": "المعهد الموسيقي البلدي، يفنه", "about": "بيت الموسيقى يوكنعام-مجدال."}, "ru": {"name": "Ассоциация музыкального образования в Тират-Кармеле", "city": "Тират-Кармель", "address": "Городская консерватория, Явне", "about": "Дом музыки Йокнеам-Мигдаль."}}}'),
('a1000000-0000-0000-0000-000000000028', '{"he":"קונסרבטוריון עמק יזרעאל-מגדל העמק","en":"Jezreel Valley-Migdal HaEmek Conservatory","ar":"المركز الجماهيري في يفنه على اسم جرمانوف","ru":"Общинный центр Явне им. Германова"}', 'יבנה', '{"he":"יבנה","en":"Yavne","ar":"يفنه","ru":"Явне"}', 'הקונסרבטוריון העירוני, יהוד מונוסון', '{"he":"הקונסרבטוריון העירוני, יהוד מונוסון","en":"Municipal Conservatorium, Yehud-Monosson","ar":"المعهد الموسيقي البلدي، يهود مونوسون","ru":"Городская консерватория, Йехуд-Моноссон"}', '08-9194470', 'gutmanr1960@gmail.com', NULL, NULL, '{"sourceId": 28, "about": {"he": "קונסרבטוריון מועצת גולן ורשת קהילתית.", "en": "Golan Regional Council conservatory and community network.", "ar": "كونسرفاتوار مجلس الجولان الإقليمي وشبكة مجتمعية.", "ru": "Консерватория регионального совета Голан и общинная сеть."}, "photoUrls": [], "logoUrl": null, "location": {"city": "יבנה", "cityEn": "Yavne", "coordinates": {"lat": 32.6735, "lng": 35.2387}}, "translations": {"en": {"name": "Jezreel Valley-Migdal HaEmek Conservatory", "city": "Yavne", "address": "Municipal Conservatorium, Yehud-Monosson", "about": "Golan Regional Council conservatory and community network."}, "ar": {"name": "المركز الجماهيري في يفنه على اسم جرمانوف", "city": "يفنه", "address": "المعهد الموسيقي البلدي، يهود مونوسون", "about": "كونسرفاتوار مجلس الجولان الإقليمي وشبكة مجتمعية."}, "ru": {"name": "Общинный центр Явне им. Германова", "city": "Явне", "address": "Городская консерватория, Йехуд-Моноссон", "about": "Консерватория регионального совета Голан и общинная сеть."}}}'),
('a1000000-0000-0000-0000-000000000029', '{"he":"קונסרבטוריון ירוחם","en":"Yerucham Conservatory","ar":"بيت الموسيقى يزراعيل جلبوع","ru":"Дом музыки Изреель-Гильбоа"}', 'יזרעאל-גלבוע', '{"he":"יזרעאל-גלבוע","en":"Jezreel - Gilboa","ar":"يزراعيل - جلبوع","ru":"Изреель - Гильбоа"}', 'הקונסרבטוריון העירוני, יזרעאל גלבוע', '{"he":"הקונסרבטוריון העירוני, יזרעאל גלבוע","en":"Municipal Conservatorium, Jezreel Gilboa","ar":"المعهد الموسيقي البلدي، يزراعيل جلبوع","ru":"Городская консерватория, Изреель Гильбоа"}', '04-6598212', 'bmusicagilboa@gmail.com', NULL, NULL, '{"sourceId": 29, "about": {"he": "קונסרבטוריון עירוני ירוחם.", "en": "Yeruham municipal conservatory.", "ar": "كونسرفاتوار يروحام البلدي.", "ru": "Муниципальная консерватория Ерухама."}, "photoUrls": [], "logoUrl": null, "location": {"city": "יזרעאל-גלבוע", "cityEn": "Jezreel - Gilboa", "coordinates": {"lat": 30.9866, "lng": 34.9267}}, "translations": {"en": {"name": "Yerucham Conservatory", "city": "Jezreel - Gilboa", "address": "Municipal Conservatorium, Jezreel Gilboa", "about": "Yeruham municipal conservatory."}, "ar": {"name": "بيت الموسيقى يزراعيل جلبوع", "city": "يزراعيل - جلبوع", "address": "المعهد الموسيقي البلدي، يزراعيل جلبوع", "about": "كونسرفاتوار يروحام البلدي."}, "ru": {"name": "Дом музыки Изреель-Гильбоа", "city": "Изреель - Гильбоа", "address": "Городская консерватория, Изреель Гильбоа", "about": "Муниципальная консерватория Ерухама."}}}'),
('a1000000-0000-0000-0000-000000000030', '{"he":"קונסרבטוריון ירוחם ב","en":"Yerucham Conservatory B","ar":"شبكة المراكز الجماهيرية يوكنعام","ru":"Сеть общинных центров Йокнеама"}', 'יקנעם', '{"he":"יקנעם","en":"Yokneam","ar":"يوكنعام","ru":"Йокнеам"}', 'הקונסרבטוריון העירוני, יקנעם עילית', '{"he":"הקונסרבטוריון העירוני, יקנעם עילית","en":"Municipal Conservatorium, Yokneam Illit","ar":"المعهد الموسيقي البلدي، يوكنعام عيليت","ru":"Городская консерватория, Йокнеам-Иллит"}', '04-9893986', 'inna_lux@walla.com', NULL, NULL, '{"sourceId": 30, "about": {"he": "ענף נוסף של פעילות המוסיקה בירוחם.", "en": "An additional branch of music activities in Yeruham.", "ar": "فرع إضافي للنشاط الموسيقي في يروحام.", "ru": "Дополнительный филиал музыкальной деятельности в Ерухаме."}, "photoUrls": [], "logoUrl": null, "location": {"city": "יקנעם", "cityEn": "Yokneam", "coordinates": {"lat": 30.9866, "lng": 34.9267}}, "translations": {"en": {"name": "Yerucham Conservatory B", "city": "Yokneam", "address": "Municipal Conservatorium, Yokneam Illit", "about": "An additional branch of music activities in Yeruham."}, "ar": {"name": "شبكة المراكز الجماهيرية يوكنعام", "city": "يوكنعام", "address": "المعهد الموسيقي البلدي، يوكنعام عيليت", "about": "فرع إضافي للنشاط الموسيقي في يروحام."}, "ru": {"name": "Сеть общинных центров Йокнеама", "city": "Йокнеам", "address": "Городская консерватория, Йокнеам-Иллит", "about": "Дополнительный филиал музыкальной деятельности в Ерухаме."}}}'),
('a1000000-0000-0000-0000-000000000031', '{"he":"קונסרבטוריון ירושלים - JAMD","en":"Jerusalem Academy Conservatory (JAMD)","ar":"مركز الثقافة في يروحام على اسم صموئيل روبين","ru":"Культурный центр Иерухама им. Самуэля Рубина"}', 'ירוחם', '{"he":"ירוחם","en":"Yeruham","ar":"يروحام","ru":"Иерухам"}', 'הקונסרבטוריון העירוני, ירושלים', '{"he":"הקונסרבטוריון העירוני, ירושלים","en":"Municipal Conservatorium, Jerusalem","ar":"المعهد الموسيقي البلدي، القدس","ru":"Городская консерватория, Иерусалим"}', '08-6687000', 'consyeruham@gmail.com', 'https://conservatoryjamd.co.il/', NULL, '{"sourceId": 31, "about": {"he": "קונסרבטוריון האקדמיה למוסיקה ומחול בירושלים, הוקם בשנת 1933. מנה 1000+ תלמידים.", "en": "The Jerusalem Academy of Music and Dance conservatory, founded in 1933. Has over 1,000 students.", "ar": "كونسرفاتوار أكاديمية الموسيقى والرقص في القدس، تأسس عام 1933. يضم أكثر من 1000 طالب.", "ru": "Консерватория Иерусалимской академии музыки и танца, основана в 1933 году. Более 1000 учеников."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ירוחם", "cityEn": "Yeruham", "coordinates": {"lat": 31.7683, "lng": 35.1966}}, "translations": {"en": {"name": "Jerusalem Academy Conservatory (JAMD)", "city": "Yeruham", "address": "Municipal Conservatorium, Jerusalem", "about": "The Jerusalem Academy of Music and Dance conservatory, founded in 1933. Has over 1,000 students."}, "ar": {"name": "مركز الثقافة في يروحام على اسم صموئيل روبين", "city": "يروحام", "address": "المعهد الموسيقي البلدي، القدس", "about": "كونسرفاتوار أكاديمية الموسيقى والرقص في القدس، تأسس عام 1933. يضم أكثر من 1000 طالب."}, "ru": {"name": "Культурный центр Иерухама им. Самуэля Рубина", "city": "Иерухам", "address": "Городская консерватория, Иерусалим", "about": "Консерватория Иерусалимской академии музыки и танца, основана в 1933 году. Более 1000 учеников."}}}'),
('a1000000-0000-0000-0000-000000000032', '{"he":"קונסרבטוריון ירושלים - חסידנה","en":"Jerusalem Conservatory – Hassadna","ar":"مركز جوننيم الجماهيري","ru":"Общинный центр Гонен"}', 'ירושלים-גוננים', '{"he":"ירושלים-גוננים","en":"Jerusalem - Gonenim","ar":"القدس - جوننيم","ru":"Иерусалим - Гонен"}', 'הקונסרבטוריון העירוני, כרמיאל', '{"he":"הקונסרבטוריון העירוני, כרמיאל","en":"Municipal Conservatorium, Karmiel","ar":"المعهد الموسيقي البلدي، كرميئيل","ru":"Городская консерватория, Кармиэль"}', '02-5630017', 'Musicgonenim@gmail.com', 'https://hassadna.com/', NULL, '{"sourceId": 32, "about": {"he": "בית הספר למוסיקה חסידנה בירושלים.", "en": "Hassadna Music School in Jerusalem.", "ar": "مدرسة حسدنا للموسيقى في القدس.", "ru": "Музыкальная школа Хасадна в Иерусалиме."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ירושלים-גוננים", "cityEn": "Jerusalem - Gonenim", "coordinates": {"lat": 31.7683, "lng": 35.1966}}, "translations": {"en": {"name": "Jerusalem Conservatory – Hassadna", "city": "Jerusalem - Gonenim", "address": "Municipal Conservatorium, Karmiel", "about": "Hassadna Music School in Jerusalem."}, "ar": {"name": "مركز جوننيم الجماهيري", "city": "القدس - جوننيم", "address": "المعهد الموسيقي البلدي، كرميئيل", "about": "مدرسة حسدنا للموسيقى في القدس."}, "ru": {"name": "Общинный центр Гонен", "city": "Иерусалим - Гонен", "address": "Городская консерватория, Кармиэль", "about": "Музыкальная школа Хасадна в Иерусалиме."}}}'),
('a1000000-0000-0000-0000-000000000033', '{"he":"קונסרבטוריון ירושלים - שולמית","en":"Jerusalem Conservatory – Shulamit","ar":"المعهد الموسيقي التابع لأكاديمية الموسيقى والرقص في القدس","ru":"Консерватория при Иерусалимской академии музыки и танца"}', 'ירושלים-האקדמיה', '{"he":"ירושלים-האקדמיה","en":"Jerusalem - The Academy","ar":"القدس - الأكاديمية","ru":"Иерусалим - Академия"}', 'הקונסרבטוריון העירוני, כפר ורדים', '{"he":"הקונסרבטוריון העירוני, כפר ורדים","en":"Municipal Conservatorium, Kfar Vradim","ar":"المعهد الموسيقي البلدي، كفار فراديم","ru":"Городская консерватория, Кфар-Врадим"}', '02-6550422', 'barak@jamd.ac.il', 'https://www.ronshulamit.org.il/', NULL, '{"sourceId": 33, "about": {"he": "קונסרבטוריון ירושלים - שולמית, מוסד ותיק בחינוך המוסיקלי הירושלמי.", "en": "Jerusalem Conservatory - Ron Shulamit, a veteran institution in Jerusalem music education.", "ar": "كونسرفاتوار القدس - رون شولميت، مؤسسة عريقة في التعليم الموسيقي في القدس.", "ru": "Иерусалимская консерватория — Рон Шуламит, старейшее учреждение музыкального образования Иерусалима."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ירושלים-האקדמיה", "cityEn": "Jerusalem - The Academy", "coordinates": {"lat": 31.7683, "lng": 35.1966}}, "translations": {"en": {"name": "Jerusalem Conservatory – Shulamit", "city": "Jerusalem - The Academy", "address": "Municipal Conservatorium, Kfar Vradim", "about": "Jerusalem Conservatory - Ron Shulamit, a veteran institution in Jerusalem music education."}, "ar": {"name": "المعهد الموسيقي التابع لأكاديمية الموسيقى والرقص في القدس", "city": "القدس - الأكاديمية", "address": "المعهد الموسيقي البلدي، كفار فراديم", "about": "كونسرفاتوار القدس - رون شولميت، مؤسسة عريقة في التعليم الموسيقي في القدس."}, "ru": {"name": "Консерватория при Иерусалимской академии музыки и танца", "city": "Иерусалим - Академия", "address": "Городская консерватория, Кфар-Врадим", "about": "Иерусалимская консерватория — Рон Шуламит, старейшее учреждение музыкального образования Иерусалима."}}}'),
('a1000000-0000-0000-0000-000000000034', '{"he":"קונסרבטוריון יפו","en":"Jaffa Conservatory","ar":"معهد هسدنا الموسيقي القدس","ru":"Консерватория Хассадна Иерусалим"}', 'ירושלים-הסדנה', '{"he":"ירושלים-הסדנה","en":"Jerusalem - Hassadna","ar":"القدس - هسدنا","ru":"Иерусалим - Хассадна"}', 'הקונסרבטוריון העירוני, כפר יונה', '{"he":"הקונסרבטוריון העירוני, כפר יונה","en":"Municipal Conservatorium, Kfar Yona","ar":"المعهد الموسيقي البلدي، كفار يونا","ru":"Городская консерватория, Кфар-Йона"}', '02-5630017', 'lena@hassadna.com', 'https://www.hassadna.com/', NULL, '{"sourceId": 34, "about": {"he": "קונסרבטוריון יפו.", "en": "Jaffa conservatory.", "ar": "كونسرفاتوار يافا.", "ru": "Консерватория Яффо."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ירושלים-הסדנה", "cityEn": "Jerusalem - Hassadna", "coordinates": {"lat": 32.05, "lng": 34.75}}, "translations": {"en": {"name": "Jaffa Conservatory", "city": "Jerusalem - Hassadna", "address": "Municipal Conservatorium, Kfar Yona", "about": "Jaffa conservatory."}, "ar": {"name": "معهد هسدنا الموسيقي القدس", "city": "القدس - هسدنا", "address": "المعهد الموسيقي البلدي، كفار يونا", "about": "كونسرفاتوار يافا."}, "ru": {"name": "Консерватория Хассадна Иерусалим", "city": "Иерусалим - Хассадна", "address": "Городская консерватория, Кфар-Йона", "about": "Консерватория Яффо."}}}'),
('a1000000-0000-0000-0000-000000000035', '{"he":"קונסרבטוריון ירושלים - בית ניסן","en":"Jerusalem Conservatory – Beit Nisan","ar":"رون شولاميت - لتعزيز الرقص والموسيقى في القدس","ru":"Рон Шуламит - содействие танцу и музыке в Иерусалиме"}', 'ירושלים-רון שולמית', '{"he":"ירושלים-רון שולמית","en":"Jerusalem - Ron Shulamit","ar":"القدس - رون شولاميت","ru":"Иерусалим - Рон Шуламит"}', 'הקונסרבטוריון העירוני, כפר סבא', '{"he":"הקונסרבטוריון העירוני, כפר סבא","en":"Municipal Conservatorium, Kfar Saba","ar":"المعهد الموسيقي البلدي، كفار سابا","ru":"Городская консерватория, Кфар-Саба"}', '02-6528531', 'benzion@ronshulamit.org.il;rivka@ronshulamit.org.il', 'https://www.ronshulamit.org.il/', NULL, '{"sourceId": 35, "about": {"he": "ענף מוסיקה ירושלמי.", "en": "A Jerusalem music branch.", "ar": "فرع موسيقي في القدس.", "ru": "Иерусалимский музыкальный филиал."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ירושלים-רון שולמית", "cityEn": "Jerusalem - Ron Shulamit", "coordinates": {"lat": 31.7683, "lng": 35.1966}}, "translations": {"en": {"name": "Jerusalem Conservatory – Beit Nisan", "city": "Jerusalem - Ron Shulamit", "address": "Municipal Conservatorium, Kfar Saba", "about": "A Jerusalem music branch."}, "ar": {"name": "رون شولاميت - لتعزيز الرقص والموسيقى في القدس", "city": "القدس - رون شولاميت", "address": "المعهد الموسيقي البلدي، كفار سابا", "about": "فرع موسيقي في القدس."}, "ru": {"name": "Рон Шуламит - содействие танцу и музыке в Иерусалиме", "city": "Иерусалим - Рон Шуламит", "address": "Городская консерватория, Кфар-Саба", "about": "Иерусалимский музыкальный филиал."}}}'),
('a1000000-0000-0000-0000-000000000036', '{"he":"הקונסרבטוריון למוסיקה ולמחול, כפר סבא","en":"Kfar Saba Conservatory for Music and Dance","ar":"يارا - الفولكلور والفن الدرزي","ru":"Яра - Друзский фольклор и искусство"}', 'ירכא', '{"he":"ירכא","en":"Yarka","ar":"يركا","ru":"Ярка"}', 'הקונסרבטוריון העירוני, כפר שמריהו', '{"he":"הקונסרבטוריון העירוני, כפר שמריהו","en":"Municipal Conservatorium, Kfar Shmaryahu","ar":"المعهد الموسيقي البلدي، كفار شمرياهو","ru":"Городская консерватория, Кфар-Шмарьягу"}', '04-9968532', 'beitmozart@gmail.com', 'https://www.kfar-saba.muni.il/', NULL, '{"sourceId": 36, "about": {"he": "קונסרבטוריון המוסיקה והמחול של כפר סבא ממוקם ברח'''' ירושלים 35, קרית ספיר. מציע חינוך מוסיקלי ולימודי מחול לכל הגילאים. מוסד מוכר ע\"י משרד החינוך.", "en": "The Kfar Saba Music and Dance Conservatory is located at 35 Jerusalem St., Kiryat Sapir. Offers music education and dance studies for all ages. Recognized by the Ministry of Education.", "ar": "كونسرفاتوار الموسيقى والرقص في كفار سابا يقع في شارع القدس 35، كريات سفير. يقدم تعليم الموسيقى ودراسات الرقص لجميع الأعمار. معترف به من قبل وزارة التربية والتعليم.", "ru": "Консерватория музыки и танца Кфар-Сабы расположена по адресу: ул. Иерусалим, 35, Кирьят-Сапир. Предлагает музыкальное образование и обучение танцам для всех возрастов. Признана Министерством образования."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ירכא", "cityEn": "Yarka", "coordinates": {"lat": 32.1748, "lng": 34.9071}}, "translations": {"en": {"name": "Kfar Saba Conservatory for Music and Dance", "city": "Yarka", "address": "Municipal Conservatorium, Kfar Shmaryahu", "about": "The Kfar Saba Music and Dance Conservatory is located at 35 Jerusalem St., Kiryat Sapir. Offers music education and dance studies for all ages. Recognized by the Ministry of Education."}, "ar": {"name": "يارا - الفولكلور والفن الدرزي", "city": "يركا", "address": "المعهد الموسيقي البلدي، كفار شمرياهو", "about": "كونسرفاتوار الموسيقى والرقص في كفار سابا يقع في شارع القدس 35، كريات سفير. يقدم تعليم الموسيقى ودراسات الرقص لجميع الأعمار. معترف به من قبل وزارة التربية والتعليم."}, "ru": {"name": "Яра - Друзский фольклор и искусство", "city": "Ярка", "address": "Городская консерватория, Кфар-Шмарьягу", "about": "Консерватория музыки и танца Кфар-Сабы расположена по адресу: ул. Иерусалим, 35, Кирьят-Сапир. Предлагает музыкальное образование и обучение танцам для всех возрастов. Признана Министерством образования."}}}'),
('a1000000-0000-0000-0000-000000000037', '{"he":"הקונסרבטוריון למוסיקה ולמחול, כפר סבא","en":"Kfar Saba Conservatory for Music and Dance","ar":"المجلس المحلي كفار فراديم","ru":"Местный совет Кфар-Врадим"}', 'כפר ורדים', '{"he":"כפר ורדים","en":"Kfar Vradim","ar":"كفار فراديم","ru":"Кфар-Врадим"}', 'הקונסרבטוריון העירוני, לוד', '{"he":"הקונסרבטוריון העירוני, לוד","en":"Municipal Conservatorium, Lod","ar":"المعهد الموسيقي البلدي، اللد","ru":"Городская консерватория, Лод"}', '04-9979131', 'reuvenmalach@gmail.com', 'https://www.kfar-saba.muni.il/', NULL, '{"sourceId": 37, "about": {"he": "קונסרבטוריון המוסיקה והמחול של כפר סבא ממוקם ברח'''' ירושלים 35, קרית ספיר. מציע חינוך מוסיקלי ולימודי מחול לכל הגילאים. מוסד מוכר ע\"י משרד החינוך.", "en": "The Kfar Saba Music and Dance Conservatory is located at 35 Jerusalem St., Kiryat Sapir. Offers music education and dance studies for all ages. Recognized by the Ministry of Education.", "ar": "كونسرفاتوار الموسيقى والرقص في كفار سابا يقع في شارع القدس 35، كريات سفير. يقدم تعليم الموسيقى ودراسات الرقص لجميع الأعمار. معترف به من قبل وزارة التربية والتعليم.", "ru": "Консерватория музыки и танца Кфар-Сабы расположена по адресу: ул. Иерусалим, 35, Кирьят-Сапир. Предлагает музыкальное образование и обучение танцам для всех возрастов. Признана Министерством образования."}, "photoUrls": [], "logoUrl": null, "location": {"city": "כפר ורדים", "cityEn": "Kfar Vradim", "coordinates": {"lat": 32.1748, "lng": 34.9071}}, "translations": {"en": {"name": "Kfar Saba Conservatory for Music and Dance", "city": "Kfar Vradim", "address": "Municipal Conservatorium, Lod", "about": "The Kfar Saba Music and Dance Conservatory is located at 35 Jerusalem St., Kiryat Sapir. Offers music education and dance studies for all ages. Recognized by the Ministry of Education."}, "ar": {"name": "المجلس المحلي كفار فراديم", "city": "كفار فراديم", "address": "المعهد الموسيقي البلدي، اللد", "about": "كونسرفاتوار الموسيقى والرقص في كفار سابا يقع في شارع القدس 35، كريات سفير. يقدم تعليم الموسيقى ودراسات الرقص لجميع الأعمار. معترف به من قبل وزارة التربية والتعليم."}, "ru": {"name": "Местный совет Кфар-Врадим", "city": "Кфар-Врадим", "address": "Городская консерватория, Лод", "about": "Консерватория музыки и танца Кфар-Сабы расположена по адресу: ул. Иерусалим, 35, Кирьят-Сапир. Предлагает музыкальное образование и обучение танцам для всех возрастов. Признана Министерством образования."}}}'),
('a1000000-0000-0000-0000-000000000038', '{"he":"קונסרבטוריון כרמיאל","en":"Karmiel Conservatory","ar":"شركة المؤسسات التعليمية والتجديد","ru":"Компания образовательных учреждений и обновления"}', 'כפר יונה', '{"he":"כפר יונה","en":"Kfar Yona","ar":"كفار يونا","ru":"Кфар-Йона"}', 'הקונסרבטוריון העירוני, מבואות עירון', '{"he":"הקונסרבטוריון העירוני, מבואות עירון","en":"Municipal Conservatorium, Mevo''ot Iron","ar":"المعهد الموسيقي البلدي، مبوؤت عيرون","ru":"Городская консерватория, Мевоот-Ирон"}', '09-8985111', 'musica@mky.co.il', 'https://www.conskarmiel.net/', NULL, '{"sourceId": 38, "about": {"he": "קונסרבטוריון עירוני כרמיאל, מציע לימוד מגוון כלי נגינה.", "en": "Karmiel municipal conservatory, offering instruction on a variety of instruments.", "ar": "كونسرفاتوار كرميئيل البلدي، يقدم تعليم مجموعة متنوعة من الآلات الموسيقية.", "ru": "Муниципальная консерватория Кармиэля, предлагающая обучение на различных инструментах."}, "photoUrls": [], "logoUrl": null, "location": {"city": "כפר יונה", "cityEn": "Kfar Yona", "coordinates": {"lat": 32.916, "lng": 35.2972}}, "translations": {"en": {"name": "Karmiel Conservatory", "city": "Kfar Yona", "address": "Municipal Conservatorium, Mevo''''ot Iron", "about": "Karmiel municipal conservatory, offering instruction on a variety of instruments."}, "ar": {"name": "شركة المؤسسات التعليمية والتجديد", "city": "كفار يونا", "address": "المعهد الموسيقي البلدي، مبوؤت عيرون", "about": "كونسرفاتوار كرميئيل البلدي، يقدم تعليم مجموعة متنوعة من الآلات الموسيقية."}, "ru": {"name": "Компания образовательных учреждений и обновления", "city": "Кфар-Йона", "address": "Городская консерватория, Мевоот-Ирон", "about": "Муниципальная консерватория Кармиэля, предлагающая обучение на различных инструментах."}}}'),
('a1000000-0000-0000-0000-000000000039', '{"he":"קונסרבטוריון לב השרון","en":"Lev HaSharon Conservatory","ar":"الشركة البلدية لثقافة الترفيه","ru":"Муниципальная компания культуры досуга"}', 'כפר סבא', '{"he":"כפר סבא","en":"Kfar Saba","ar":"كفار سابا","ru":"Кфар-Саба"}', 'הקונסרבטוריון העירוני, מבשרת ציון', '{"he":"הקונסרבטוריון העירוני, מבשרת ציון","en":"Municipal Conservatorium, Mevaseret Zion","ar":"المعهد الموسيقي البلدي، مفاسيرت تسيون","ru":"Городская консерватория, Мевасерет-Цион"}', '09-7640740', 'ofereh@ksaba.co.il;Nirn@ksaba.co.il;SimchaT@ksaba.co.il', 'https://www.ksaba.co.il/', NULL, '{"sourceId": 39, "about": {"he": "קונסרבטוריון מועצת לב השרון.", "en": "Lev HaSharon Regional Council conservatory.", "ar": "كونسرفاتوار مجلس لب هشارون الإقليمي.", "ru": "Консерватория регионального совета Лев а-Шарон."}, "photoUrls": [], "logoUrl": null, "location": {"city": "כפר סבא", "cityEn": "Kfar Saba", "coordinates": {"lat": 32.33, "lng": 34.92}}, "translations": {"en": {"name": "Lev HaSharon Conservatory", "city": "Kfar Saba", "address": "Municipal Conservatorium, Mevaseret Zion", "about": "Lev HaSharon Regional Council conservatory."}, "ar": {"name": "الشركة البلدية لثقافة الترفيه", "city": "كفار سابا", "address": "المعهد الموسيقي البلدي، مفاسيرت تسيون", "about": "كونسرفاتوار مجلس لب هشارون الإقليمي."}, "ru": {"name": "Муниципальная компания культуры досуга", "city": "Кфар-Саба", "address": "Городская консерватория, Мевасерет-Цион", "about": "Консерватория регионального совета Лев а-Шарон."}}}'),
('a1000000-0000-0000-0000-000000000040', '{"he":"קונסרבטוריון תבור","en":"Tavor Conservatory","ar":"بلدية كرميئيل","ru":"Муниципалитет Кармиэля"}', 'כרמיאל', '{"he":"כרמיאל","en":"Karmiel","ar":"كرميئيل","ru":"Кармиэль"}', 'הקונסרבטוריון העירוני, מודיעין מכבים רעות', '{"he":"הקונסרבטוריון העירוני, מודיעין מכבים רעות","en":"Municipal Conservatorium, Modi''in Maccabim Re''ut","ar":"المعهد الموسيقي البلدي، موديعين مكابيم ريعوت","ru":"Городская консерватория, Модиин-Маккабим-Реут"}', '04-9580443', 'dianabucur@gmail.com', NULL, NULL, '{"sourceId": 40, "about": {"he": "קונסרבטוריון עמק יזרעאל.", "en": "Jezreel Valley conservatory.", "ar": "كونسرفاتوار وادي يزرعيل.", "ru": "Консерватория Изреэльской долины."}, "photoUrls": [], "logoUrl": null, "location": {"city": "כרמיאל", "cityEn": "Karmiel", "coordinates": {"lat": 32.69, "lng": 35.43}}, "translations": {"en": {"name": "Tavor Conservatory", "city": "Karmiel", "address": "Municipal Conservatorium, Modi''''in Maccabim Re''''ut", "about": "Jezreel Valley conservatory."}, "ar": {"name": "بلدية كرميئيل", "city": "كرميئيل", "address": "المعهد الموسيقي البلدي، موديعين مكابيم ريعوت", "about": "كونسرفاتوار وادي يزرعيل."}, "ru": {"name": "Муниципалитет Кармиэля", "city": "Кармиэль", "address": "Городская консерватория, Модиин-Маккабим-Реут", "about": "Консерватория Изреэльской долины."}}}'),
('a1000000-0000-0000-0000-000000000041', '{"he":"קונסרבטוריון מודיעין-מכבים-רעות","en":"Modi''in-Maccabim-Re''ut Conservatory","ar":"مؤسسة مبوؤت عيرون التعليمية","ru":"Образовательное учреждение Мевоот-Ирон"}', 'מבואות עירון', '{"he":"מבואות עירון","en":"Mevo''ot Iron","ar":"مبوؤت عيرون","ru":"Мевоот-Ирон"}', 'הקונסרבטוריון העירוני, מזכרת בתיה', '{"he":"הקונסרבטוריון העירוני, מזכרת בתיה","en":"Municipal Conservatorium, Mazkeret Batya","ar":"المعهد الموسيقي البلدي، مزكيرت باتيا","ru":"Городская консерватория, Мазкерет-Батья"}', '04-6238121', 'shyoren1@gmail.com', 'https://music.modiin.matnasim.co.il/', NULL, '{"sourceId": 41, "about": {"he": "מרכז מוסיקה עירוני מודיעין, מינהל הקהילה ומנהלי התרבות בר\"מ ל\"צ.", "en": "Modi''in Municipal Music Center, Community Administration and Cultural Directors.", "ar": "مركز الموسيقى البلدي في موديعين، إدارة المجتمع ومديري الثقافة.", "ru": "Муниципальный музыкальный центр Модиина, Общинное управление и руководство культурой."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מבואות עירון", "cityEn": "Mevo''''ot Iron", "coordinates": {"lat": 31.8939, "lng": 35.0102}}, "translations": {"en": {"name": "Modi''''in-Maccabim-Re''''ut Conservatory", "city": "Mevo''''ot Iron", "address": "Municipal Conservatorium, Mazkeret Batya", "about": "Modi''in Municipal Music Center, Community Administration and Cultural Directors."}, "ar": {"name": "مؤسسة مبوؤت عيرون التعليمية", "city": "مبوؤت عيرون", "address": "المعهد الموسيقي البلدي، مزكيرت باتيا", "about": "مركز الموسيقى البلدي في موديعين، إدارة المجتمع ومديري الثقافة."}, "ru": {"name": "Образовательное учреждение Мевоот-Ирон", "city": "Мевоот-Ирон", "address": "Городская консерватория, Мазкерет-Батья", "about": "Муниципальный музыкальный центр Модиина, Общинное управление и руководство культурой."}}}'),
('a1000000-0000-0000-0000-000000000042', '{"he":"קונסרבטוריון מרום הגליל","en":"Marom HaGalil Conservatory","ar":"مفاسيرت تسيون","ru":"Мевасерет-Цион"}', 'מבשרת ציון', '{"he":"מבשרת ציון","en":"Mevaseret Zion","ar":"مفاسيرت تسيون","ru":"Мевасерет-Цион"}', 'הקונסרבטוריון העירוני, מטה אשר', '{"he":"הקונסרבטוריון העירוני, מטה אשר","en":"Municipal Conservatorium, Mateh Asher","ar":"المعهد الموسيقي البلدي، مطيه آشر","ru":"Городская консерватория, Мате-Ашер"}', NULL, 'yizharmusicon@gmail.com', NULL, NULL, '{"sourceId": 42, "about": {"he": "קונסרבטוריון מועצה מרום הגליל.", "en": "Merom HaGalil Regional Council conservatory.", "ar": "كونسرفاتوار مجلس مروم الجليل الإقليمي.", "ru": "Консерватория регионального совета Мером а-Галиль."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מבשרת ציון", "cityEn": "Mevaseret Zion", "coordinates": {"lat": 33.05, "lng": 35.5}}, "translations": {"en": {"name": "Marom HaGalil Conservatory", "city": "Mevaseret Zion", "address": "Municipal Conservatorium, Mateh Asher", "about": "Merom HaGalil Regional Council conservatory."}, "ar": {"name": "مفاسيرت تسيون", "city": "مفاسيرت تسيون", "address": "المعهد الموسيقي البلدي، مطيه آشر", "about": "كونسرفاتوار مجلس مروم الجليل الإقليمي."}, "ru": {"name": "Мевасерет-Цион", "city": "Мевасерет-Цион", "address": "Городская консерватория, Мате-Ашер", "about": "Консерватория регионального совета Мером а-Галиль."}}}'),
('a1000000-0000-0000-0000-000000000043', '{"he":"קונסרבטוריון מסד/מנשה","en":"Mossad/Manashe Conservatory","ar":"سحلفيم - الجمعية البلدية للمركز الجماهيري موديعين مكابيم ريعوت","ru":"Сахлавим - Муниципальная ассоциация общинного центра Модиина"}', 'מודיעין-מכבים-רעות', '{"he":"מודיעין-מכבים-רעות","en":"Modi''in-Maccabim-Re''ut","ar":"موديعين - مكابيم - ريعوت","ru":"Модиин-Маккабим-Реут"}', 'הקונסרבטוריון העירוני, מטה יהודה', '{"he":"הקונסרבטוריון העירוני, מטה יהודה","en":"Municipal Conservatorium, Mateh Yehuda","ar":"المعهد الموسيقي البلدي، مطيه يهودا","ru":"Городская консерватория, Мате-Иегуда"}', '08-9702210', 'music@modiin.matnasim.co.il', 'https://www.modiin.matnasim.co.il/', NULL, '{"sourceId": 43, "about": {"he": "קונסרבטוריון מועצת מנשה.", "en": "Menashe Regional Council conservatory.", "ar": "كونسرفاتوار مجلس منشه الإقليمي.", "ru": "Консерватория регионального совета Менаше."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מודיעין-מכבים-רעות", "cityEn": "Modi''''in-Maccabim-Re''''ut", "coordinates": {"lat": 32.58, "lng": 35.02}}, "translations": {"en": {"name": "Mossad/Manashe Conservatory", "city": "Modi''''in-Maccabim-Re''''ut", "address": "Municipal Conservatorium, Mateh Yehuda", "about": "Menashe Regional Council conservatory."}, "ar": {"name": "سحلفيم - الجمعية البلدية للمركز الجماهيري موديعين مكابيم ريعوت", "city": "موديعين - مكابيم - ريعوت", "address": "المعهد الموسيقي البلدي، مطيه يهودا", "about": "كونسرفاتوار مجلس منشه الإقليمي."}, "ru": {"name": "Сахлавим - Муниципальная ассоциация общинного центра Модиина", "city": "Модиин-Маккабим-Реут", "address": "Городская консерватория, Мате-Иегуда", "about": "Консерватория регионального совета Менаше."}}}'),
('a1000000-0000-0000-0000-000000000044', '{"he":"קונסרבטוריון מטה יהודה","en":"Mateh Yehuda Conservatory","ar":"شركة تشغيل البرامج التعليمية والثقافية في مزكيرت باتيا","ru":"Компания по реализации образовательных программ в Мазкерет-Батья"}', 'מזכרת בתיה', '{"he":"מזכרת בתיה","en":"Mazkeret Batya","ar":"مزكيرت باتيا","ru":"Мазкерет-Батья"}', 'הקונסרבטוריון העירוני, מעלה אדומים', '{"he":"הקונסרבטוריון העירוני, מעלה אדומים","en":"Municipal Conservatorium, Ma''ale Adumim","ar":"المعهد الموسيقي البلدي، معاليه أدوميم","ru":"Городская консерватория, Маале-Адумим"}', NULL, 'nataliakatz61@gmail.com', 'https://www.m-yehuda.org.il/', NULL, '{"sourceId": 44, "about": {"he": "קונסרבטוריון מועצת מטה יהודה.", "en": "Mateh Yehuda Regional Council conservatory.", "ar": "كونسرفاتوار مجلس مطه يهودا الإقليمي.", "ru": "Консерватория регионального совета Мате-Йехуда."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מזכרת בתיה", "cityEn": "Mazkeret Batya", "coordinates": {"lat": 31.71, "lng": 35.02}}, "translations": {"en": {"name": "Mateh Yehuda Conservatory", "city": "Mazkeret Batya", "address": "Municipal Conservatorium, Ma''''ale Adumim", "about": "Mateh Yehuda Regional Council conservatory."}, "ar": {"name": "شركة تشغيل البرامج التعليمية والثقافية في مزكيرت باتيا", "city": "مزكيرت باتيا", "address": "المعهد الموسيقي البلدي، معاليه أدوميم", "about": "كونسرفاتوار مجلس مطه يهودا الإقليمي."}, "ru": {"name": "Компания по реализации образовательных программ в Мазкерет-Батья", "city": "Мазкерет-Батья", "address": "Городская консерватория, Маале-Адумим", "about": "Консерватория регионального совета Мате-Йехуда."}}}'),
('a1000000-0000-0000-0000-000000000045', '{"he":"קונסרבטוריון מעלה אדומים א","en":"Ma''ale Adumim Conservatory A","ar":"مطيه آشر","ru":"Мате-Ашер"}', 'מטה אשר', '{"he":"מטה אשר","en":"Mateh Asher","ar":"مطيه آشر","ru":"Мате-Ашер"}', 'הקונסרבטוריון העירוני, מעלות תרשיחא', '{"he":"הקונסרבטוריון העירוני, מעלות תרשיחא","en":"Municipal Conservatorium, Ma''alot-Tarshiha","ar":"المعهد الموسيقي البلدي، معلوت ترشيحا","ru":"Городская консерватория, Маалот-Таршиха"}', '04-9109011', 'menachemg@mta.org.il', 'https://www.mta.org.il/', NULL, '{"sourceId": 45, "about": {"he": "קונסרבטוריון מעלה אדומים.", "en": "Ma''ale Adumim conservatory.", "ar": "كونسرفاتوار معاليه أدوميم.", "ru": "Консерватория Маале-Адумим."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מטה אשר", "cityEn": "Mateh Asher", "coordinates": {"lat": 31.7731, "lng": 35.2983}}, "translations": {"en": {"name": "Ma''''ale Adumim Conservatory A", "city": "Mateh Asher", "address": "Municipal Conservatorium, Ma''''alot-Tarshiha", "about": "Ma''ale Adumim conservatory."}, "ar": {"name": "مطيه آشر", "city": "مطيه آشر", "address": "المعهد الموسيقي البلدي، معلوت ترشيحا", "about": "كونسرفاتوار معاليه أدوميم."}, "ru": {"name": "Мате-Ашер", "city": "Мате-Ашер", "address": "Городская консерватория, Маалот-Таршиха", "about": "Консерватория Маале-Адумим."}}}'),
('a1000000-0000-0000-0000-000000000046', '{"he":"קונסרבטוריון מעלה אדומים ב","en":"Ma''ale Adumim Conservatory B","ar":"المجلس الإقليمي مطيه يهودا - معهد ياد حريف الموسيقي","ru":"Р.С. Мате-Иегуда - Консерватория Яд Хариф"}', 'מטה יהודה-יד חריף', '{"he":"מטה יהודה-יד חריף","en":"Mateh Yehuda - Yad Harif","ar":"مطيه يهودا - ياد حريف","ru":"Мате-Иегуда - Яд Хариф"}', 'הקונסרבטוריון העירוני, מצפה רמון', '{"he":"הקונסרבטוריון העירוני, מצפה רמון","en":"Municipal Conservatorium, Mitzpe Ramon","ar":"المعهد الموسيقي البلدي، متسبي رامون","ru":"Городская консерватория, Мицпе-Рамон"}', '02-5798343', 'yadharif.cons@m-yehuda.org.il;taob100@gmail.com', 'https://www.m-yehuda.org.il/', NULL, '{"sourceId": 46, "about": {"he": "ענף נוסף של הקונסרבטוריון במעלה אדומים.", "en": "An additional branch of the Ma''ale Adumim conservatory.", "ar": "فرع إضافي للكونسرفاتوار في معاليه أدوميم.", "ru": "Дополнительный филиал консерватории Маале-Адумим."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מטה יהודה-יד חריף", "cityEn": "Mateh Yehuda - Yad Harif", "coordinates": {"lat": 31.7731, "lng": 35.2983}}, "translations": {"en": {"name": "Ma''''ale Adumim Conservatory B", "city": "Mateh Yehuda - Yad Harif", "address": "Municipal Conservatorium, Mitzpe Ramon", "about": "An additional branch of the Ma''ale Adumim conservatory."}, "ar": {"name": "المجلس الإقليمي مطيه يهودا - معهد ياد حريف الموسيقي", "city": "مطيه يهودا - ياد حريف", "address": "المعهد الموسيقي البلدي، متسبي رامون", "about": "فرع إضافي للكونسرفاتوار في معاليه أدوميم."}, "ru": {"name": "Р.С. Мате-Иегуда - Консерватория Яд Хариф", "city": "Мате-Иегуда - Яд Хариф", "address": "Городская консерватория, Мицпе-Рамон", "about": "Дополнительный филиал консерватории Маале-Адумим."}}}'),
('a1000000-0000-0000-0000-000000000047', '{"he":"קונסרבטוריון מעלות-תרשיחא","en":"Ma''alot-Tarshiha Conservatory","ar":"مركز الموسيقى تسور هداسا","ru":"Музыкальный центр Цур-Хадасса"}', 'צור הדסה', '{"he":"צור הדסה","en":"Tzur Hadassah","ar":"تسور هداسا","ru":"Цур-Хадасса"}', 'הקונסרבטוריון העירוני, מרום הגליל', '{"he":"הקונסרבטוריון העירוני, מרום הגליל","en":"Municipal Conservatorium, Merom HaGalil","ar":"المعهد الموسيقي البلدي، مروم الجليل","ru":"Городская консерватория, Мером-а-Галиль"}', '00-3767373', 'zhuravel7@gmail.com', NULL, NULL, '{"sourceId": 47, "about": {"he": "קונסרבטוריון מעלות-תרשיחא.", "en": "Ma''alot-Tarshiha conservatory.", "ar": "كونسرفاتوار معالوت ترشيحا.", "ru": "Консерватория Маалот-Таршиха."}, "photoUrls": [], "logoUrl": null, "location": {"city": "צור הדסה", "cityEn": "Tzur Hadassah", "coordinates": {"lat": 33.015, "lng": 35.2706}}, "translations": {"en": {"name": "Ma''''alot-Tarshiha Conservatory", "city": "Tzur Hadassah", "address": "Municipal Conservatorium, Merom HaGalil", "about": "Ma''alot-Tarshiha conservatory."}, "ar": {"name": "مركز الموسيقى تسور هداسا", "city": "تسور هداسا", "address": "المعهد الموسيقي البلدي، مروم الجليل", "about": "كونسرفاتوار معالوت ترشيحا."}, "ru": {"name": "Музыкальный центр Цур-Хадасса", "city": "Цур-Хадасса", "address": "Городская консерватория, Мером-а-Галиль", "about": "Консерватория Маалот-Таршиха."}}}'),
('a1000000-0000-0000-0000-000000000048', '{"he":"קונסרבטוריון מטה אשר","en":"Mateh Asher Conservatory","ar":"بلدية معاليه أدوميم","ru":"Муниципалитет Маале-Адумим"}', 'מעלה אדומים', '{"he":"מעלה אדומים","en":"Ma''ale Adumim","ar":"معاليه أدوميم","ru":"Маале-Адумим"}', 'הקונסרבטוריון העירוני, נהריה', '{"he":"הקונסרבטוריון העירוני, נהריה","en":"Municipal Conservatorium, Nahariya","ar":"المعهد الموسيقي البلدي، نهاريا","ru":"Городская консерватория, Нагария"}', '02-5798343', 'nata_k59@walla.co.il', NULL, NULL, '{"sourceId": 48, "about": {"he": "קונסרבטוריון מועצה מטה אשר.", "en": "Mateh Asher Regional Council conservatory.", "ar": "كونسرفاتوار مجلس مطه أشير الإقليمي.", "ru": "Консерватория регионального совета Мате-Ашер."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מעלה אדומים", "cityEn": "Ma''''ale Adumim", "coordinates": {"lat": 33, "lng": 35.15}}, "translations": {"en": {"name": "Mateh Asher Conservatory", "city": "Ma''''ale Adumim", "address": "Municipal Conservatorium, Nahariya", "about": "Mateh Asher Regional Council conservatory."}, "ar": {"name": "بلدية معاليه أدوميم", "city": "معاليه أدوميم", "address": "المعهد الموسيقي البلدي، نهاريا", "about": "كونسرفاتوار مجلس مطه أشير الإقليمي."}, "ru": {"name": "Муниципалитет Маале-Адумим", "city": "Маале-Адумим", "address": "Городская консерватория, Нагария", "about": "Консерватория регионального совета Мате-Ашер."}}}'),
('a1000000-0000-0000-0000-000000000049', '{"he":"קונסרבטוריון מרום הגליל ב","en":"Marom HaGalil Conservatory B","ar":"مركز مجتمعي في معالوت على اسم جرس","ru":"Общинный центр в Маалоте им. Гереса"}', 'מעלות-גרס', '{"he":"מעלות-גרס","en":"Ma''alot - Geres","ar":"معالوت - جرس","ru":"Маалот - Герес"}', 'הקונסרבטוריון העירוני, נוף הגליל', '{"he":"הקונסרבטוריון העירוני, נוף הגליל","en":"Municipal Conservatorium, Nof HaGalil","ar":"المعهد الموسيقي البلدي، نوف هجليل","ru":"Городская консерватория, Ноф-а-Галиль"}', NULL, 'eranelbar1@gmail.com;music@maalot.matnasim.co.il', 'https://www.maalot.matnasim.co.il/', NULL, '{"sourceId": 49, "about": {"he": "ענף נוסף של קונסרבטוריון מרום הגליל.", "en": "An additional branch of the Merom HaGalil conservatory.", "ar": "فرع إضافي لكونسرفاتوار مروم الجليل.", "ru": "Дополнительный филиал консерватории Мером а-Галиль."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מעלות-גרס", "cityEn": "Ma''''alot - Geres", "coordinates": {"lat": 33.05, "lng": 35.5}}, "translations": {"en": {"name": "Marom HaGalil Conservatory B", "city": "Ma''''alot - Geres", "address": "Municipal Conservatorium, Nof HaGalil", "about": "An additional branch of the Merom HaGalil conservatory."}, "ar": {"name": "مركز مجتمعي في معالوت على اسم جرس", "city": "معالوت - جرس", "address": "المعهد الموسيقي البلدي، نوف هجليل", "about": "فرع إضافي لكونسرفاتوار مروم الجليل."}, "ru": {"name": "Общинный центр в Маалоте им. Гереса", "city": "Маалот - Герес", "address": "Городская консерватория, Ноф-а-Галиль", "about": "Дополнительный филиал консерватории Мером а-Галиль."}}}'),
('a1000000-0000-0000-0000-000000000050', '{"he":"קונסרבטוריון מרחבים","en":"Merhavim Conservatory","ar":"المعهد الموسيقي البلدي كاترينا معالوت ترشيحا","ru":"Муниципальная консерватория Катарина Маалот-Таршиха"}', 'מעלות-קתרין', '{"he":"מעלות-קתרין","en":"Ma''alot - Tarshiha","ar":"معالوت - كاترين","ru":"Маалот - Таршиха"}', 'הקונסרבטוריון העירוני, נס ציונה', '{"he":"הקונסרבטוריון העירוני, נס ציונה","en":"Municipal Conservatorium, Ness Ziona","ar":"المعهد الموسيقي البلدي، نيس تسيونا","ru":"Городская консерватория, Нес-Циона"}', '04-9570937', 'taisserh@gmail.com', NULL, NULL, '{"sourceId": 50, "about": {"he": "קונסרבטוריון מועצת מרחבים.", "en": "Merhavim Regional Council conservatory.", "ar": "كونسرفاتوار مجلس مرحافيم الإقليمي.", "ru": "Консерватория регионального совета Мерхавим."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מעלות-קתרין", "cityEn": "Ma''''alot - Tarshiha", "coordinates": {"lat": 31.28, "lng": 34.65}}, "translations": {"en": {"name": "Merhavim Conservatory", "city": "Ma''''alot - Tarshiha", "address": "Municipal Conservatorium, Ness Ziona", "about": "Merhavim Regional Council conservatory."}, "ar": {"name": "المعهد الموسيقي البلدي كاترينا معالوت ترشيحا", "city": "معالوت - كاترين", "address": "المعهد الموسيقي البلدي، نيس تسيونا", "about": "كونسرفاتوار مجلس مرحافيم الإقليمي."}, "ru": {"name": "Муниципальная консерватория Катарина Маалот-Таршиха", "city": "Маалот - Таршиха", "address": "Городская консерватория, Нес-Циона", "about": "Консерватория регионального совета Мерхавим."}}}'),
('a1000000-0000-0000-0000-000000000051', '{"he":"קונסרבטוריון מישגב","en":"Misgav Conservatory","ar":"المجلس الإقليمي ماروم الجليل","ru":"Региональный совет Мером-а-Галиль"}', 'מרום הגליל', '{"he":"מרום הגליל","en":"Merom HaGalil","ar":"ماروم الجليل","ru":"Мером-а-Галиль"}', 'הקונסרבטוריון העירוני, נשר', '{"he":"הקונסרבטוריון העירוני, נשר","en":"Municipal Conservatorium, Nesher","ar":"المعهد الموسيقي البلدي، نيشر","ru":"Городская консерватория, Нешер"}', NULL, 'dorvek@gmail.com', 'https://www.misgav.org.il/', NULL, '{"sourceId": 51, "about": {"he": "קונסרבטוריון מועצת מישגב.", "en": "Misgav Regional Council conservatory.", "ar": "كونسرفاتوار مجلس مسغاف الإقليمي.", "ru": "Консерватория регионального совета Мисгав."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מרום הגליל", "cityEn": "Merom HaGalil", "coordinates": {"lat": 32.89, "lng": 35.24}}, "translations": {"en": {"name": "Misgav Conservatory", "city": "Merom HaGalil", "address": "Municipal Conservatorium, Nesher", "about": "Misgav Regional Council conservatory."}, "ar": {"name": "المجلس الإقليمي ماروم الجليل", "city": "ماروم الجليل", "address": "المعهد الموسيقي البلدي، نيشر", "about": "كونسرفاتوار مجلس مسغاف الإقليمي."}, "ru": {"name": "Региональный совет Мером-а-Галиль", "city": "Мером-а-Галиль", "address": "Городская консерватория, Нешер", "about": "Консерватория регионального совета Мисгав."}}}'),
('a1000000-0000-0000-0000-000000000052', '{"he":"קונסרבטוריון נהריה","en":"Nahariya Conservatory","ar":"المجلس الإقليمي مرحافيم","ru":"Региональный совет Мерхавим"}', 'מרחבים', '{"he":"מרחבים","en":"Merhavim","ar":"مرحافيم","ru":"Мерхавим"}', 'הקונסרבטוריון העירוני, נתניה', '{"he":"הקונסרבטוריון העירוני, נתניה","en":"Municipal Conservatorium, Netanya","ar":"المعهد الموسيقي البلدي، نتانيا","ru":"Городская консерватория, Нетания"}', '08-9929420', 'zerlina999@gmail.com', NULL, NULL, '{"sourceId": 52, "about": {"he": "קונסרבטוריון עירוני נהריה.", "en": "Nahariya municipal conservatory.", "ar": "كونسرفاتوار نهاريا البلدي.", "ru": "Муниципальная консерватория Нагарии."}, "photoUrls": [], "logoUrl": null, "location": {"city": "מרחבים", "cityEn": "Merhavim", "coordinates": {"lat": 33.0097, "lng": 35.0986}}, "translations": {"en": {"name": "Nahariya Conservatory", "city": "Merhavim", "address": "Municipal Conservatorium, Netanya", "about": "Nahariya municipal conservatory."}, "ar": {"name": "المجلس الإقليمي مرحافيم", "city": "مرحافيم", "address": "المعهد الموسيقي البلدي، نتانيا", "about": "كونسرفاتوار نهاريا البلدي."}, "ru": {"name": "Региональный совет Мерхавим", "city": "Мерхавим", "address": "Городская консерватория, Нетания", "about": "Муниципальная консерватория Нагарии."}}}'),
('a1000000-0000-0000-0000-000000000053', '{"he":"קונסרבטוריון נהריה ב","en":"Nahariya Conservatory B","ar":"مسجاف الجليل جمعية لتعزيز الاستيطان في الجليل","ru":"Мисгав Ха-Галиль Ассоциация содействия поселению в Галилее"}', 'משגב', '{"he":"משגב","en":"Misgav","ar":"مسجاف","ru":"Мисгав"}', 'הקונסרבטוריון העירוני, עכו', '{"he":"הקונסרבטוריון העירוני, עכו","en":"Municipal Conservatorium, Acre","ar":"المعهد الموسيقي البلدي، عكا","ru":"Городская консерватория, Акко"}', '08-9100499', 'music@misgav.org.il', 'https://www.misgav.org.il/', NULL, '{"sourceId": 53, "about": {"he": "ענף נוסף של הקונסרבטוריון בנהריה.", "en": "An additional branch of the Nahariya conservatory.", "ar": "فرع إضافي للكونسرفاتوار في نهاريا.", "ru": "Дополнительный филиал консерватории Нагарии."}, "photoUrls": [], "logoUrl": null, "location": {"city": "משגב", "cityEn": "Misgav", "coordinates": {"lat": 33.0097, "lng": 35.0986}}, "translations": {"en": {"name": "Nahariya Conservatory B", "city": "Misgav", "address": "Municipal Conservatorium, Acre", "about": "An additional branch of the Nahariya conservatory."}, "ar": {"name": "مسجاف الجليل جمعية لتعزيز الاستيطان في الجليل", "city": "مسجاف", "address": "المعهد الموسيقي البلدي، عكا", "about": "فرع إضافي للكونسرفاتوار في نهاريا."}, "ru": {"name": "Мисгав Ха-Галиль Ассоциация содействия поселению в Галилее", "city": "Мисгав", "address": "Городская консерватория, Акко", "about": "Дополнительный филиал консерватории Нагарии."}}}'),
('a1000000-0000-0000-0000-000000000054', '{"he":"קונסרבטוריון נצרת","en":"Nazareth Conservatory","ar":"بلدية نهاريا","ru":"Муниципалитет Нагарии"}', 'נהרייה', '{"he":"נהרייה","en":"Nahariya","ar":"نهاريا","ru":"Нагария"}', 'הקונסרבטוריון העירוני, עמק הירדן', '{"he":"הקונסרבטוריון העירוני, עמק הירדן","en":"Municipal Conservatorium, Jordan Valley","ar":"المعهد الموسيقي البلدي، غور الأردن","ru":"Городская консерватория, Эмек-а-Ярден"}', NULL, 'reuvenmalach@gmail.com', NULL, NULL, '{"sourceId": 54, "about": {"he": "קונסרבטוריון עירוני נצרת.", "en": "Nazareth municipal conservatory.", "ar": "كونسرفاتوار الناصرة البلدي.", "ru": "Муниципальная консерватория Назарета."}, "photoUrls": [], "logoUrl": null, "location": {"city": "נהרייה", "cityEn": "Nahariya", "coordinates": {"lat": 32.6996, "lng": 35.3035}}, "translations": {"en": {"name": "Nazareth Conservatory", "city": "Nahariya", "address": "Municipal Conservatorium, Jordan Valley", "about": "Nazareth municipal conservatory."}, "ar": {"name": "بلدية نهاريا", "city": "نهاريا", "address": "المعهد الموسيقي البلدي، غور الأردن", "about": "كونسرفاتوار الناصرة البلدي."}, "ru": {"name": "Муниципалитет Нагарии", "city": "Нагария", "address": "Городская консерватория, Эмек-а-Ярден", "about": "Муниципальная консерватория Назарета."}}}'),
('a1000000-0000-0000-0000-000000000055', '{"he":"קונסרבטוריון נס ציונה","en":"Nes Ziona Conservatory","ar":"مؤسسات التربية والثقافة نيس تسيونا","ru":"Учреждения образования и культуры Нес-Ционы"}', 'נס ציונה', '{"he":"נס ציונה","en":"Ness Ziona","ar":"نيس تسيونا","ru":"Нес-Циона"}', 'הקונסרבטוריון העירוני, עמק המעיינות', '{"he":"הקונסרבטוריון העירוני, עמק המעיינות","en":"Municipal Conservatorium, Valley of Springs","ar":"المعهد الموسيقي البلدي، عيمك همعينوت","ru":"Городская консерватория, Эмек-а-Мааянот"}', '08-9100499', 'vladimirk@ktnz.org.il;ran.david@ktnz.org.il', 'https://www.ktnz.org.il/', NULL, '{"sourceId": 55, "about": {"he": "קונסרבטוריון עירוני נס ציונה.", "en": "Ness Ziona municipal conservatory.", "ar": "كونسرفاتوار نيس تسيونا البلدي.", "ru": "Муниципальная консерватория Нес-Ционы."}, "photoUrls": [], "logoUrl": null, "location": {"city": "נס ציונה", "cityEn": "Ness Ziona", "coordinates": {"lat": 31.9303, "lng": 34.798}}, "translations": {"en": {"name": "Nes Ziona Conservatory", "city": "Ness Ziona", "address": "Municipal Conservatorium, Valley of Springs", "about": "Ness Ziona municipal conservatory."}, "ar": {"name": "مؤسسات التربية والثقافة نيس تسيونا", "city": "نيس تسيونا", "address": "المعهد الموسيقي البلدي، عيمك همعينوت", "about": "كونسرفاتوار نيس تسيونا البلدي."}, "ru": {"name": "Учреждения образования и культуры Нес-Ционы", "city": "Нес-Циона", "address": "Городская консерватория, Эмек-а-Мааянот", "about": "Муниципальная консерватория Нес-Ционы."}}}'),
('a1000000-0000-0000-0000-000000000056', '{"he":"הקונסרבטוריון העירוני נתניה","en":"Netanya Municipal Conservatory","ar":"جمعية عود زرياب","ru":"Ассоциация Уд Зирьяб"}', 'נצרת', '{"he":"נצרת","en":"Nazareth","ar":"الناصرة","ru":"Назарет"}', 'הקונסרבטוריון העירוני, עמק יזרעאל', '{"he":"הקונסרבטוריון העירוני, עמק יזרעאל","en":"Municipal Conservatorium, Jezreel Valley","ar":"المعهد الموسيقي البلدي، مرج ابن عامر","ru":"Городская консерватория, Эмек-Изреель"}', '09-8308800', 'sameer.makhoul@gmail.com', 'https://www.netanya-culture.co.il/', NULL, '{"sourceId": 56, "about": {"he": "הקונסרבטוריון העירוני נתניה מופעל תחת מסגרת היכל התרבות העירוני. מנהל תוכנית בתי ספר מנגן בנתניה מ-2003. מונה כ-40 מורים. כולל תזמורת ייצוגית, מקהלת ניצן (תוכנית מצוינות עם משכנות שאננים), תזמורת לאומית לכלי נשיפה לנוער, ומרכז כלי הקשה \"טרמולו\". שלוחה בקריית השרון.", "en": "The Netanya Municipal Conservatory operates under the municipal culture hall. Has managed the \"Playing Schools\" program in Netanya since 2003. Has about 40 teachers. Includes a representative orchestra, Nitzan Choir (excellence program with Mishkenot Sha''ananim), National Youth Wind Orchestra, and \"Tremolo\" percussion center. Branch in Kiryat HaSharon.", "ar": "يعمل كونسرفاتوار نتانيا البلدي تحت إطار قصر الثقافة البلدي. يدير برنامج المدارس العازفة في نتانيا منذ 2003. يضم حوالي 40 معلمًا. يشمل أوركسترا تمثيلية، جوقة نيتسان (برنامج تميّز مع مشكنوت شأنانيم)، أوركسترا وطنية لآلات النفخ للشباب، ومركز الإيقاع \"تريمولو\". فرع في كريات هشارون.", "ru": "Муниципальная консерватория Нетании работает при городском Дворце культуры. С 2003 года управляет программой «Играющие школы» в Нетании. Около 40 преподавателей. Включает представительский оркестр, хор Ницан (программа мастерства с Мишкенот Шаананим), Национальный молодёжный оркестр духовых инструментов и центр ударных «Тремоло». Филиал в Кирьят а-Шарон."}, "photoUrls": [], "logoUrl": null, "location": {"city": "נצרת", "cityEn": "Nazareth", "coordinates": {"lat": 32.3215, "lng": 34.8532}}, "translations": {"en": {"name": "Netanya Municipal Conservatory", "city": "Nazareth", "address": "Municipal Conservatorium, Jezreel Valley", "about": "The Netanya Municipal Conservatory operates under the municipal culture hall. Has managed the \"Playing Schools\" program in Netanya since 2003. Has about 40 teachers. Includes a representative orchestra, Nitzan Choir (excellence program with Mishkenot Sha''ananim), National Youth Wind Orchestra, and \"Tremolo\" percussion center. Branch in Kiryat HaSharon."}, "ar": {"name": "جمعية عود زرياب", "city": "الناصرة", "address": "المعهد الموسيقي البلدي، مرج ابن عامر", "about": "يعمل كونسرفاتوار نتانيا البلدي تحت إطار قصر الثقافة البلدي. يدير برنامج المدارس العازفة في نتانيا منذ 2003. يضم حوالي 40 معلمًا. يشمل أوركسترا تمثيلية، جوقة نيتسان (برنامج تميّز مع مشكنوت شأنانيم)، أوركسترا وطنية لآلات النفخ للشباب، ومركز الإيقاع \"تريمولو\". فرع في كريات هشارون."}, "ru": {"name": "Ассоциация Уд Зирьяб", "city": "Назарет", "address": "Городская консерватория, Эмек-Изреель", "about": "Муниципальная консерватория Нетании работает при городском Дворце культуры. С 2003 года управляет программой «Играющие школы» в Нетании. Около 40 преподавателей. Включает представительский оркестр, хор Ницан (программа мастерства с Мишкенот Шаананим), Национальный молодёжный оркестр духовых инструментов и центр ударных «Тремоло». Филиал в Кирьят а-Шарон."}}}'),
('a1000000-0000-0000-0000-000000000057', '{"he":"הקונסרבטוריון העירוני נתניה","en":"Netanya Municipal Conservatory","ar":"نتيفيم شركة المجتمع والترفيه","ru":"Нетивим Компания общества и досуга"}', 'נתיבות', '{"he":"נתיבות","en":"Netivot","ar":"نتيفوت","ru":"Нетивот"}', 'הקונסרבטוריון העירוני, עמק חפר', '{"he":"הקונסרבטוריון העירוני, עמק חפר","en":"Municipal Conservatorium, Hefer Valley","ar":"المعهد الموسيقي البلدي، عيمك حيفر","ru":"Городская консерватория, Эмек-Хефер"}', '08-9934922', 'elbaz41@gmail.com', 'https://www.netanya-culture.co.il/', NULL, '{"sourceId": 57, "about": {"he": "הקונסרבטוריון העירוני נתניה מופעל תחת מסגרת היכל התרבות העירוני. מנהל תוכנית בתי ספר מנגן בנתניה מ-2003. מונה כ-40 מורים. כולל תזמורת ייצוגית, מקהלת ניצן (תוכנית מצוינות עם משכנות שאננים), תזמורת לאומית לכלי נשיפה לנוער, ומרכז כלי הקשה \"טרמולו\". שלוחה בקריית השרון.", "en": "The Netanya Municipal Conservatory operates under the municipal culture hall. Has managed the \"Playing Schools\" program in Netanya since 2003. Has about 40 teachers. Includes a representative orchestra, Nitzan Choir (excellence program with Mishkenot Sha''ananim), National Youth Wind Orchestra, and \"Tremolo\" percussion center. Branch in Kiryat HaSharon.", "ar": "يعمل كونسرفاتوار نتانيا البلدي تحت إطار قصر الثقافة البلدي. يدير برنامج المدارس العازفة في نتانيا منذ 2003. يضم حوالي 40 معلمًا. يشمل أوركسترا تمثيلية، جوقة نيتسان (برنامج تميّز مع مشكنوت شأنانيم)، أوركسترا وطنية لآلات النفخ للشباب، ومركز الإيقاع \"تريمولو\". فرع في كريات هشارون.", "ru": "Муниципальная консерватория Нетании работает при городском Дворце культуры. С 2003 года управляет программой «Играющие школы» в Нетании. Около 40 преподавателей. Включает представительский оркестр, хор Ницан (программа мастерства с Мишкенот Шаананим), Национальный молодёжный оркестр духовых инструментов и центр ударных «Тремоло». Филиал в Кирьят а-Шарон."}, "photoUrls": [], "logoUrl": null, "location": {"city": "נתיבות", "cityEn": "Netivot", "coordinates": {"lat": 32.3215, "lng": 34.8532}}, "translations": {"en": {"name": "Netanya Municipal Conservatory", "city": "Netivot", "address": "Municipal Conservatorium, Hefer Valley", "about": "The Netanya Municipal Conservatory operates under the municipal culture hall. Has managed the \"Playing Schools\" program in Netanya since 2003. Has about 40 teachers. Includes a representative orchestra, Nitzan Choir (excellence program with Mishkenot Sha''ananim), National Youth Wind Orchestra, and \"Tremolo\" percussion center. Branch in Kiryat HaSharon."}, "ar": {"name": "نتيفيم شركة المجتمع والترفيه", "city": "نتيفوت", "address": "المعهد الموسيقي البلدي، عيمك حيفر", "about": "يعمل كونسرفاتوار نتانيا البلدي تحت إطار قصر الثقافة البلدي. يدير برنامج المدارس العازفة في نتانيا منذ 2003. يضم حوالي 40 معلمًا. يشمل أوركسترا تمثيلية، جوقة نيتسان (برنامج تميّز مع مشكنوت شأنانيم)، أوركسترا وطنية لآلات النفخ للشباب، ومركز الإيقاع \"تريمولو\". فرع في كريات هشارون."}, "ru": {"name": "Нетивим Компания общества и досуга", "city": "Нетивот", "address": "Городская консерватория, Эмек-Хефер", "about": "Муниципальная консерватория Нетании работает при городском Дворце культуры. С 2003 года управляет программой «Играющие школы» в Нетании. Около 40 преподавателей. Включает представительский оркестр, хор Ницан (программа мастерства с Мишкенот Шаананим), Национальный молодёжный оркестр духовых инструментов и центр ударных «Тремоло». Филиал в Кирьят а-Шарон."}}}'),
('a1000000-0000-0000-0000-000000000058', '{"he":"קונסרבטוריון עמק הירדן","en":"Jordan Valley Conservatory","ar":"جمعية قصر الثقافة البلدي نتانيا","ru":"Ассоциация муниципального дворца культуры Нетании"}', 'נתניה', '{"he":"נתניה","en":"Netanya","ar":"نتانيا","ru":"Нетания"}', 'הקונסרבטוריון העירוני, עפולה', '{"he":"הקונסרבטוריון העירוני, עפולה","en":"Municipal Conservatorium, Afula","ar":"المعهد الموسيقي البلدي، العفولة","ru":"Городская консерватория, Афула"}', '09-8308800', 'uri@netanya-culture.co.il', 'https://www.netanya-culture.co.il/', NULL, '{"sourceId": 58, "about": {"he": "קונסרבטוריון עירוני עמק הירדן.", "en": "Emek HaYarden municipal conservatory.", "ar": "كونسرفاتوار وادي الأردن البلدي.", "ru": "Муниципальная консерватория Эмек а-Ярден."}, "photoUrls": [], "logoUrl": null, "location": {"city": "נתניה", "cityEn": "Netanya", "coordinates": {"lat": 32.7, "lng": 35.57}}, "translations": {"en": {"name": "Jordan Valley Conservatory", "city": "Netanya", "address": "Municipal Conservatorium, Afula", "about": "Emek HaYarden municipal conservatory."}, "ar": {"name": "جمعية قصر الثقافة البلدي نتانيا", "city": "نتانيا", "address": "المعهد الموسيقي البلدي، العفولة", "about": "كونسرفاتوار وادي الأردن البلدي."}, "ru": {"name": "Ассоциация муниципального дворца культуры Нетании", "city": "Нетания", "address": "Городская консерватория, Афула", "about": "Муниципальная консерватория Эмек а-Ярден."}}}'),
('a1000000-0000-0000-0000-000000000059', '{"he":"קונסרבטוריון עמק יזרעאל א","en":"Jezreel Valley Conservatory A","ar":"بلدية عكا - المعهد الموسيقي","ru":"Муниципалитет Акко - Консерватория"}', 'עכו', '{"he":"עכו","en":"Acre","ar":"عكا","ru":"Акко"}', 'הקונסרבטוריון העירוני, ערד', '{"he":"הקונסרבטוריון העירוני, ערד","en":"Municipal Conservatorium, Arad","ar":"المعهد الموسيقي البلدي، عراد","ru":"Городская консерватория, Арад"}', '04-9956152', 'rika.lubin@gmail.com;Schwartzneta@gmail.com;dor-v@akko.muni.il', 'https://www.akko.muni.il/', NULL, '{"sourceId": 59, "about": {"he": "קונסרבטוריון מועצת עמק יזרעאל.", "en": "Jezreel Valley Regional Council conservatory.", "ar": "كونسرفاتوار مجلس وادي يزرعيل الإقليمي.", "ru": "Консерватория регионального совета Изреэльской долины."}, "photoUrls": [], "logoUrl": null, "location": {"city": "עכו", "cityEn": "Acre", "coordinates": {"lat": 32.6, "lng": 35.28}}, "translations": {"en": {"name": "Jezreel Valley Conservatory A", "city": "Acre", "address": "Municipal Conservatorium, Arad", "about": "Jezreel Valley Regional Council conservatory."}, "ar": {"name": "بلدية عكا - المعهد الموسيقي", "city": "عكا", "address": "المعهد الموسيقي البلدي، عراد", "about": "كونسرفاتوار مجلس وادي يزرعيل الإقليمي."}, "ru": {"name": "Муниципалитет Акко - Консерватория", "city": "Акко", "address": "Городская консерватория, Арад", "about": "Консерватория регионального совета Изреэльской долины."}}}'),
('a1000000-0000-0000-0000-000000000060', '{"he":"קונסרבטוריון עמק יזרעאל ב","en":"Jezreel Valley Conservatory B","ar":"المجلس الإقليمي غور الأردن","ru":"Региональный совет Эмек-а-Ярден"}', 'עמק הירדן', '{"he":"עמק הירדן","en":"Emek HaYarden","ar":"غور الأردن","ru":"Эмек-а-Ярден"}', 'הקונסרבטוריון העירוני, פרדס חנה כרכור', '{"he":"הקונסרבטוריון העירוני, פרדס חנה כרכור","en":"Municipal Conservatorium, Pardes Hanna-Karkur","ar":"المعهد الموسيقي البلدي، بارديس حنا كركور","ru":"Городская консерватория, Пардес-Хана-Каркур"}', '04-6757628', 'music@j-v.org.il', 'https://www.eyz.org.il/', NULL, '{"sourceId": 60, "about": {"he": "ענף נוסף של קונסרבטוריון עמק יזרעאל.", "en": "An additional branch of the Jezreel Valley conservatory.", "ar": "فرع إضافي لكونسرفاتوار وادي يزرعيل.", "ru": "Дополнительный филиал консерватории Изреэльской долины."}, "photoUrls": [], "logoUrl": null, "location": {"city": "עמק הירדן", "cityEn": "Emek HaYarden", "coordinates": {"lat": 32.6, "lng": 35.28}}, "translations": {"en": {"name": "Jezreel Valley Conservatory B", "city": "Emek HaYarden", "address": "Municipal Conservatorium, Pardes Hanna-Karkur", "about": "An additional branch of the Jezreel Valley conservatory."}, "ar": {"name": "المجلس الإقليمي غور الأردن", "city": "غور الأردن", "address": "المعهد الموسيقي البلدي، بارديس حنا كركور", "about": "فرع إضافي لكونسرفاتوار وادي يزرعيل."}, "ru": {"name": "Региональный совет Эмек-а-Ярден", "city": "Эмек-а-Ярден", "address": "Городская консерватория, Пардес-Хана-Каркур", "about": "Дополнительный филиал консерватории Изреэльской долины."}}}'),
('a1000000-0000-0000-0000-000000000061', '{"he":"קונסרבטוריון עפולה","en":"Afula Conservatory","ar":"المركز الجماهيري عيمك همعينوت","ru":"Общинный центр Эмек-а-Мааянот"}', 'עמק המעיינות', '{"he":"עמק המעיינות","en":"Emek HaMaayanot","ar":"عيمك همعينوت","ru":"Эмек-а-Мааянот"}', 'הקונסרבטוריון העירוני, פתח תקווה', '{"he":"הקונסרבטוריון העירוני, פתח תקווה","en":"Municipal Conservatorium, Petah Tikva","ar":"المعهد الموسيقي البلدي، بيتح تكفا","ru":"Городская консерватория, Петах-Тиква"}', NULL, 'musicenter@maianot.co.il', 'https://www.maianot.co.il/', NULL, '{"sourceId": 61, "about": {"he": "קונסרבטוריון עירוני עפולה.", "en": "Afula municipal conservatory.", "ar": "كونسرفاتوار العفولة البلدي.", "ru": "Муниципальная консерватория Афулы."}, "photoUrls": [], "logoUrl": null, "location": {"city": "עמק המעיינות", "cityEn": "Emek HaMaayanot", "coordinates": {"lat": 32.6074, "lng": 35.2897}}, "translations": {"en": {"name": "Afula Conservatory", "city": "Emek HaMaayanot", "address": "Municipal Conservatorium, Petah Tikva", "about": "Afula municipal conservatory."}, "ar": {"name": "المركز الجماهيري عيمك همعينوت", "city": "عيمك همعينوت", "address": "المعهد الموسيقي البلدي، بيتح تكفا", "about": "كونسرفاتوار العفولة البلدي."}, "ru": {"name": "Общинный центр Эмек-а-Мааянот", "city": "Эмек-а-Мааянот", "address": "Городская консерватория, Петах-Тиква", "about": "Муниципальная консерватория Афулы."}}}'),
('a1000000-0000-0000-0000-000000000062', '{"he":"קונסרבטוריון עירוני פתח תקווה ע\"ש יוסף אחרון","en":"Petah Tikva Municipal Conservatory (Joseph Achron)","ar":"المجلس الإقليمي عيمك يزراعيل","ru":"Региональный совет Изреельской долины"}', 'עמק יזרעאל', '{"he":"עמק יזרעאל","en":"Jezreel Valley","ar":"عيمك يزراعيل","ru":"Изреельская долина"}', 'הקונסרבטוריון העירוני, צפת', '{"he":"הקונסרבטוריון העירוני, צפת","en":"Municipal Conservatorium, Safed","ar":"المعهد الموسيقي البلدي، صفد","ru":"Городская консерватория, Цфат"}', '04-6520112', 'yarivd@eyz.org.il', 'https://www.mcpt.co.il/', NULL, '{"sourceId": 62, "about": {"he": "הקונסרבטוריון העירוני בפתח תקוה ע\"ש יוסף אחרון אשר פועל תחת מינהל החינוך בעיר, הוקם בשנת 1950 והוא אחד המוסדות המובילים בארץ בתחום החינוך המוסיקלי המקצועי. הקונסרבטוריון מהווה מרכז מוסיקלי חינוכי, היוצר אקלים תרבותי-חברתי ייחודי. הלימודים משלבים לימודי נגינה במגוון כלים בהוראה יחידנית, לימודי תיאוריה וספרות המוסיקה, נגינה בהרכבים קאמריים, בתזמורת ושירה במקהלה.", "en": "The Petah Tikva Municipal Conservatory, named after Joseph Achron, operates under the citys Education Administration. Founded in 1950, it is one of the leading institutions in Israel for professional music education. The conservatory serves as a music education center, creating a unique cultural-social environment. Studies combine individual instrument instruction, music theory and literature, chamber ensemble playing, orchestral and choral singing.", "ar": "يعمل كونسرفاتوار بيتح تكفا البلدي، المسمى على اسم يوسف أخرون، تحت إدارة التعليم في المدينة. تأسس عام 1950 وهو من المؤسسات الرائدة في البلاد في مجال التعليم الموسيقي المهني. يشكل الكونسرفاتوار مركزاً تعليمياً موسيقياً يخلق بيئة ثقافية-اجتماعية فريدة. تجمع الدراسة بين تعليم العزف الفردي على مختلف الآلات، نظرية الموسيقى وأدبها، العزف في مجموعات موسيقى الحجرة، الأوركسترا والغناء في الجوقة.", "ru": "Муниципальная консерватория Петах-Тиквы имени Иосифа Ахрона работает при городском Управлении образования. Основана в 1950 году и является одним из ведущих учреждений страны в области профессионального музыкального образования. Консерватория — музыкально-образовательный центр, создающий уникальную культурно-социальную среду. Обучение сочетает индивидуальные занятия на различных инструментах, теорию музыки и музыкальную литературу, игру в камерных ансамблях, оркестре и пение в хоре."}, "photoUrls": [], "logoUrl": null, "location": {"city": "עמק יזרעאל", "cityEn": "Jezreel Valley", "coordinates": {"lat": 32.0893, "lng": 34.8866}}, "translations": {"en": {"name": "Petah Tikva Municipal Conservatory (Joseph Achron)", "city": "Jezreel Valley", "address": "Municipal Conservatorium, Safed", "about": "The Petah Tikva Municipal Conservatory, named after Joseph Achron, operates under the citys Education Administration. Founded in 1950, it is one of the leading institutions in Israel for professional music education. The conservatory serves as a music education center, creating a unique cultural-social environment. Studies combine individual instrument instruction, music theory and literature, chamber ensemble playing, orchestral and choral singing."}, "ar": {"name": "المجلس الإقليمي عيمك يزراعيل", "city": "عيمك يزراعيل", "address": "المعهد الموسيقي البلدي، صفد", "about": "يعمل كونسرفاتوار بيتح تكفا البلدي، المسمى على اسم يوسف أخرون، تحت إدارة التعليم في المدينة. تأسس عام 1950 وهو من المؤسسات الرائدة في البلاد في مجال التعليم الموسيقي المهني. يشكل الكونسرفاتوار مركزاً تعليمياً موسيقياً يخلق بيئة ثقافية-اجتماعية فريدة. تجمع الدراسة بين تعليم العزف الفردي على مختلف الآلات، نظرية الموسيقى وأدبها، العزف في مجموعات موسيقى الحجرة، الأوركسترا والغناء في الجوقة."}, "ru": {"name": "Региональный совет Изреельской долины", "city": "Изреельская долина", "address": "Городская консерватория, Цфат", "about": "Муниципальная консерватория Петах-Тиквы имени Иосифа Ахрона работает при городском Управлении образования. Основана в 1950 году и является одним из ведущих учреждений страны в области профессионального музыкального образования. Консерватория — музыкально-образовательный центр, создающий уникальную культурно-социальную среду. Обучение сочетает индивидуальные занятия на различных инструментах, теорию музыки и музыкальную литературу, игру в камерных ансамблях, оркестре и пение в хоре."}}}'),
('a1000000-0000-0000-0000-000000000063', '{"he":"קונסרבטוריון קדומים","en":"Kedumim Conservatory","ar":"مراكز المجتمع وتجديد الأحياء في العفولة","ru":"Центры общин и обновления районов Афулы"}', 'עפולה', '{"he":"עפולה","en":"Afula","ar":"العفولة","ru":"Афула"}', 'הקונסרבטוריון העירוני, קדימה צורן', '{"he":"הקונסרבטוריון העירוני, קדימה צורן","en":"Municipal Conservatorium, Kadima Zoran","ar":"المعهد الموسيقي البلدي، كاديما تسوران","ru":"Городская консерватория, Кадима-Цоран"}', '09-7922156', 'peleg.rippin1@gmail.com', NULL, NULL, '{"sourceId": 63, "about": {"he": "קונסרבטוריון קדומים.", "en": "Kedumim conservatory.", "ar": "كونسرفاتوار كدوميم.", "ru": "Консерватория Кедумим."}, "photoUrls": [], "logoUrl": null, "location": {"city": "עפולה", "cityEn": "Afula", "coordinates": {"lat": 32.28, "lng": 35.15}}, "translations": {"en": {"name": "Kedumim Conservatory", "city": "Afula", "address": "Municipal Conservatorium, Kadima Zoran", "about": "Kedumim conservatory."}, "ar": {"name": "مراكز المجتمع وتجديد الأحياء في العفولة", "city": "العفولة", "address": "المعهد الموسيقي البلدي، كاديما تسوران", "about": "كونسرفاتوار كدوميم."}, "ru": {"name": "Центры общин и обновления районов Афулы", "city": "Афула", "address": "Городская консерватория, Кадима-Цоран", "about": "Консерватория Кедумим."}}}'),
('a1000000-0000-0000-0000-000000000064', '{"he":"קונסרבטוריון קריית גת","en":"Kiryat Gat Conservatory","ar":"معهد بتاح تكفا الموسيقي","ru":"Консерватория Петах-Тиквы"}', 'פתח תקווה', '{"he":"פתח תקווה","en":"Petah Tikva","ar":"بتاح تكفا","ru":"Петах-Тиква"}', 'רחבת לורדייל לייקס, קריית אונו', '{"he":"רחבת לורדייל לייקס, קריית אונו","en":"Lauderdale Lakes Square, Kiryat Ono","ar":"ساحة لودرديل ليكس، كريات أونو","ru":"Площадь Лодердейл Лейкс, Кирьят-Оно"}', '03-9286700', 'shlomitm@ptikva.org.il;ravitn@ptikva.org.il', 'https://www.ptikva.org.il/', NULL, '{"sourceId": 64, "about": {"he": "קונסרבטוריון עירוני קריית גת.", "en": "Kiryat Gat municipal conservatory.", "ar": "كونسرفاتوار كريات غات البلدي.", "ru": "Муниципальная консерватория Кирьят-Гата."}, "photoUrls": [], "logoUrl": null, "location": {"city": "פתח תקווה", "cityEn": "Petah Tikva", "coordinates": {"lat": 31.6099, "lng": 34.7642}}, "translations": {"en": {"name": "Kiryat Gat Conservatory", "city": "Petah Tikva", "address": "Lauderdale Lakes Square, Kiryat Ono", "about": "Kiryat Gat municipal conservatory."}, "ar": {"name": "معهد بتاح تكفا الموسيقي", "city": "בتاح تكفا", "address": "ساحة لودرديل ليكس، كريات أونو", "about": "كونسرفاتوار كريات غات البلدي."}, "ru": {"name": "Консерватория Петах-Тиквы", "city": "Петах-Тиква", "address": "Площадь Лодердейл Лейкс, Кирьят-Оно", "about": "Муниципальная консерватория Кирьят-Гата."}}}'),
('a1000000-0000-0000-0000-000000000065', '{"he":"קונסרבטוריון קצרין","en":"Katzrin Conservatory","ar":"مركز كدوميم الجماهيري","ru":"Общинный центр Кедумим"}', 'קדומים', '{"he":"קדומים","en":"Kedumim","ar":"كدوميم","ru":"Кедумим"}', 'הקונסרבטוריון העירוני, קריית אתא', '{"he":"הקונסרבטוריון העירוני, קריית אתא","en":"Municipal Conservatorium, Kiryat Ata","ar":"المعهد الموسيقي البلدي، كريات آتا","ru":"Городская консерватория, Кирьят-Ата"}', '09-7922156', 'music@kedumim.org.il;esty@matnasim.org.il', 'https://www.kedumim.org.il/', NULL, '{"sourceId": 65, "about": {"he": "קונסרבטוריון עירוני קצרין.", "en": "Katzrin municipal conservatory.", "ar": "كونسرفاتوار كتسرين البلدي.", "ru": "Муниципальная консерватория Кацрина."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קדומים", "cityEn": "Kedumim", "coordinates": {"lat": 32.9999, "lng": 35.692}}, "translations": {"en": {"name": "Katzrin Conservatory", "city": "Kedumim", "address": "Municipal Conservatorium, Kiryat Ata", "about": "Katzrin municipal conservatory."}, "ar": {"name": "مركز كدوميم الجماهيري", "city": "كدوميم", "address": "المعهد الموسيقي البلدي، كريات آتا", "about": "كونسرفاتوار كتسرين البلدي."}, "ru": {"name": "Общинный центр Кедумим", "city": "Кедумим", "address": "Городская консерватория, Кирьят-Ата", "about": "Муниципальная консерватория Кацрина."}}}'),
('a1000000-0000-0000-0000-000000000066', '{"he":"קונסרבטוריון קריית אונו ע\"ש אהרון אלקלעי","en":"Kiryat Ono Conservatory (Aaron Alkalai)","ar":"المركز الجماهيري كاديما تسوران","ru":"Общинный центр Кадима-Цоран"}', 'קדימה-צורן', '{"he":"קדימה-צורן","en":"Kadima-Zoran","ar":"كاديما - تسوران","ru":"Кадима-Цоран"}', 'הקונסרבטוריון העירוני, קריית ביאליק', '{"he":"הקונסרבטוריון העירוני, קריית ביאליק","en":"Municipal Conservatorium, Kiryat Bialik","ar":"المعهد الموسيقي البلدي، كريات بياليك","ru":"Городская консерватория, Кирьят-Бялик"}', '09-8991446', 'music@kadima.matnasim.co.il', 'https://www.onomusic.org/', NULL, '{"sourceId": 66, "about": {"he": "הקונסרבטוריון בקריית אונו הוא מקום למפגש ראשוני עם חינוך מוזיקלי ובית לצמוח בו. מציעים גישה מטפחת, סקרנית ויצירתית ללימוד מקצועות המוזיקה דרך כלי הנגינה השונים, השתתפות בהרכבים, הפקה מוזיקלית, ותורת המוזיקה. הקונסרבטוריון מופעל ע\"י העמותה לחינוך מוזיקלי בקריית אונו (ע\"ר), ח\"פ: 58-036-420-6.", "en": "The Kiryat Ono Conservatory is a place for first encounters with music education and a home to grow in. We offer a nurturing, curious, and creative approach to learning music through various instruments, ensemble participation, music production, and music theory. Operated by the Association for Music Education in Kiryat Ono.", "ar": "كونسرفاتوار كريات أونو هو مكان للقاء الأول مع التعليم الموسيقي وبيت للنمو فيه. نقدم نهجًا رعائيًا وفضوليًا وإبداعيًا لتعلم الموسيقى من خلال الآلات المختلفة، المشاركة في الفرق، الإنتاج الموسيقي، ونظرية الموسيقى. يُدار من قبل جمعية التعليم الموسيقي في كريات أونو.", "ru": "Консерватория Кирьят-Оно — место первой встречи с музыкальным образованием и дом для роста. Мы предлагаем заботливый, любознательный и творческий подход к изучению музыки через различные инструменты, участие в ансамблях, музыкальное продюсирование и теорию музыки. Управляется Ассоциацией музыкального образования Кирьят-Оно."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קדימה-צורן", "cityEn": "Kadima-Zoran", "coordinates": {"lat": 32.0548, "lng": 34.8556}}, "translations": {"en": {"name": "Kiryat Ono Conservatory (Aaron Alkalai)", "city": "Kadima-Zoran", "address": "Municipal Conservatorium, Kiryat Bialik", "about": "The Kiryat Ono Conservatory is a place for first encounters with music education and a home to grow in. We offer a nurturing, curious, and creative approach to learning music through various instruments, ensemble participation, music production, and music theory. Operated by the Association for Music Education in Kiryat Ono."}, "ar": {"name": "المركز الجماهيري كاديما تسوران", "city": "كاديما - تسوران", "address": "المعهد الموسيقي البلدي، كريات بياليك", "about": "كونسرفاتوار كريات أونو هو مكان للقاء الأول مع التعليم الموسيقي وبيت للنمو فيه. نقدم نهجًا رعائيًا وفضوليًا وإبداعيًا لتعلم الموسيقى من خلال الآلات المختلفة، المشاركة في الفرق، الإنتاج الموسيقي، ونظرية الموسيقى. يُدار من قبل جمعية التعليم الموسيقي في كريات أونو."}, "ru": {"name": "Общинный центр Кадима-Цоран", "city": "Кадима-Цоран", "address": "Городская консерватория, Кирьят-Бялик", "about": "Консерватория Кирьят-Оно — место первой встречи с музыкальным образованием и дом для роста. Мы предлагаем заботливый, любознательный и творческий подход к изучению музыки через различные инструменты, участие в ансамблях, музыкальное продюсирование и теорию музыки. Управляется Ассоциацией музыкального образования Кирьят-Оно."}}}'),
('a1000000-0000-0000-0000-000000000067', '{"he":"קונסרבטוריון קריית אתא","en":"Kiryat Ata Conservatory","ar":"جمعية الأصفهاني للثقافة والفنون","ru":"Ассоциация культуры и искусств Аль-Исфахани"}', 'קלאנסווה', '{"he":"קלאנסווה","en":"Qalansawe","ar":"قلنسوة","ru":"Калансуа"}', 'הקונסרבטוריון העירוני, קריית גת', '{"he":"הקונסרבטוריון העירוני, קריית גת","en":"Municipal Conservatorium, Kiryat Gat","ar":"المعهد الموسيقي البلدي، كريات جات","ru":"Городская консерватория, Кирьят-Гат"}', '04-8450117', 'oudayosaf@yahoo.com', NULL, NULL, '{"sourceId": 67, "about": {"he": "קונסרבטוריון עירוני קריית אתא, מרכז לחינוך מוסיקלי ותרבות.", "en": "Kiryat Ata municipal conservatory, a center for music education and culture.", "ar": "كونسرفاتوار كريات أتا البلدي، مركز للتعليم الموسيقي والثقافة.", "ru": "Муниципальная консерватория Кирьят-Аты, центр музыкального образования и культуры."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קלאנסווה", "cityEn": "Qalansawe", "coordinates": {"lat": 32.8063, "lng": 35.1028}}, "translations": {"en": {"name": "Kiryat Ata Conservatory", "city": "Qalansawe", "address": "Municipal Conservatorium, Kiryat Gat", "about": "Kiryat Ata municipal conservatory, a center for music education and culture."}, "ar": {"name": "جمعية الأصفهاني للثقافة والفنون", "city": "قلنسوة", "address": "المعهد الموسيقي البلدي، كريات جات", "about": "كونسرفاتوار كريات أتا البلدي، مركز للتعليم الموسيقي والثقافة."}, "ru": {"name": "Ассоциация культуры и искусств Аль-Исфахани", "city": "Калансуа", "address": "Городская консерватория, Кирьят-Гат", "about": "Муниципальная консерватория Кирьят-Аты, центр музыкального образования и культуры."}}}'),
('a1000000-0000-0000-0000-000000000068', '{"he":"קונסרבטוריון קריית ביאליק","en":"Kiryat Bialik Conservatory","ar":"جمعية التربية الموسيقية في كريات أونو","ru":"Ассоциация музыкального образования в Кирьят-Оно"}', 'קריית אונו', '{"he":"קריית אונו","en":"Kiryat Ono","ar":"كريات أونو","ru":"Кирьят-Оно"}', 'הקונסרבטוריון העירוני, קריית יערים', '{"he":"הקונסרבטוריון העירוני, קריית יערים","en":"Municipal Conservatorium, Kiryat Ye''arim","ar":"المعهد الموسيقي البلدي، كريات يعاريم","ru":"Городская консерватория, Кирьят-Йеарим"}', '03-6353328', 'bararmon@onomusic.org', 'https://www.onomusic.org/', NULL, '{"sourceId": 68, "about": {"he": "קונסרבטוריון עירוני קריית ביאליק.", "en": "Kiryat Bialik municipal conservatory.", "ar": "كونسرفاتوار كريات بياليك البلدي.", "ru": "Муниципальная консерватория Кирьят-Бялика."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קריית אונו", "cityEn": "Kiryat Ono", "coordinates": {"lat": 32.8305, "lng": 35.0788}}, "translations": {"en": {"name": "Kiryat Bialik Conservatory", "city": "Kiryat Ono", "address": "Municipal Conservatorium, Kiryat Ye''''arim", "about": "Kiryat Bialik municipal conservatory."}, "ar": {"name": "جمعية التربية الموسيقية في كريات أونو", "city": "كريات أونو", "address": "المعهد الموسيقي البلدي، كريات يعاريم", "about": "كونسرفاتوار كريات بياليك البلدي."}, "ru": {"name": "Ассоциация музыкального образования в Кирьят-Оно", "city": "Кирьят-Оно", "address": "Городская консерватория, Кирьят-Йеарим", "about": "Муниципальная консерватория Кирьят-Бялика."}}}'),
('a1000000-0000-0000-0000-000000000069', '{"he":"קונסרבטוריון קריית טבעון","en":"Kiryat Tivon Conservatory","ar":"مؤسسات التربية والثقافة في كريات آتا تابعة للوكالة اليهودية","ru":"Учреждения образования и культуры в Кирьят-Ата от Еврейского агентства"}', 'קריית אתא', '{"he":"קריית אתא","en":"Kiryat Ata","ar":"كريات آتا","ru":"Кирьят-Ата"}', 'הקונסרבטוריון העירוני, קריית ים', '{"he":"הקונסרבטוריון העירוני, קריית ים","en":"Municipal Conservatorium, Kiryat Yam","ar":"المعهد الموسيقي البلدي، كريات يام","ru":"Городская консерватория, Кирьят-Ям"}', '04-8450117', 'tanya82@ka.matnasim.co.il', 'https://matnastiv.co.il/300', NULL, '{"sourceId": 69, "about": {"he": "קונסרבטוריון קריית טבעון.", "en": "Kiryat Tiv''on conservatory.", "ar": "كونسرفاتوار كريات طبعون.", "ru": "Консерватория Кирьят-Тивона."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קריית אתא", "cityEn": "Kiryat Ata", "coordinates": {"lat": 32.7148, "lng": 35.1154}}, "translations": {"en": {"name": "Kiryat Tivon Conservatory", "city": "Kiryat Ata", "address": "Municipal Conservatorium, Kiryat Yam", "about": "Kiryat Tiv''on conservatory."}, "ar": {"name": "مؤسسات التربية والثقافة في كريات آتا تابعة للوكالة اليهودية", "city": "كريات آتا", "address": "المعهد الموسيقي البلدي، كريات يام", "about": "كونسرفاتوار كريات طبعون."}, "ru": {"name": "Учреждения образования и культуры в Кирьят-Ата от Еврейского агентства", "city": "Кирьят-Ата", "address": "Городская консерватория, Кирьят-Ям", "about": "Консерватория Кирьят-Тивона."}}}'),
('a1000000-0000-0000-0000-000000000070', '{"he":"קונסרבטוריון קריית ים","en":"Kiryat Yam Conservatory","ar":"جمعية المعهد الموسيقي في كريات بياليك","ru":"Ассоциация консерватории в Кирьят-Бялике"}', 'קריית ביאליק', '{"he":"קריית ביאליק","en":"Kiryat Bialik","ar":"كريات بياليك","ru":"Кирьят-Бялик"}', 'הקונסרבטוריון העירוני, קריית מוצקין', '{"he":"הקונסרבטוריון העירוני, קריית מוצקין","en":"Municipal Conservatorium, Kiryat Motzkin","ar":"المعهد الموسيقي البلدي، كريات موتسكين","ru":"Городская консерватория, Кирьят-Моцкин"}', '04-8730024', 'asafa4@gmail.com', NULL, NULL, '{"sourceId": 70, "about": {"he": "קונסרבטוריון עירוני קריית ים.", "en": "Kiryat Yam municipal conservatory.", "ar": "كونسرفاتوار كريات يام البلدي.", "ru": "Муниципальная консерватория Кирьят-Яма."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קריית ביאליק", "cityEn": "Kiryat Bialik", "coordinates": {"lat": 32.854, "lng": 35.0648}}, "translations": {"en": {"name": "Kiryat Yam Conservatory", "city": "Kiryat Bialik", "address": "Municipal Conservatorium, Kiryat Motzkin", "about": "Kiryat Yam municipal conservatory."}, "ar": {"name": "جمعية المعهد الموسيقي في كريات بياليك", "city": "كريات بياليك", "address": "المعهد الموسيقي البلدي، كريات موتسكين", "about": "كونسرفاتوار كريات يام البلدي."}, "ru": {"name": "Ассоциация консерватории в Кирьят-Бялике", "city": "Кирьят-Бялик", "address": "Городская консерватория, Кирьят-Моцкин", "about": "Муниципальная консерватория Кирьят-Яма."}}}'),
('a1000000-0000-0000-0000-000000000071', '{"he":"קונסרבטוריון קריית מלאכי","en":"Kiryat Malakhi Conservatory","ar":"شبكة المراكز الجماهيرية كريات طبعون","ru":"Сеть общинных центров Кирьят-Тивона"}', 'קריית טבעון', '{"he":"קריית טבעון","en":"Kiryat Tiv''on","ar":"كريات طبعون","ru":"Кирьят-Тивон"}', 'הקונסרבטוריון העירוני, קריית מלאכי', '{"he":"הקונסרבטוריון העירוני, קריית מלאכי","en":"Municipal Conservatorium, Kiryat Malakhi","ar":"المعهد الموسيقي البلدي، كريات ملاخي","ru":"Городская консерватория, Кирьят-Малахи"}', '04-9831142', 'muzik@kiryattiv.matnasim.co.il', 'https://www.kiryattiv.matnasim.co.il/', NULL, '{"sourceId": 71, "about": {"he": "קונסרבטוריון עירוני קריית מלאכי.", "en": "Kiryat Malakhi municipal conservatory.", "ar": "كونسرفاتوار كريات ملاخي البلدي.", "ru": "Муниципальная консерватория Кирьят-Малахи."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קריית טבעון", "cityEn": "Kiryat Tiv''''on", "coordinates": {"lat": 31.7334, "lng": 34.7406}}, "translations": {"en": {"name": "Kiryat Malakhi Conservatory", "city": "Kiryat Tiv''''on", "address": "Municipal Conservatorium, Kiryat Malakhi", "about": "Kiryat Malakhi municipal conservatory."}, "ar": {"name": "شبكة المراكز الجماهيرية كريات طبعون", "city": "كريات طبعون", "address": "المعهد الموسيقي البلدي، كريات ملاخي", "about": "كونسرفاتوار كريات ملاخي البلدي."}, "ru": {"name": "Сеть общинных центров Кирьят-Тивона", "city": "Кирьят-Тивон", "address": "Городская консерватория, Кирьят-Малахи", "about": "Муниципальная консерватория Кирьят-Малахи."}}}'),
('a1000000-0000-0000-0000-000000000072', '{"he":"קונסרבטוריון קריית שמונה","en":"Kiryat Shmona Conservatory","ar":"بلدية كريات يام","ru":"Муниципалитет Кирьят-Яма"}', 'קריית ים', '{"he":"קריית ים","en":"Kiryat Yam","ar":"كريات يام","ru":"Кирьят-Ям"}', 'הקונסרבטוריון העירוני, קריית שמונה', '{"he":"הקונסרבטוריון העירוני, קריית שמונה","en":"Municipal Conservatorium, Kiryat Shmona","ar":"المعهد الموسيقي البلدي، كريات شمونة","ru":"Городская консерватория, Кирьят-Шмона"}', '04-8789714', 'Innag@k-yam.co.il', 'https://www.k-yam.co.il/', NULL, '{"sourceId": 72, "about": {"he": "קונסרבטוריון עירוני קריית שמונה.", "en": "Kiryat Shmona municipal conservatory.", "ar": "كونسرفاتوار كريات شمونة البلدي.", "ru": "Муниципальная консерватория Кирьят-Шмоны."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קריית ים", "cityEn": "Kiryat Yam", "coordinates": {"lat": 33.2075, "lng": 35.5697}}, "translations": {"en": {"name": "Kiryat Shmona Conservatory", "city": "Kiryat Yam", "address": "Municipal Conservatorium, Kiryat Shmona", "about": "Kiryat Shmona municipal conservatory."}, "ar": {"name": "بلدية كريات يام", "city": "كريات يام", "address": "المعهد الموسيقي البلدي، كريات شمونة", "about": "كونسرفاتوار كريات شمونة البلدي."}, "ru": {"name": "Муниципалитет Кирьят-Яма", "city": "Кирьят-Ям", "address": "Городская консерватория, Кирьят-Шмона", "about": "Муниципальная консерватория Кирьят-Шмоны."}}}'),
('a1000000-0000-0000-0000-000000000073', '{"he":"קונסרבטוריון ראשון לציון","en":"Rishon LeZion Conservatory","ar":"معهد كريات موتسكين الموسيقي","ru":"Консерватория Кирьят-Моцкина"}', 'קריית מוצקין', '{"he":"קריית מוצקין","en":"Kiryat Motzkin","ar":"كريات موتسكين","ru":"Кирьят-Моцкин"}', 'הקונסרבטוריון העירוני, ראש העין', '{"he":"הקונסרבטוריון העירוני, ראש העין","en":"Municipal Conservatorium, Rosh HaAyin","ar":"المعهد الموسيقي البلدي، رأس العين","ru":"Городская консерватория, Рош-а-Аин"}', '03-9014527', 'ys44699@gmail.com', NULL, NULL, '{"sourceId": 73, "about": {"he": "קונסרבטוריון עירוני ראשון לציון.", "en": "Rishon LeZion municipal conservatory.", "ar": "كونسرفاتوار ريشون لتسيون البلدي.", "ru": "Муниципальная консерватория Ришон-ле-Циона."}, "photoUrls": [], "logoUrl": null, "location": {"city": "קריית מוצקין", "cityEn": "Kiryat Motzkin", "coordinates": {"lat": 31.973, "lng": 34.7895}}, "translations": {"en": {"name": "Rishon LeZion Conservatory", "city": "Kiryat Motzkin", "address": "Municipal Conservatorium, Rosh HaAyin", "about": "Rishon LeZion municipal conservatory."}, "ar": {"name": "معهد كريات موتسكين الموسيقي", "city": "كريات موتسكين", "address": "المعهد الموسيقي البلدي، رأس العين", "about": "كونسرفاتوار ريشون لتسيون البلدي."}, "ru": {"name": "Консерватория Кирьят-Моцкина", "city": "Кирьят-Моцкин", "address": "Городская консерватория, Рош-а-Аин", "about": "Муниципальная консерватория Ришон-ле-Циона."}}}'),
('a1000000-0000-0000-0000-000000000074', '{"he":"קונסרבטוריון ראש פינה","en":"Rosh Pinna Conservatory","ar":"جمعية سراج","ru":"Ассоциация Сирадж"}', 'ראמה', '{"he":"ראמה","en":"Rameh","ar":"الرامة","ru":"Раме"}', 'הקונסרבטוריון העירוני, ראשון לציון', '{"he":"הקונסרבטוריון העירוני, ראשון לציון","en":"Municipal Conservatorium, Rishon LeZion","ar":"المعهد الموسيقي البلدي، ريشون لتسيون","ru":"Городская консерватория, Ришон-ле-Цион"}', '04-9655122', 'siraj.conservatory@gmail.com', 'https://www.siraj.org.il/', NULL, '{"sourceId": 74, "about": {"he": "קונסרבטוריון עירוני ראש פינה.", "en": "Rosh Pina municipal conservatory.", "ar": "كونسرفاتوار روش بينا البلدي.", "ru": "Муниципальная консерватория Рош-Пины."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ראמה", "cityEn": "Rameh", "coordinates": {"lat": 32.9702, "lng": 35.5464}}, "translations": {"en": {"name": "Rosh Pinna Conservatory", "city": "Rameh", "address": "Municipal Conservatorium, Rishon LeZion", "about": "Rosh Pina municipal conservatory."}, "ar": {"name": "جمعية سراج", "city": "الرامة", "address": "المعهد الموسيقي البلدي، ريشون لتسيون", "about": "كونسرفاتوار روش بينا البلدي."}, "ru": {"name": "Ассоциация Сирадж", "city": "Раме", "address": "Городская консерватория, Ришон-ле-Цион", "about": "Муниципальная консерватория Рош-Пины."}}}'),
('a1000000-0000-0000-0000-000000000075', '{"he":"קונסרבטוריון רחובות","en":"Rehovot Conservatory","ar":"المركز الجماهيري في رأس العين على اسم كيمرلينغ","ru":"Общинный центр Рош-а-Аина им. Киммерлинга"}', 'ראש העין', '{"he":"ראש העין","en":"Rosh HaAyin","ar":"رأس العين","ru":"Рош-а-Аин"}', 'הקונסרבטוריון העירוני, רחובות', '{"he":"הקונסרבטוריון העירוני, רחובות","en":"Municipal Conservatorium, Rehovot","ar":"المعهد الموسيقي البلدي، رحوفوت","ru":"Городская консерватория, Реховот"}', '03-9014527', 'yarongan@gmail.com', NULL, NULL, '{"sourceId": 75, "about": {"he": "קונסרבטוריון עירוני רחובות.", "en": "Rehovot municipal conservatory.", "ar": "كونسرفاتوار رحوفوت البلدي.", "ru": "Муниципальная консерватория Реховота."}, "photoUrls": [], "logoUrl": null, "location": {"city": "ראש העין", "cityEn": "Rosh HaAyin", "coordinates": {"lat": 31.8928, "lng": 34.8113}}, "translations": {"en": {"name": "Rehovot Conservatory", "city": "Rosh HaAyin", "address": "Municipal Conservatorium, Rehovot", "about": "Rehovot municipal conservatory."}, "ar": {"name": "المركز الجماهيري في رأس العين على اسم كيمرلينغ", "city": "رأس العين", "address": "المعهد الموسيقي البلدي، رحوفوت", "about": "كونسرفاتوار رحوفوت البلدي."}, "ru": {"name": "Общинный центр Рош-а-Аина им. Киммерлинга", "city": "Рош-а-Аин", "address": "Городская консерватория, Реховот", "about": "Муниципальная консерватория Реховота."}}}'),
('a1000000-0000-0000-0000-000000000076', '{"he":"קונסרבטוריון רמת גן | המרכז העירוני למוזיקה","en":"Ramat Gan Municipal Music Center","ar":"الشركة البلدية ريشون لتسيون للثقافة والرياضة والترفيه","ru":"Муниципальная компания Ришон-ле-Циона по культуре спорту и отдыху"}', 'ראשון לציון', '{"he":"ראשון לציון","en":"Rishon LeZion","ar":"ريشون لتسيون","ru":"Ришон-ле-Цион"}', 'הקונסרבטוריון העירוני, רמלה', '{"he":"הקונסרבטוריון העירוני, רמלה","en":"Municipal Conservatorium, Ramla","ar":"المعهد الموسيقي البلدي، الرملة","ru":"Городская консерватория, Рамла"}', '03-9655122', 'vocalsingers@gmail.com', 'https://www.ramatganmusic.com/', 'https://i.ytimg.com/vi/oP2mas-Dp3Y/maxresdefault.jpg', '{"sourceId": 76, "about": {"he": "המרכז העירוני למוזיקה רמת גן ע\"ש נעמי שמר. פועל בפיקוח משרד החינוך, מציע לתושבים בכל הגילאים מגוון פעילויות: תזמורות, מקהלות, הרכבים קאמריים, שעורי תאוריה, הלחנה ואלתור.", "en": "The Ramat Gan Municipal Music Center, named after Naomi Shemer. Supervised by the Ministry of Education, offering residents of all ages a variety of activities: orchestras, choirs, chamber ensembles, theory lessons, composition and improvisation.", "ar": "المركز البلدي للموسيقى في رمات غان، المسمى على اسم نعومي شيمر. يعمل تحت إشراف وزارة التربية والتعليم، ويقدم للسكان من جميع الأعمار مجموعة متنوعة من الأنشطة: أوركسترات، جوقات، فرق موسيقى الحجرة، دروس نظرية، تأليف وارتجال.", "ru": "Муниципальный музыкальный центр Рамат-Гана имени Наоми Шемер. Работает под надзором Министерства образования, предлагая жителям всех возрастов разнообразные занятия: оркестры, хоры, камерные ансамбли, уроки теории, композицию и импровизацию."}, "photoUrls": ["https://i.ytimg.com/vi/oP2mas-Dp3Y/maxresdefault.jpg"], "logoUrl": "https://i.ytimg.com/vi/oP2mas-Dp3Y/maxresdefault.jpg", "location": {"city": "ראשון לציון", "cityEn": "Rishon LeZion", "coordinates": {"lat": 32.0681, "lng": 34.8236}}, "translations": {"en": {"name": "Ramat Gan Municipal Music Center", "city": "Rishon LeZion", "address": "Municipal Conservatorium, Ramla", "about": "The Ramat Gan Municipal Music Center, named after Naomi Shemer. Supervised by the Ministry of Education, offering residents of all ages a variety of activities: orchestras, choirs, chamber ensembles, theory lessons, composition and improvisation."}, "ar": {"name": "الشركة البلدية ريشون لتسيون للثقافة والرياضة والترفيه", "city": "ريشون لتسيون", "address": "المعهد الموسيقي البلدي، الرملة", "about": "المركز البلدي للموسيقى في رمات غان، المسمى على اسم نعومي شيمر. يعمل تحت إشراف وزارة التربية والتعليم، ويقدم للسكان من جميع الأعمار مجموعة متنوعة من الأنشطة: أوركسترات، جوقات، فرق موسيقى الحجرة، دروس نظرية، تأليف وارتجال."}, "ru": {"name": "Муниципальная компания Ришон-ле-Циона по культуре спорту и отдыху", "city": "Ришон-ле-Цион", "address": "Городская консерватория, Рамла", "about": "Муниципальный музыкальный центр Рамат-Гана имени Наоми Шемер. Работает под надзором Министерства образования, предлагая жителям всех возрастов разнообразные занятия: оркестры, хоры, камерные ансамбли, уроки теории, композицию и импровизацию."}}}'),
('a1000000-0000-0000-0000-000000000077', '{"he":"קונסרבטוריון רמת השרון","en":"Ramat HaSharon Conservatory","ar":"بلدية رحوفوت","ru":"Муниципалитет Реховота"}', 'רחובות', '{"he":"רחובות","en":"Rehovot","ar":"رحوفوت","ru":"Реховот"}', 'הקונסרבטוריון העירוני, רמת גן', '{"he":"הקונסרבטוריון העירוני, רמת גן","en":"Municipal Conservatorium, Ramat Gan","ar":"المعهد الموسيقي البلدي، رمات جان","ru":"Городская консерватория, Рамат-Ган"}', '08-9316245', 'con1@bezeqint.net', NULL, NULL, '{"sourceId": 77, "about": {"he": "קונסרבטוריון עירוני רמת השרון.", "en": "Ramat HaSharon municipal conservatory.", "ar": "كونسرفاتوار رمات هشارون البلدي.", "ru": "Муниципальная консерватория Рамат а-Шарона."}, "photoUrls": [], "logoUrl": null, "location": {"city": "רחובות", "cityEn": "Rehovot", "coordinates": {"lat": 32.1467, "lng": 34.8401}}, "translations": {"en": {"name": "Ramat HaSharon Conservatory", "city": "Rehovot", "address": "Municipal Conservatorium, Ramat Gan", "about": "Ramat HaSharon municipal conservatory."}, "ar": {"name": "بلدية رحوفوت", "city": "رحوفوت", "address": "المعهد الموسيقي البلدي، رمات جان", "about": "كونسرفاتوار رمات هشارون البلدي."}, "ru": {"name": "Муниципалитет Реховота", "city": "Реховот", "address": "Городская консерватория, Рамат-Ган", "about": "Муниципальная консерватория Рамат а-Шарона."}}}'),
('a1000000-0000-0000-0000-000000000078', '{"he":"מרכז פיס למוסיקה רעננה","en":"Pais Music Center Raanana","ar":"المركز الجديد للموسيقى رمات جان","ru":"Новый музыкальный центр Рамат-Ган"}', 'רמת גן', '{"he":"רמת גן","en":"Ramat Gan","ar":"رمات جان","ru":"Рамат-Ган"}', 'הקונסרבטוריון העירוני, רמת השרון', '{"he":"הקונסרבטוריון העירוני, רמת השרון","en":"Municipal Conservatorium, Ramat HaSharon","ar":"المعهد الموسيقي البلدي، رمات هشارون","ru":"Городская консерватория, Рамат-а-Шарон"}', '03-6135474', 'michaela.bh@gmail.com', 'https://www.raananamusic.com/', 'https://www.raananamusic.com/uploads/3/0/6/5/3065118/raananamusic-new-header-4_1.jpeg', '{"sourceId": 78, "about": {"he": "מרכז פיס למוסיקה רעננה הוקם בשנת 1989 והינו המרכז ללימודי מוסיקה ברמה הגבוהה ביותר בעיר. מטרת המרכז לקדם את החינוך המוסיקלי על כל מרכיביו: נגינה בכלי, האזנה לקונצרטים, שאיפה למצויינות, פיתוח היצירתיות, שיפור הביטחון העצמי ולימוד מיומנויות עמידה על במה. מוסמך ע\"י ABRSM (לונדון) לביצוע מבחני הערכה.", "en": "The Ra''anana Pais Music Center was founded in 1989 and is the center for the highest-level music studies in the city. The center aims to promote music education in all its aspects: instrumental playing, concert attendance, pursuit of excellence, creativity development, self-confidence building, and stage performance skills. Certified by ABRSM (London) to conduct assessment exams.", "ar": "تأسس مركز بايس للموسيقى في رعنانا عام 1989 وهو المركز لدراسات الموسيقى على أعلى مستوى في المدينة. هدف المركز تعزيز التعليم الموسيقي بجميع مكوناته: العزف على الآلات، حضور الحفلات، السعي للتميز، تطوير الإبداع، تحسين الثقة بالنفس ومهارات الأداء المسرحي. معتمد من ABRSM (لندن) لإجراء اختبارات التقييم.", "ru": "Музыкальный центр Паис в Раанане основан в 1989 году и является центром музыкального образования высочайшего уровня в городе. Цель центра — продвижение музыкального образования во всех его аспектах: игра на инструментах, посещение концертов, стремление к мастерству, развитие творческих способностей, укрепление уверенности в себе и навыков сценического выступления. Аккредитован ABRSM (Лондон) для проведения оценочных экзаменов."}, "photoUrls": ["https://www.raananamusic.com/uploads/3/0/6/5/3065118/raananamusic-new-header-4_1.jpeg"], "logoUrl": "https://www.raananamusic.com/uploads/3/0/6/5/3065118/raananamusic-new-header-4_1.jpeg", "location": {"city": "רמת גן", "cityEn": "Ramat Gan", "coordinates": {"lat": 32.1859, "lng": 34.8709}}, "translations": {"en": {"name": "Pais Music Center Raanana", "city": "Ramat Gan", "address": "Municipal Conservatorium, Ramat HaSharon", "about": "The Ra''anana Pais Music Center was founded in 1989 and is the center for the highest-level music studies in the city. The center aims to promote music education in all its aspects: instrumental playing, concert attendance, pursuit of excellence, creativity development, self-confidence building, and stage performance skills. Certified by ABRSM (London) to conduct assessment exams."}, "ar": {"name": "المركز الجديد للموسيقى رمات جان", "city": "رمات جان", "address": "المعهد الموسيقي البلدي، رمات هشارون", "about": "تأسس مركز بايس للموسيقى في رعنانا عام 1989 وهو المركز لدراسات الموسيقى على أعلى مستوى في المدينة. هدف المركز تعزيز التعليم الموسيقي بجميع مكوناته: العزف على الآلات، حضور الحفلات، السعي للتميز، تطوير الإبداع، تحسين الثقة بالنفس ومهارات الأداء المسرحي. معتمد من ABRSM (لندن) لإجراء اختبارات التقييم."}, "ru": {"name": "Новый музыкальный центр Рамат-Ган", "city": "Рамат-Ган", "address": "Городская консерватория, Рамат-а-Шарон", "about": "Музыкальный центр Паис в Раанане основан в 1989 году и является центром музыкального образования высочайшего уровня в городе. Цель центра — продвижение музыкального образования во всех его аспектах: игра на инструментах, посещение концертов, стремление к мастерству, развитие творческих способностей, укрепление уверенности в себе и навыков сценического выступления. Аккредитован ABRSM (Лондон) для проведения оценочных экзаменов."}}}'),
('a1000000-0000-0000-0000-000000000079', '{"he":"קונסרבטוריון שדרות","en":"Sderot Conservatory","ar":"معهد رمات هشارون الموسيقي","ru":"Консерватория Рамат-а-Шарона"}', 'רמת השרון', '{"he":"רמת השרון","en":"Ramat HaSharon","ar":"رمات هشارون","ru":"Рамат-а-Шарон"}', 'הקונסרבטוריון העירוני, רעננה', '{"he":"הקונסרבטוריון העירוני, רעננה","en":"Municipal Conservatorium, Ra''anana","ar":"المعهد الموسيقي البلدي، رعنانا","ru":"Городская консерватория, Раанана"}', '03-5407580', 'royzumusic@gmail.com;roy_z@ramhash.co.il', 'https://www.ramhash.co.il/', NULL, '{"sourceId": 79, "about": {"he": "קונסרבטוריון עירוני שדרות.", "en": "Sderot municipal conservatory.", "ar": "كونسرفاتوار سديروت البلدي.", "ru": "Муниципальная консерватория Сдерота."}, "photoUrls": [], "logoUrl": null, "location": {"city": "רמת השרון", "cityEn": "Ramat HaSharon", "coordinates": {"lat": 31.5271, "lng": 34.5963}}, "translations": {"en": {"name": "Sderot Conservatory", "city": "Ramat HaSharon", "address": "Municipal Conservatorium, Ra''''anana", "about": "Sderot municipal conservatory."}, "ar": {"name": "معهد رمات هشارون الموسيقي", "city": "رمات هشارون", "address": "المعهد الموسيقي البلدي، رعنانا", "about": "كونسرفاتوار سديروت البلدي."}, "ru": {"name": "Консерватория Рамат-а-Шарона", "city": "Рамат-а-Шарон", "address": "Городская консерватория, Раанана", "about": "Муниципальная консерватория Сдерота."}}}'),
('a1000000-0000-0000-0000-000000000080', '{"he":"קונסרבטוריון שומרון","en":"Shomron Conservatory","ar":"بلدية رعنانا","ru":"Муниципалитет Раананы"}', 'רעננה', '{"he":"רעננה","en":"Ra''anana","ar":"رعنانا","ru":"Раанана"}', 'הקונסרבטוריון העירוני, שדות נגב', '{"he":"הקונסרבטוריון העירוני, שדות נגב","en":"Municipal Conservatorium, Sdot Negev","ar":"المعهد الموسيقي البلدي، سدوت نيغف","ru":"Городская консерватория, Сдот-Негев"}', '09-7711330', 'limora@raanana.muni.il;raananamusiccenter@gmail.com', 'https://www.raanana.muni.il/', NULL, '{"sourceId": 80, "about": {"he": "קונסרבטוריון מועצה שומרון.", "en": "Shomron Regional Council conservatory.", "ar": "كونسرفاتوار مجلس شمرون الإقليمي.", "ru": "Консерватория регионального совета Шомрон."}, "photoUrls": [], "logoUrl": null, "location": {"city": "רעננה", "cityEn": "Ra''''anana", "coordinates": {"lat": 32.1, "lng": 35.05}}, "translations": {"en": {"name": "Shomron Conservatory", "city": "Ra''''anana", "address": "Municipal Conservatorium, Sdot Negev", "about": "Shomron Regional Council conservatory."}, "ar": {"name": "بلدية رعنانا", "city": "رعنانا", "address": "المعهد الموسيقي البلدي، سدوت نيغف", "about": "كونسرفاتوار مجلس شمرون الإقليمي."}, "ru": {"name": "Муниципалитет Раананы", "city": "Раанана", "address": "Городская консерватория, Сдот-Негев", "about": "Консерватория регионального совета Шомрон."}}}'),
('a1000000-0000-0000-0000-000000000081', '{"he":"קונסרבטוריון שפרעם","en":"Shfaram Conservatory","ar":"المجلس المحلي شوهام","ru":"Местный совет Шохам"}', 'שוהם', '{"he":"שוהם","en":"Shoham","ar":"شوهام","ru":"Шохам"}', 'הקונסרבטוריון העירוני, שוהם', '{"he":"הקונסרבטוריון העירוני, שוהם","en":"Municipal Conservatorium, Shoham","ar":"المعهد الموسيقي البلدي، شوهام","ru":"Городская консерватория, Шохам"}', '03-9723041', 'avivr@shoham.muni.il', 'https://beit-almusica.org.il/', NULL, '{"sourceId": 81, "about": {"he": "קונסרבטוריון שפרעם - בית אל-מוסיקה.", "en": "Shefa-''Amr Conservatory - Beit Al-Musika.", "ar": "كونسرفاتوار شفاعمرو - بيت الموسيقى.", "ru": "Консерватория Шфарама — Бейт аль-Мусика."}, "photoUrls": [], "logoUrl": null, "location": {"city": "שוהם", "cityEn": "Shoham", "coordinates": {"lat": 32.8063, "lng": 35.1672}}, "translations": {"en": {"name": "Shfaram Conservatory", "city": "Shoham", "address": "Municipal Conservatorium, Shoham", "about": "Shefa-''Amr Conservatory - Beit Al-Musika."}, "ar": {"name": "المجلس المحلي شوهام", "city": "شوهام", "address": "المعهد الموسيقي البلدي، شوهام", "about": "كونسرفاتوار شفاعمرو - بيت الموسيقى."}, "ru": {"name": "Местный совет Шохам", "city": "Шохам", "address": "Городская консерватория, Шохам", "about": "Консерватория Шфарама — Бейт аль-Мусика."}}}'),
('a1000000-0000-0000-0000-000000000082', '{"he":"הקונסרבטוריון הישראלי למוסיקה, תל אביב","en":"Israel Conservatory of Music, Tel Aviv (ICM)","ar":"المركز الجماهيري شاعر هنيغف","ru":"Общинный центр Шаар-а-Негев"}', 'שער הנגב', '{"he":"שער הנגב","en":"Sha''ar HaNegev","ar":"شاعر هنيغف","ru":"Шаар-а-Негев"}', 'הקונסרבטוריון העירוני, שער הנגב', '{"he":"הקונסרבטוריון העירוני, שער הנגב","en":"Municipal Conservatorium, Sha''ar HaNegev","ar":"المعهد الموسيقي البلدي، شاعر هنيغف","ru":"Городская консерватория, Шаар-а-Негев"}', '08-6802763', 'musicm@sng.org.il', 'https://www.icm.org.il/', 'https://www.icm.org.il/wp-content/uploads/2025/03/אריה-ורדי-עם-פסנתר-768x431.jpg', '{"sourceId": 82, "about": {"he": "הקונסרבטוריון הישראלי למוסיקה, תל אביב, נוסד ב-1946 ומונה למעלה מ-1000 תלמידים. ממוקם ברחוב לואי מרשל 25, תל אביב. מוסד מוביל בחינוך מוסיקלי המשלב לימודים קלאסיים, ג''''אז, מוסיקה עתיקה, קומפוזיציה ולימודי מבוגרים.", "en": "The Israel Conservatory of Music, Tel Aviv, founded in 1946 with over 1,000 students. Located at 25 Louis Marshall St., Tel Aviv. A leading institution in music education combining classical studies, jazz, early music, composition and adult studies.", "ar": "الكونسرفاتوار الإسرائيلي للموسيقى، تل أبيب، تأسس عام 1946 ويضم أكثر من 1000 طالب. يقع في شارع لويس مارشال 25، تل أبيب. مؤسسة رائدة في التعليم الموسيقي تجمع بين الدراسات الكلاسيكية والجاز والموسيقى القديمة والتأليف ودراسات الكبار.", "ru": "Израильская консерватория музыки, Тель-Авив, основана в 1946 году, более 1000 учеников. Расположена по адресу: ул. Луи Маршалла, 25, Тель-Авив. Ведущее учреждение музыкального образования, сочетающее классические занятия, джаз, старинную музыку, композицию и обучение взрослых."}, "photoUrls": ["https://www.icm.org.il/wp-content/uploads/2025/03/אריה-ורדי-עם-פסנתר-768x431.jpg"], "logoUrl": "https://www.icm.org.il/wp-content/uploads/2025/03/אריה-ורדי-עם-פסנתר-768x431.jpg", "location": {"city": "שער הנגב", "cityEn": "Sha''''ar HaNegev", "coordinates": {"lat": 32.0853, "lng": 34.7818}}, "translations": {"en": {"name": "Israel Conservatory of Music, Tel Aviv (ICM)", "city": "Sha''''ar HaNegev", "address": "Municipal Conservatorium, Sha''''ar HaNegev", "about": "The Israel Conservatory of Music, Tel Aviv, founded in 1946 with over 1,000 students. Located at 25 Louis Marshall St., Tel Aviv. A leading institution in music education combining classical studies, jazz, early music, composition and adult studies."}, "ar": {"name": "المركز الجماهيري شاعر هنيغف", "city": "شاعر هنيغف", "address": "المعهد الموسيقي البلدي، شاعر هنيغف", "about": "الكونسرفاتوار الإسرائيلي للموسيقى، تل أبيب، تأسس عام 1946 ويضم أكثر من 1000 طالب. يقع في شارع لويس مارشال 25، تل أبيب. مؤسسة رائدة في التعليم الموسيقي تجمع بين الدراسات الكلاسيكية والجاز والموسيقى القديمة والتأليف ودراسات الكبار."}, "ru": {"name": "Общинный центр Шаар-а-Негев", "city": "Шаар-а-Негев", "address": "Городская консерватория, Шаар-а-Негев", "about": "Израильская консерватория музыки, Тель-Авив, основана в 1946 году, более 1000 учеников. Расположена по адресу: ул. Луи Маршалла, 25, Тель-Авив. Ведущее учреждение музыкального образования, сочетающее классические занятия, джаз, старинную музыку, композицию и обучение взрослых."}}}'),
('a1000000-0000-0000-0000-000000000083', '{"he":"קונסרבטוריון תל אביב-יפו","en":"Tel Aviv-Yafo Conservatory","ar":"بيت الموسيقى شفاعمرو","ru":"Бейт Альмусика Шефарам"}', 'שפרעם', '{"he":"שפרעם","en":"Shefa-''Amr","ar":"شفاعمرو","ru":"Шефарам"}', 'הקונסרבטוריון העירוני, שפרעם', '{"he":"הקונסרבטוריון העירוני, שפרעם","en":"Municipal Conservatorium, Shefa-''Amr","ar":"المعهد الموسيقي البلدي، شفاعمرو","ru":"Городская консерватория, Шефарам"}', '04-9501135', 'amer@beit-almusica.org', 'https://www.tel-aviv.gov.il/', NULL, '{"sourceId": 83, "about": {"he": "קונסרבטוריון עיריית תל אביב-יפו.", "en": "Tel Aviv-Yafo Municipality conservatory.", "ar": "كونسرفاتوار بلدية تل أبيب-يافا.", "ru": "Консерватория муниципалитета Тель-Авива-Яффо."}, "photoUrls": [], "logoUrl": null, "location": {"city": "שפרעם", "cityEn": "Shefa-''''Amr", "coordinates": {"lat": 32.0853, "lng": 34.7818}}, "translations": {"en": {"name": "Tel Aviv-Yafo Conservatory", "city": "Shefa-''''Amr", "address": "Municipal Conservatorium, Shefa-''''Amr", "about": "Tel Aviv-Yafo Municipality conservatory."}, "ar": {"name": "بيت الموسيقى شفاعمرو", "city": "شفاعمرو", "address": "المعهد الموسيقي البلدي، شفاعمرو", "about": "كونسرفاتوار بلدية تل أبيب-يافا."}, "ru": {"name": "Бейт Альмусика Шефарам", "city": "Шефарам", "address": "Городская консерватория, Шефарам", "about": "Консерватория муниципалитета Тель-Авива-Яффо."}}}'),
('a1000000-0000-0000-0000-000000000084', '{"he":"קונסרבטוריון עכו","en":"Akko Municipal Conservatory","ar":"المعهد الموسيقي الإسرائيلي - تل أبيب","ru":"Израильская консерватория музыки - Тель-Авив"}', 'תל אביב', '{"he":"תל אביב","en":"Tel Aviv","ar":"تل أبيب","ru":"Тель-Авив"}', 'הקונסרבטוריון העירוני, תל אביב-יפו', '{"he":"הקונסרבטוריון העירוני, תל אביב-יפו","en":"Municipal Conservatorium, Tel Aviv-Yafo","ar":"المعهد الموسيقي البلدي، تل أبيب يافا","ru":"Городская консерватория, Тель-Авив-Яффо"}', '03-5460524', 'canellis@icm.org.il', 'https://www.consakko.com/', NULL, '{"sourceId": 84, "about": {"he": "קונסרבטוריון עירוני עכו, מציע שיעורי נגינה פרטניים במגוון כלים.", "en": "Acre municipal conservatory, offering private instrument lessons on a variety of instruments.", "ar": "كونسرفاتوار عكا البلدي، يقدم دروس عزف خاصة على مجموعة متنوعة من الآلات.", "ru": "Муниципальная консерватория Акко, предлагающая индивидуальные уроки на различных инструментах."}, "photoUrls": [], "logoUrl": null, "location": {"city": "תל אביב", "cityEn": "Tel Aviv", "coordinates": {"lat": 32.9283, "lng": 35.0818}}, "translations": {"en": {"name": "Akko Municipal Conservatory", "city": "Tel Aviv", "address": "Municipal Conservatorium, Tel Aviv-Yafo", "about": "Acre municipal conservatory, offering private instrument lessons on a variety of instruments."}, "ar": {"name": "المعهد الموسيقي الإسرائيلي - تل أبيب", "city": "تل أبيب", "address": "المعهد الموسيقي البلدي، تل أبيب يافا", "about": "كونسرفاتوار عكا البلدي، يقدم دروس عزف خاصة على مجموعة متنوعة من الآلات."}, "ru": {"name": "Израильская консерватория музыки - Тель-Авив", "city": "Тель-Авив", "address": "Городская консерватория, Тель-Авив-Яффо", "about": "Муниципальная консерватория Акко, предлагающая индивидуальные уроки на различных инструментах."}}}'),
('a1000000-0000-0000-0000-000000000085', '{"he":"קונסרבטוריון כרמיאל ב","en":"Karmiel Conservatory B","ar":"بلدية تل أبيب","ru":"Муниципалитет Тель-Авива"}', 'תל אביב - יפו', '{"he":"תל אביב - יפו","en":"Tel Aviv-Yafo","ar":"تل أبيب - يافا","ru":"Тель-Авив-Яффо"}', 'הקונסרבטוריון העירוני, תל מונד', '{"he":"הקונסרבטוריון העירוני, תל מונד","en":"Municipal Conservatorium, Tel Mond","ar":"المعهد الموسيقي البلدي، تل موند","ru":"Городская консерватория, Тель-Монд"}', '04-6298121', 'amar_ha@mail.tel-aviv.gov.il', 'https://www.conskarmiel.net/', NULL, '{"sourceId": 85, "about": {"he": "ענף נוסף של הקונסרבטוריון העירוני כרמיאל.", "en": "An additional branch of the Karmiel municipal conservatory.", "ar": "فرع إضافي للكونسرفاتوار البلدي في كرميئيل.", "ru": "Дополнительный филиал муниципальной консерватории Кармиэля."}, "photoUrls": [], "logoUrl": null, "location": {"city": "תל אביב - יפו", "cityEn": "Tel Aviv-Yafo", "coordinates": {"lat": 32.916, "lng": 35.2972}}, "translations": {"en": {"name": "Karmiel Conservatory B", "city": "Tel Aviv-Yafo", "address": "Municipal Conservatorium, Tel Mond", "about": "An additional branch of the Karmiel municipal conservatory."}, "ar": {"name": "بلدية تل أبيب", "city": "تل أبيب - يافا", "address": "المعهد الموسيقي البلدي، تل موند", "about": "فرع إضافي للكونسرفاتوار البلدي في كرميئيل."}, "ru": {"name": "Муниципалитет Тель-Авива", "city": "Тель-Авив-Яффо", "address": "Городская консерватория, Тель-Монд", "about": "Дополнительный филиал муниципальной консерватории Кармиэля."}}}')
ON CONFLICT (id) DO UPDATE SET
  name = COALESCE(EXCLUDED.name, conservatoriums.name),
  city = EXCLUDED.city,
  city_i18n = EXCLUDED.city_i18n,
  address = EXCLUDED.address,
  address_i18n = EXCLUDED.address_i18n,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website_url = EXCLUDED.website_url,
  logo_url = EXCLUDED.logo_url,
  description = COALESCE(conservatoriums.description, '{}'::jsonb) || EXCLUDED.description;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'tsahgertner@gmail.com', 'CONSERVATORIUM_ADMIN', 'צח', '{"he":"צח","en":"Tzach","ar":"تساح","ru":"Цах"}', 'גרטנר', '{"he":"גרטנר","en":"Gertner","ar":"غرتنر","ru":"Гертнер"}', NULL, '052-2830553', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'eilatcons@gmail.com', 'CONSERVATORIUM_ADMIN', 'לאוניד', '{"he":"לאוניד","en":"Leonid","ar":"ليونيد","ru":"Леонид"}', 'רוזנברג', '{"he":"רוזנברג","en":"Rozenberg","ar":"روزنبرغ","ru":"Розенберг"}', NULL, '052-2997840', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'yanina.kudlik@gmail.com;akadma66@gmail.com', 'CONSERVATORIUM_ADMIN', 'יאנינה', '{"he":"יאנינה","en":"Yanina","ar":"يانينا","ru":"Янина"}', 'קודליק', '{"he":"קודליק","en":"Kudlik","ar":"كودليك","ru":"Кудлик"}', NULL, '054-5726400', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'music@wegalil.org.il', 'CONSERVATORIUM_ADMIN', 'אלון', '{"he":"אלון","en":"Alon","ar":"ألون","ru":"Алон"}', 'שטרן', '{"he":"שטרן","en":"Stern","ar":"شتيرن","ru":"Штерн"}', NULL, '054-4372309', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'music@westnegev.org.il', 'CONSERVATORIUM_ADMIN', 'דודי', '{"he":"דודי","en":"Dudi","ar":"دودي","ru":"Дуди"}', 'יצחקי', '{"he":"יצחקי","en":"Yitzhaki","ar":"يتسحاكي","ru":"Ицхаки"}', NULL, '054-2503781', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'gil-ad@ironitash.org.il', 'CONSERVATORIUM_ADMIN', 'גילעד', '{"he":"גילעד","en":"Gilad","ar":"جلعاد","ru":"Гилад"}', 'ברדו', '{"he":"ברדו","en":"Bardo","ar":"باردو","ru":"Бардо"}', NULL, '050-6822224', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'noammal@br7.org.il;shai4199@gmail.com', 'CONSERVATORIUM_ADMIN', 'נועם', '{"he":"נועם","en":"Noam","ar":"نوعام","ru":"Ноам"}', 'מלכה', '{"he":"מלכה","en":"Malka","ar":"مالكا","ru":"Малка"}', NULL, '050-9873772', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'yoelcohenbs@gmail.com', 'CONSERVATORIUM_ADMIN', 'יואל', '{"he":"יואל","en":"Yoel","ar":"يوئيل","ru":"Йоэль"}', 'כהן-יוסי שור', '{"he":"כהן-יוסי שור","en":"Cohen - Yossi Shor","ar":"كوهين - يوسي شور","ru":"Коэн - Йоси Шор"}', NULL, '050-8334250', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 'kon@BS.matnasim.co.il', 'CONSERVATORIUM_ADMIN', 'מרינה', '{"he":"מרינה","en":"Marina","ar":"مارينا","ru":"Марина"}', 'קוגן', '{"he":"קוגן","en":"Kogan","ar":"كوجان","ru":"Коган"}', NULL, '054-7630153', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', 'shani@brener.org.il', 'CONSERVATORIUM_ADMIN', 'שני', '{"he":"שני","en":"Shani","ar":"شاني","ru":"Шани"}', 'דיגה', '{"he":"דיגה","en":"Diga","ar":"ديغا","ru":"Дига"}', NULL, '052-8723206', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000011', 'hila@tarbut-batyam.co.il', 'CONSERVATORIUM_ADMIN', 'הילה', '{"he":"הילה","en":"Hila","ar":"هيلا","ru":"Хила"}', 'אשד ארבילי', '{"he":"אשד ארבילי","en":"Eshed Arbili","ar":"إيشد أربيلي","ru":"Эшед Арбили"}', NULL, '054-4554054', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000012', 'omoboe1@gmail.com', 'CONSERVATORIUM_ADMIN', 'עמרי', '{"he":"עמרי","en":"Omri","ar":"عمري","ru":"Омри"}', 'רווה', '{"he":"רווה","en":"Raveh","ar":"رافيه","ru":"Раве"}', NULL, '054-3534175', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000013', 'mazulai@gmail.com', 'CONSERVATORIUM_ADMIN', 'רועי', '{"he":"רועי","en":"Roei","ar":"روعي","ru":"Рои"}', 'אזולאי', '{"he":"אזולאי","en":"Azoulay","ar":"أزولاي","ru":"Азулай"}', NULL, '058-4415259', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000014', 'ShiraTK@galil-elion.org.il;stoleralon@gmail.com', 'CONSERVATORIUM_ADMIN', 'שירה', '{"he":"שירה","en":"Shira","ar":"شيرا","ru":"Шира"}', 'טל קוגן', '{"he":"טל קוגן","en":"Tal Kogan","ar":"طال كوجان","ru":"Таль Коган"}', NULL, '050-7778112', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000015', 'yael@alumahod.com;music@alumahod.com', 'CONSERVATORIUM_ADMIN', 'יעל', '{"he":"יעל","en":"Yael","ar":"ياعيل","ru":"Яэль"}', 'פלוטניארז', '{"he":"פלוטניארז","en":"Plotniarz","ar":"بلوتنيارز","ru":"Плотниарз"}', NULL, '052-4619363', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000016', 'omerooly@gmail.com;music@arava.info', 'CONSERVATORIUM_ADMIN', 'עומר', '{"he":"עומר","en":"Omer","ar":"عومر","ru":"Омер"}', 'כהן', '{"he":"כהן","en":"Cohen","ar":"كوهين","ru":"Коэн"}', NULL, '054-6734190', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000017', 'dudi@music-herzliya.co.il;guy@music-herzliya.co.il', 'CONSERVATORIUM_ADMIN', 'דוד', '{"he":"דוד","en":"David","ar":"ديفيد","ru":"Давид"}', 'סופר', '{"he":"סופר","en":"Sofer","ar":"سوفر","ru":"Софер"}', NULL, '052-2235757', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000018', 'music@zamarin.org.il;rzmusic@zamarin.org.il', 'CONSERVATORIUM_ADMIN', 'בלה', '{"he":"בלה","en":"Bella","ar":"بيلا","ru":"Белла"}', 'ליטמן', '{"he":"ליטמן","en":"Litman","ar":"ليتمان","ru":"Литман"}', NULL, '052-8134911', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000019', 'viola.bull@gmail.com', 'CONSERVATORIUM_ADMIN', 'אנה', '{"he":"אנה","en":"Anna","ar":"آنا","ru":"Анна"}', 'שפירא', '{"he":"שפירא","en":"Shapira","ar":"شابيرا","ru":"Шапиро"}', NULL, '054-7906085', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000020', 'roieshkol@gmail.com', 'CONSERVATORIUM_ADMIN', 'רואי', '{"he":"רואי","en":"Roei","ar":"روعي","ru":"Рои"}', 'דיין', '{"he":"דיין","en":"Dayan","ar":"ديان","ru":"Даян"}', NULL, '054-7916707', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000021', 'a1000000-0000-0000-0000-000000000021', 'marrom.tofik@gmail.com;tofik-m@hadera.muni.il;cons-hadera@hadera.muni.il', 'CONSERVATORIUM_ADMIN', 'טופיק', '{"he":"טופיק","en":"Tofik","ar":"توفيق","ru":"Тофик"}', 'מרום', '{"he":"מרום","en":"Marom","ar":"مروم","ru":"Маром"}', NULL, '054-2495808', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000022', 'a1000000-0000-0000-0000-000000000022', 'omergab@gmail.com', 'CONSERVATORIUM_ADMIN', 'עומר', '{"he":"עומר","en":"Omer","ar":"عومر","ru":"Омер"}', 'גבאי', '{"he":"גבאי","en":"Gabay","ar":"غباي","ru":"Габай"}', NULL, '050-7365217', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000023', 'a1000000-0000-0000-0000-000000000023', 'amirstoler@gmail.com', 'CONSERVATORIUM_ADMIN', 'עמיר', '{"he":"עמיר","en":"Amir","ar":"أمير","ru":"Амир"}', 'סטולר', '{"he":"סטולר","en":"Stoler","ar":"ستولر","ru":"Столер"}', NULL, '052-2257064', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000024', 'snr@bezeqint.net', 'CONSERVATORIUM_ADMIN', 'רן', '{"he":"רן","en":"Ran","ar":"ران","ru":"Ран"}', 'פולסקי', '{"he":"פולסקי","en":"Polski","ar":"بولسكي","ru":"Польски"}', NULL, '052-2532649', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000025', 'a1000000-0000-0000-0000-000000000025', 'srubincons@barak.net.il', 'CONSERVATORIUM_ADMIN', 'יאנה', '{"he":"יאנה","en":"Yana","ar":"يانا","ru":"Яна"}', 'יוט', '{"he":"יוט","en":"Yot","ar":"يوت","ru":"Йот"}', NULL, '052-3879847', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000026', 'a1000000-0000-0000-0000-000000000026', 'Tiberias.cons@gmail.com', 'CONSERVATORIUM_ADMIN', 'עומרי', '{"he":"עומרי","en":"Omri","ar":"عمري","ru":"Омри"}', 'מראד', '{"he":"מראד","en":"Murad","ar":"مراد","ru":"Мурад"}', NULL, '050-6349799', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000027', 'a1000000-0000-0000-0000-000000000027', 'alexfridman750@gmail.com', 'CONSERVATORIUM_ADMIN', 'אלכס', '{"he":"אלכס","en":"Alex","ar":"أليكس","ru":"Алекс"}', 'פרידמן', '{"he":"פרידמן","en":"Friedman","ar":"فريدمان","ru":"Фридман"}', NULL, '050-7188882', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000028', 'a1000000-0000-0000-0000-000000000028', 'gutmanr1960@gmail.com', 'CONSERVATORIUM_ADMIN', 'ראובן', '{"he":"ראובן","en":"Reuven","ar":"رؤوفين","ru":"Реувен"}', 'גוטמן', '{"he":"גוטמן","en":"Gutman","ar":"جوتمان","ru":"Гутман"}', NULL, '054-9789263', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000029', 'a1000000-0000-0000-0000-000000000029', 'bmusicagilboa@gmail.com', 'CONSERVATORIUM_ADMIN', 'סטניסלב', '{"he":"סטניסלב","en":"Stanislav","ar":"ستانيسلاف","ru":"Станислав"}', 'גברילוב', '{"he":"גברילוב","en":"Gavrilov","ar":"غافريلوف","ru":"Гаврилов"}', NULL, '052-3756323', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000030', 'a1000000-0000-0000-0000-000000000030', 'inna_lux@walla.com', 'CONSERVATORIUM_ADMIN', 'אינה', '{"he":"אינה","en":"Inna","ar":"إينا","ru":"Инна"}', 'לוקסמבורג', '{"he":"לוקסמבורג","en":"Luxembourg","ar":"لوكسمبورغ","ru":"Люксембург"}', NULL, '050-8670920', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000031', 'a1000000-0000-0000-0000-000000000031', 'consyeruham@gmail.com', 'CONSERVATORIUM_ADMIN', 'שחף', '{"he":"שחף","en":"Shahaf","ar":"شاحاف","ru":"Шахаф"}', 'אאודה', '{"he":"אאודה","en":"Aouda","ar":"أعودا","ru":"Ауда"}', NULL, '050-7119714', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000032', 'a1000000-0000-0000-0000-000000000032', 'Musicgonenim@gmail.com', 'CONSERVATORIUM_ADMIN', 'מיכאל', '{"he":"מיכאל","en":"Michael","ar":"ميخائيل","ru":"Михаэль"}', 'קרסנר', '{"he":"קרסנר","en":"Krasner","ar":"كراسنر","ru":"Краснер"}', NULL, '054-5756055', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000033', 'a1000000-0000-0000-0000-000000000033', 'barak@jamd.ac.il', 'CONSERVATORIUM_ADMIN', 'ברק', '{"he":"ברק","en":"Barak","ar":"باراك","ru":"Барак"}', 'ייבין', '{"he":"ייבין","en":"Yevin","ar":"ييفين","ru":"Йевин"}', NULL, '052-2605067', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000034', 'a1000000-0000-0000-0000-000000000034', 'lena@hassadna.com', 'CONSERVATORIUM_ADMIN', 'לנה', '{"he":"לנה","en":"Lena","ar":"لينا","ru":"Лена"}', 'נמירובסקי ויסקינד', '{"he":"נמירובסקי ויסקינד","en":"Nemirovsky Wiskind","ar":"نميروفسكي فيسكيند","ru":"Немировски-Вискинд"}', NULL, '050-3512545', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000035', 'a1000000-0000-0000-0000-000000000035', 'benzion@ronshulamit.org.il;rivka@ronshulamit.org.il', 'CONSERVATORIUM_ADMIN', 'רבקה', '{"he":"רבקה","en":"Rivka","ar":"ريفكا","ru":"Ривка"}', 'נוימן', '{"he":"נוימן","en":"Neuman","ar":"نويمن","ru":"Нойман"}', NULL, '050-4148277', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000036', 'a1000000-0000-0000-0000-000000000036', 'beitmozart@gmail.com', 'CONSERVATORIUM_ADMIN', 'אמיל', '{"he":"אמיל","en":"Emil","ar":"إميل","ru":"Эмиль"}', 'ג''מאל', '{"he":"ג''מאל","en":"Jamal","ar":"جمال","ru":"Джамаль"}', NULL, '054-6469601', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000037', 'a1000000-0000-0000-0000-000000000037', 'reuvenmalach@gmail.com', 'CONSERVATORIUM_ADMIN', 'ראובן', '{"he":"ראובן","en":"Reuven","ar":"رؤوفين","ru":"Реувен"}', 'מלאך', '{"he":"מלאך","en":"Malach","ar":"مالاخ","ru":"Малах"}', NULL, '052-4316316', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000038', 'a1000000-0000-0000-0000-000000000038', 'musica@mky.co.il', 'CONSERVATORIUM_ADMIN', 'מרק', '{"he":"מרק","en":"Mark","ar":"مارك","ru":"Марк"}', 'וולוך', '{"he":"וולוך","en":"Voloch","ar":"فولوخ","ru":"Волох"}', NULL, '054-7289982', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000039', 'a1000000-0000-0000-0000-000000000039', 'ofereh@ksaba.co.il;Nirn@ksaba.co.il;SimchaT@ksaba.co.il', 'CONSERVATORIUM_ADMIN', 'עפר', '{"he":"עפר","en":"Ofer","ar":"عوفر","ru":"Офер"}', 'עין הבר', '{"he":"עין הבר","en":"Ein Habar","ar":"عين هبار","ru":"Эйн Хабар"}', NULL, '09-7640740', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000040', 'a1000000-0000-0000-0000-000000000040', 'dianabucur@gmail.com', 'CONSERVATORIUM_ADMIN', 'דיאנה', '{"he":"דיאנה","en":"Diana","ar":"ديانا","ru":"Диана"}', 'בוכור', '{"he":"בוכור","en":"Bucur","ar":"بوخور","ru":"Букур"}', NULL, '054-6626868', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000041', 'a1000000-0000-0000-0000-000000000041', 'shyoren1@gmail.com', 'CONSERVATORIUM_ADMIN', 'שי', '{"he":"שי","en":"Shai","ar":"شاي","ru":"Шай"}', 'אורן', '{"he":"אורן","en":"Oren","ar":"أورين","ru":"Орен"}', NULL, '052-8463924', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000042', 'a1000000-0000-0000-0000-000000000042', 'yizharmusicon@gmail.com', 'CONSERVATORIUM_ADMIN', 'יזהר', '{"he":"יזהר","en":"Yizhar","ar":"يزهار","ru":"Изхар"}', 'קרשון', '{"he":"קרשון","en":"Karshon","ar":"كرشون","ru":"Каршон"}', NULL, '052-4738592', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000043', 'a1000000-0000-0000-0000-000000000043', 'music@modiin.matnasim.co.il', 'CONSERVATORIUM_ADMIN', 'רדה', '{"he":"רדה","en":"Rada","ar":"رادا","ru":"Рада"}', 'גורביץ', '{"he":"גורביץ","en":"Gurevich","ar":"جورفيتش","ru":"Гуревич"}', NULL, '054-8810121', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000044', 'a1000000-0000-0000-0000-000000000044', 'nataliakatz61@gmail.com', 'CONSERVATORIUM_ADMIN', 'נטליה', '{"he":"נטליה","en":"Natalia","ar":"ناتاليا","ru":"Наталья"}', 'כץ', '{"he":"כץ","en":"Katz","ar":"كاتس","ru":"Кац"}', NULL, '054-7808787', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000045', 'a1000000-0000-0000-0000-000000000045', 'menachemg@mta.org.il', 'CONSERVATORIUM_ADMIN', 'מנחם', '{"he":"מנחם","en":"Menachem","ar":"مناحيم","ru":"Менахем"}', 'גרודזינסקי', '{"he":"גרודזינסקי","en":"Grodzinski","ar":"جرودزينسكي","ru":"Гродзински"}', NULL, '050-6952125', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000046', 'a1000000-0000-0000-0000-000000000046', 'yadharif.cons@m-yehuda.org.il;taob100@gmail.com', 'CONSERVATORIUM_ADMIN', 'אוהד', '{"he":"אוהד","en":"Ohad","ar":"أوهاد","ru":"Охад"}', 'טאוב', '{"he":"טאוב","en":"Taub","ar":"تاوب","ru":"Тауб"}', NULL, '054-4494572', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000047', 'a1000000-0000-0000-0000-000000000047', 'zhuravel7@gmail.com', 'CONSERVATORIUM_ADMIN', 'איליה', '{"he":"איליה","en":"Ilya","ar":"إيليا","ru":"Илья"}', 'ז''ורבל', '{"he":"ז''ורבל","en":"Zhuravel","ar":"زورافيل","ru":"Журавель"}', NULL, '054-9257390', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000048', 'a1000000-0000-0000-0000-000000000048', 'nata_k59@walla.co.il', 'CONSERVATORIUM_ADMIN', 'נטליה', '{"he":"נטליה","en":"Natalia","ar":"ناتاليا","ru":"Наталья"}', 'קליימן', '{"he":"קליימן","en":"Kleiman","ar":"كلايمان","ru":"Клейман"}', NULL, '050-8296489', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000049', 'a1000000-0000-0000-0000-000000000049', 'eranelbar1@gmail.com;music@maalot.matnasim.co.il', 'CONSERVATORIUM_ADMIN', 'ערן', '{"he":"ערן","en":"Eran","ar":"عيران","ru":"Эран"}', 'אל בר', '{"he":"אל בר","en":"El Bar","ar":"إل بار","ru":"Эль Бар"}', NULL, '052-6839023', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000050', 'a1000000-0000-0000-0000-000000000050', 'taisserh@gmail.com', 'CONSERVATORIUM_ADMIN', 'ד''''ר', '{"he":"ד''''ר","en":"Dr.","ar":"د.","ru":"Д-р"}', 'תייסיר חדאד', '{"he":"תייסיר חדאד","en":"Taysir Haddad","ar":"تيسير حداد","ru":"Тайсир Хаддад"}', NULL, '050-6282878', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000051', 'a1000000-0000-0000-0000-000000000051', 'dorvek@gmail.com', 'CONSERVATORIUM_ADMIN', 'דור', '{"he":"דור","en":"Dor","ar":"دور","ru":"Дор"}', 'וקסלר', '{"he":"וקסלר","en":"Veksler","ar":"وكسلر","ru":"Векслер"}', NULL, '050-4706000', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000052', 'a1000000-0000-0000-0000-000000000052', 'zerlina999@gmail.com', 'CONSERVATORIUM_ADMIN', 'מריה', '{"he":"מריה","en":"Maria","ar":"ماريا","ru":"Мария"}', 'זביאגין', '{"he":"זביאגין","en":"Zvyagin","ar":"زفياغين","ru":"Звягина"}', NULL, '054-4571966', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000053', 'a1000000-0000-0000-0000-000000000053', 'music@misgav.org.il', 'CONSERVATORIUM_ADMIN', 'אביבה', '{"he":"אביבה","en":"Aviva","ar":"أفيفا","ru":"Авива"}', 'חיים טובים', '{"he":"חיים טובים","en":"Haim Tovim","ar":"حاييم توفيم","ru":"Хаим Товим"}', NULL, '052-8392323', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000054', 'a1000000-0000-0000-0000-000000000054', 'reuvenmalach@gmail.com', 'CONSERVATORIUM_ADMIN', 'ראובן', '{"he":"ראובן","en":"Reuven","ar":"رؤوفين","ru":"Реувен"}', 'מלאך', '{"he":"מלאך","en":"Malach","ar":"مالاخ","ru":"Малах"}', NULL, '052-4316316', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000055', 'a1000000-0000-0000-0000-000000000055', 'vladimirk@ktnz.org.il;ran.david@ktnz.org.il', 'CONSERVATORIUM_ADMIN', 'רן', '{"he":"רן","en":"Ran","ar":"ران","ru":"Ран"}', 'דוד', '{"he":"דוד","en":"David","ar":"دافيد","ru":"Давид"}', NULL, '052-6645400', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000056', 'a1000000-0000-0000-0000-000000000056', 'sameer.makhoul@gmail.com', 'CONSERVATORIUM_ADMIN', 'סמיר', '{"he":"סמיר","en":"Samir","ar":"سمير","ru":"Самир"}', 'מחול', '{"he":"מחול","en":"Makhoul","ar":"مخول","ru":"Махул"}', NULL, '054-4607723', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000057', 'a1000000-0000-0000-0000-000000000057', 'elbaz41@gmail.com', 'CONSERVATORIUM_ADMIN', 'שמואל', '{"he":"שמואל","en":"Shmuel","ar":"شموئيل","ru":"Шмуэль"}', 'אלבז', '{"he":"אלבז","en":"Elbaz","ar":"إلباز","ru":"Эльбаз"}', NULL, '054-5790501', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000058', 'a1000000-0000-0000-0000-000000000058', 'uri@netanya-culture.co.il', 'CONSERVATORIUM_ADMIN', 'אורי', '{"he":"אורי","en":"Uri","ar":"أوري","ru":"Ури"}', 'רייסנר', '{"he":"רייסנר","en":"Reisner","ar":"رايسنر","ru":"Райснер"}', NULL, '054-6221892', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000059', 'a1000000-0000-0000-0000-000000000059', 'rika.lubin@gmail.com;Schwartzneta@gmail.com;dor-v@akko.muni.il', 'CONSERVATORIUM_ADMIN', 'דור', '{"he":"דור","en":"Dor","ar":"دور","ru":"Дор"}', 'וקסלר', '{"he":"וקסלר","en":"Veksler","ar":"وكسلر","ru":"Векслер"}', NULL, '050-4706000', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000060', 'a1000000-0000-0000-0000-000000000060', 'music@j-v.org.il', 'CONSERVATORIUM_ADMIN', 'נירה', '{"he":"נירה","en":"Nira","ar":"نيرا","ru":"Нира"}', 'ספיר פינסקי', '{"he":"ספיר פינסקי","en":"Sapir Pinsky","ar":"سابير فينسكي","ru":"Сапир Пински"}', NULL, '050-7246426', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000061', 'a1000000-0000-0000-0000-000000000061', 'musicenter@maianot.co.il', 'CONSERVATORIUM_ADMIN', 'יוסי', '{"he":"יוסי","en":"Yossi","ar":"يوسي","ru":"Йоси"}', 'שור', '{"he":"שור","en":"Shor","ar":"شور","ru":"Шор"}', NULL, '054-4684472', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000062', 'a1000000-0000-0000-0000-000000000062', 'yarivd@eyz.org.il', 'CONSERVATORIUM_ADMIN', 'יריב', '{"he":"יריב","en":"Yariv","ar":"ياريف","ru":"Ярив"}', 'דומני', '{"he":"דומני","en":"Domani","ar":"دوماني","ru":"Домани"}', NULL, '052-3743485', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000063', 'a1000000-0000-0000-0000-000000000063', 'peleg.rippin1@gmail.com', 'CONSERVATORIUM_ADMIN', 'פלג', '{"he":"פלג","en":"Peleg","ar":"بيليج","ru":"Пелег"}', 'ריפין', '{"he":"ריפין","en":"Rippin","ar":"ريفين","ru":"Риппин"}', NULL, '052-8748303', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000064', 'a1000000-0000-0000-0000-000000000064', 'shlomitm@ptikva.org.il;ravitn@ptikva.org.il', 'CONSERVATORIUM_ADMIN', 'שלומית', '{"he":"שלומית","en":"Shlomit","ar":"شلوميت","ru":"Шломит"}', 'מדר', '{"he":"מדר","en":"Madar","ar":"مدار","ru":"Мадар"}', NULL, '054-3214173', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000065', 'a1000000-0000-0000-0000-000000000065', 'music@kedumim.org.il;esty@matnasim.org.il', 'CONSERVATORIUM_ADMIN', 'אביעד', '{"he":"אביעד","en":"Aviad","ar":"أفيعاد","ru":"Авиад"}', 'אייל', '{"he":"אייל","en":"Eyal","ar":"إيال","ru":"Эяль"}', NULL, '054-2492280', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000066', 'a1000000-0000-0000-0000-000000000066', 'music@kadima.matnasim.co.il', 'CONSERVATORIUM_ADMIN', 'דוד', '{"he":"דוד","en":"David","ar":"ديفيد","ru":"Давид"}', 'סולן', '{"he":"סולן","en":"Solan","ar":"سولان","ru":"Солан"}', NULL, '050-8615502', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000067', 'a1000000-0000-0000-0000-000000000067', 'oudayosaf@yahoo.com', 'CONSERVATORIUM_ADMIN', 'גוזיף', '{"he":"גוזיף","en":"Joseph","ar":"جوزيف","ru":"Джозеф"}', 'עודה', '{"he":"עודה","en":"Odeh","ar":"عودة","ru":"Оде"}', NULL, '052-5523197', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000068', 'a1000000-0000-0000-0000-000000000068', 'bararmon@onomusic.org', 'CONSERVATORIUM_ADMIN', 'בר', '{"he":"בר","en":"Bar","ar":"بار","ru":"Бар"}', 'ערמון', '{"he":"ערמון","en":"Armon","ar":"أرمون","ru":"Армон"}', NULL, '054-2440894', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000069', 'a1000000-0000-0000-0000-000000000069', 'tanya82@ka.matnasim.co.il', 'CONSERVATORIUM_ADMIN', 'טניה', '{"he":"טניה","en":"Tanya","ar":"تانيا","ru":"Таня"}', 'שפירא', '{"he":"שפירא","en":"Shapira","ar":"شابيرا","ru":"Шапиро"}', NULL, '054-6203671', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000070', 'a1000000-0000-0000-0000-000000000070', 'asafa4@gmail.com', 'CONSERVATORIUM_ADMIN', 'אנה', '{"he":"אנה","en":"Anna","ar":"آنا","ru":"Анна"}', 'אסף', '{"he":"אסף","en":"Assaf","ar":"أساف","ru":"Асаф"}', NULL, '050-2707744', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000071', 'a1000000-0000-0000-0000-000000000071', 'muzik@kiryattiv.matnasim.co.il', 'CONSERVATORIUM_ADMIN', 'חזי', '{"he":"חזי","en":"Hezi","ar":"حيزي","ru":"Хези"}', 'פלד', '{"he":"פלד","en":"Peled","ar":"بيليد","ru":"Пелед"}', NULL, '052-3714775', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000072', 'a1000000-0000-0000-0000-000000000072', 'Innag@k-yam.co.il', 'CONSERVATORIUM_ADMIN', 'אינה', '{"he":"אינה","en":"Inna","ar":"إينا","ru":"Инна"}', 'גולקו', '{"he":"גולקו","en":"Golko","ar":"جولكو","ru":"Голко"}', NULL, '054-6052558', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000073', 'a1000000-0000-0000-0000-000000000073', 'ys44699@gmail.com', 'CONSERVATORIUM_ADMIN', 'יוני', '{"he":"יוני","en":"Yoni","ar":"يوني","ru":"Йони"}', 'שמעוני', '{"he":"שמעוני","en":"Shimoni","ar":"شمعوني","ru":"Шимони"}', NULL, '052-2663695', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000074', 'a1000000-0000-0000-0000-000000000074', 'siraj.conservatory@gmail.com', 'CONSERVATORIUM_ADMIN', 'וורוד', '{"he":"וורוד","en":"Wurud","ar":"ورود","ru":"Вуруд"}', 'ג''ובראן בשארה', '{"he":"ג''ובראן בשארה","en":"Jubran Bishara","ar":"جبران بشارة","ru":"Джубран Бишара"}', NULL, '052-8088404', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000075', 'a1000000-0000-0000-0000-000000000075', 'yarongan@gmail.com', 'CONSERVATORIUM_ADMIN', 'ירון', '{"he":"ירון","en":"Yaron","ar":"يارون","ru":"Ярон"}', 'גן', '{"he":"גן","en":"Gan","ar":"جان","ru":"Ган"}', NULL, '054-4765786', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000076', 'a1000000-0000-0000-0000-000000000076', 'vocalsingers@gmail.com', 'CONSERVATORIUM_ADMIN', 'שולי', '{"he":"שולי","en":"Shuli","ar":"شولي","ru":"Шули"}', 'קורן', '{"he":"קורן","en":"Koren","ar":"كورين","ru":"Корен"}', NULL, '050-2969999', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000077', 'a1000000-0000-0000-0000-000000000077', 'con1@bezeqint.net', 'CONSERVATORIUM_ADMIN', 'ריטה', '{"he":"ריטה","en":"Rita","ar":"ريتا","ru":"Рита"}', 'וינוקור', '{"he":"וינוקור","en":"Vinokur","ar":"فينوكور","ru":"Винокур"}', NULL, '052-4840469', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000078', 'a1000000-0000-0000-0000-000000000078', 'michaela.bh@gmail.com', 'CONSERVATORIUM_ADMIN', 'מיכאלה', '{"he":"מיכאלה","en":"Michaela","ar":"ميخائيلا","ru":"Михаэла"}', 'בן חיים', '{"he":"בן חיים","en":"Ben Haim","ar":"بن حاييم","ru":"Бен-Хаим"}', NULL, '052-5547878', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000079', 'a1000000-0000-0000-0000-000000000079', 'royzumusic@gmail.com;roy_z@ramhash.co.il', 'CONSERVATORIUM_ADMIN', 'רועי', '{"he":"רועי","en":"Roei","ar":"روعي","ru":"Рои"}', 'זוארץ', '{"he":"זוארץ","en":"Zuaretz","ar":"زواريتس","ru":"Зуарец"}', NULL, '052-3884400', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000080', 'a1000000-0000-0000-0000-000000000080', 'limora@raanana.muni.il;raananamusiccenter@gmail.com', 'CONSERVATORIUM_ADMIN', 'לימור', '{"he":"לימור","en":"Limor","ar":"ليمور","ru":"Лимор"}', 'אקטע', '{"he":"אקטע","en":"Akta","ar":"أكتا","ru":"Акта"}', NULL, '052-8197173', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000081', 'a1000000-0000-0000-0000-000000000081', 'avivr@shoham.muni.il', 'CONSERVATORIUM_ADMIN', 'אביב', '{"he":"אביב","en":"Aviv","ar":"أفيف","ru":"Авив"}', 'רון', '{"he":"רון","en":"Ron","ar":"رون","ru":"Рон"}', NULL, '054-5960848', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000082', 'a1000000-0000-0000-0000-000000000082', 'musicm@sng.org.il', 'CONSERVATORIUM_ADMIN', 'מאור', '{"he":"מאור","en":"Maor","ar":"ماؤور","ru":"Маор"}', 'לוי', '{"he":"לוי","en":"Levi","ar":"ليفي","ru":"Леви"}', NULL, '054-7804983', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000083', 'a1000000-0000-0000-0000-000000000083', 'amer@beit-almusica.org', 'CONSERVATORIUM_ADMIN', 'עאמר', '{"he":"עאמר","en":"Amer","ar":"عامر","ru":"Амер"}', 'נח''לה', '{"he":"נח''לה","en":"Nakhleh","ar":"نخلة","ru":"Нахле"}', NULL, '054-6606848', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000084', 'a1000000-0000-0000-0000-000000000084', 'canellis@icm.org.il', 'CONSERVATORIUM_ADMIN', 'קוסטין', '{"he":"קוסטין","en":"Costin","ar":"كوستين","ru":"Костин"}', 'קנליס-אוליאר', '{"he":"קנליס-אוליאר","en":"Canellis-Olier","ar":"كانيليس-أوليار","ru":"Канеллис-Ольер"}', NULL, '052-2222232', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('d1000000-0000-0000-0000-000000000085', 'a1000000-0000-0000-0000-000000000085', 'amar_ha@mail.tel-aviv.gov.il', 'CONSERVATORIUM_ADMIN', 'חגי', '{"he":"חגי","en":"Hagai","ar":"حجاي","ru":"Хагай"}', 'אמר', '{"he":"אמר","en":"Amar","ar":"أمار","ru":"Амар"}', NULL, '052-6550497', NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

-- BEGIN AUTO-SEED-ADMINS
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'delegated-admin-cons-1@harmonia.local', 'DELEGATED_ADMIN', 'צח', '{"he":"צח","en":"Tzach","ar":"تساح","ru":"Цах"}', 'גרטנר', '{"he":"גרטנר","en":"Gertner","ar":"غرتنر","ru":"Гертнер"}', NULL, '04-6703991', NULL, TRUE),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'delegated-admin-cons-2@harmonia.local', 'DELEGATED_ADMIN', 'לאוניד', '{"he":"לאוניד","en":"Leonid","ar":"ليونيد","ru":"Леонид"}', 'רוזנברג', '{"he":"רוזנברג","en":"Rozenberg","ar":"روزنبرغ","ru":"Розенберг"}', NULL, '08-6377036', NULL, TRUE),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'delegated-admin-cons-3@harmonia.local', 'DELEGATED_ADMIN', 'יאנינה', '{"he":"יאנינה","en":"Yanina","ar":"يانينا","ru":"Янина"}', 'קודליק', '{"he":"קודליק","en":"Kudlik","ar":"كودليك","ru":"Кудлик"}', NULL, '08-8545135', NULL, TRUE),
('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'delegated-admin-cons-4@harmonia.local', 'DELEGATED_ADMIN', 'אלון', '{"he":"אלון","en":"Alon","ar":"ألون","ru":"Алон"}', 'שטרן', '{"he":"שטרן","en":"Stern","ar":"شتيرن","ru":"Штерн"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'delegated-admin-cons-5@harmonia.local', 'DELEGATED_ADMIN', 'דודי', '{"he":"דודי","en":"Dudi","ar":"دودي","ru":"Дуди"}', 'יצחקי', '{"he":"יצחקי","en":"Yitzhaki","ar":"يتسحاكي","ru":"Ицхаки"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'delegated-admin-cons-6@harmonia.local', 'DELEGATED_ADMIN', 'גילעד', '{"he":"גילעד","en":"Gilad","ar":"جلعاد","ru":"Гилад"}', 'ברדו', '{"he":"ברדו","en":"Bardo","ar":"باردو","ru":"Бардо"}', NULL, '08-6792330', NULL, TRUE),
('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'delegated-admin-cons-7@harmonia.local', 'DELEGATED_ADMIN', 'נועם', '{"he":"נועם","en":"Noam","ar":"نوعام","ru":"Ноам"}', 'מלכה', '{"he":"מלכה","en":"Malka","ar":"مالكا","ru":"Малка"}', NULL, '08-6279606', NULL, TRUE),
('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'delegated-admin-cons-8@harmonia.local', 'DELEGATED_ADMIN', 'יואל', '{"he":"יואל","en":"Yoel","ar":"يوئيل","ru":"Йоэль"}', 'כהן-יוסי שור', '{"he":"כהן-יוסי שור","en":"Cohen - Yossi Shor","ar":"كوهين - يوسي شور","ru":"Коэн - Йоси Шор"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 'delegated-admin-cons-9@harmonia.local', 'DELEGATED_ADMIN', 'מרינה', '{"he":"מרינה","en":"Marina","ar":"مارينا","ru":"Марина"}', 'קוגן', '{"he":"קוגן","en":"Kogan","ar":"كوجان","ru":"Коган"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', 'delegated-admin-cons-10@harmonia.local', 'DELEGATED_ADMIN', 'שני', '{"he":"שני","en":"Shani","ar":"شاني","ru":"Шани"}', 'דיגה', '{"he":"דיגה","en":"Diga","ar":"ديغا","ru":"Дига"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000011', 'delegated-admin-cons-11@harmonia.local', 'DELEGATED_ADMIN', 'הילה', '{"he":"הילה","en":"Hila","ar":"هيلا","ru":"Хила"}', 'אשד ארבילי', '{"he":"אשד ארבילי","en":"Eshed Arbili","ar":"إيشد أربيلي","ru":"Эшед Арбили"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000012', 'delegated-admin-cons-12@harmonia.local', 'DELEGATED_ADMIN', 'עמרי', '{"he":"עמרי","en":"Omri","ar":"عمري","ru":"Омри"}', 'רווה', '{"he":"רווה","en":"Raveh","ar":"رافيه","ru":"Раве"}', NULL, '03-7323349', NULL, TRUE),
('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000013', 'delegated-admin-cons-13@harmonia.local', 'DELEGATED_ADMIN', 'רועי', '{"he":"רועי","en":"Roei","ar":"روعي","ru":"Рои"}', 'אזולאי', '{"he":"אזולאי","en":"Azoulay","ar":"أزولاي","ru":"Азулай"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000014', 'delegated-admin-cons-14@harmonia.local', 'DELEGATED_ADMIN', 'שירה', '{"he":"שירה","en":"Shira","ar":"شيرا","ru":"Шира"}', 'טל קוגן', '{"he":"טל קוגן","en":"Tal Kogan","ar":"طال كوجان","ru":"Таль Коган"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000015', 'delegated-admin-cons-15@harmonia.local', 'DELEGATED_ADMIN', 'יעל', '{"he":"יעל","en":"Yael","ar":"ياعيل","ru":"Яэль"}', 'פלוטניארז', '{"he":"פלוטניארז","en":"Plotniarz","ar":"بلوتنيارز","ru":"Плотниарз"}', NULL, '09-7425184', NULL, TRUE),
('b1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000016', 'delegated-admin-cons-16@harmonia.local', 'DELEGATED_ADMIN', 'עומר', '{"he":"עומר","en":"Omer","ar":"عومر","ru":"Омер"}', 'כהן', '{"he":"כהן","en":"Cohen","ar":"كوهين","ru":"Коэн"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000017', 'delegated-admin-cons-17@harmonia.local', 'DELEGATED_ADMIN', 'דוד', '{"he":"דוד","en":"David","ar":"ديفيد","ru":"Давид"}', 'סופר', '{"he":"סופר","en":"Sofer","ar":"سوفر","ru":"Софер"}', NULL, '09-9506625', NULL, TRUE),
('b1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000018', 'delegated-admin-cons-18@harmonia.local', 'DELEGATED_ADMIN', 'בלה', '{"he":"בלה","en":"Bella","ar":"بيلا","ru":"Белла"}', 'ליטמן', '{"he":"ליטמן","en":"Litman","ar":"ليتمان","ru":"Литман"}', NULL, '04-6297018', NULL, TRUE),
('b1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000019', 'delegated-admin-cons-19@harmonia.local', 'DELEGATED_ADMIN', 'אנה', '{"he":"אנה","en":"Anna","ar":"آنا","ru":"Анна"}', 'שפירא', '{"he":"שפירא","en":"Shapira","ar":"شابيرا","ru":"Шапиро"}', NULL, '04-6331686', NULL, TRUE),
('b1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000020', 'delegated-admin-cons-20@harmonia.local', 'DELEGATED_ADMIN', 'רואי', '{"he":"רואי","en":"Roei","ar":"روعي","ru":"Рои"}', 'דיין', '{"he":"דיין","en":"Dayan","ar":"ديان","ru":"Даян"}', NULL, '08-9929166', NULL, TRUE),
('b1000000-0000-0000-0000-000000000021', 'a1000000-0000-0000-0000-000000000021', 'delegated-admin-cons-21@harmonia.local', 'DELEGATED_ADMIN', 'טופיק', '{"he":"טופיק","en":"Tofik","ar":"توفيق","ru":"Тофик"}', 'מרום', '{"he":"מרום","en":"Marom","ar":"مروم","ru":"Маром"}', NULL, '04-6331686', NULL, TRUE),
('b1000000-0000-0000-0000-000000000022', 'a1000000-0000-0000-0000-000000000022', 'delegated-admin-cons-22@harmonia.local', 'DELEGATED_ADMIN', 'עומר', '{"he":"עומר","en":"Omer","ar":"عومر","ru":"Омер"}', 'גבאי', '{"he":"גבאי","en":"Gabay","ar":"غباي","ru":"Габай"}', NULL, '03-5500012', NULL, TRUE),
('b1000000-0000-0000-0000-000000000023', 'a1000000-0000-0000-0000-000000000023', 'delegated-admin-cons-23@harmonia.local', 'DELEGATED_ADMIN', 'עמיר', '{"he":"עמיר","en":"Amir","ar":"أمير","ru":"Амир"}', 'סטולר', '{"he":"סטולר","en":"Stoler","ar":"ستولر","ru":"Столер"}', NULL, '04-6299712', NULL, TRUE),
('b1000000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000024', 'delegated-admin-cons-24@harmonia.local', 'DELEGATED_ADMIN', 'רן', '{"he":"רן","en":"Ran","ar":"ران","ru":"Ран"}', 'פולסקי', '{"he":"פולסקי","en":"Polski","ar":"بولسكي","ru":"Польски"}', NULL, '04-8629787', NULL, TRUE),
('b1000000-0000-0000-0000-000000000025', 'a1000000-0000-0000-0000-000000000025', 'delegated-admin-cons-25@harmonia.local', 'DELEGATED_ADMIN', 'יאנה', '{"he":"יאנה","en":"Yana","ar":"يانا","ru":"Яна"}', 'יוט', '{"he":"יוט","en":"Yot","ar":"يوت","ru":"Йот"}', NULL, '04-8521530', NULL, TRUE),
('b1000000-0000-0000-0000-000000000026', 'a1000000-0000-0000-0000-000000000026', 'delegated-admin-cons-26@harmonia.local', 'DELEGATED_ADMIN', 'עומרי', '{"he":"עומרי","en":"Omri","ar":"عمري","ru":"Омри"}', 'מראד', '{"he":"מראד","en":"Murad","ar":"مراد","ru":"Мурад"}', NULL, '04-6731733', NULL, TRUE),
('b1000000-0000-0000-0000-000000000027', 'a1000000-0000-0000-0000-000000000027', 'delegated-admin-cons-27@harmonia.local', 'DELEGATED_ADMIN', 'אלכס', '{"he":"אלכס","en":"Alex","ar":"أليكس","ru":"Алекс"}', 'פרידמן', '{"he":"פרידמן","en":"Friedman","ar":"فريدمان","ru":"Фридман"}', NULL, '04-6598212', NULL, TRUE),
('b1000000-0000-0000-0000-000000000028', 'a1000000-0000-0000-0000-000000000028', 'delegated-admin-cons-28@harmonia.local', 'DELEGATED_ADMIN', 'ראובן', '{"he":"ראובן","en":"Reuven","ar":"رؤوفين","ru":"Реувен"}', 'גוטמן', '{"he":"גוטמן","en":"Gutman","ar":"جوتمان","ru":"Гутман"}', NULL, '08-9194470', NULL, TRUE),
('b1000000-0000-0000-0000-000000000029', 'a1000000-0000-0000-0000-000000000029', 'delegated-admin-cons-29@harmonia.local', 'DELEGATED_ADMIN', 'סטניסלב', '{"he":"סטניסלב","en":"Stanislav","ar":"ستانيسلاف","ru":"Станислав"}', 'גברילוב', '{"he":"גברילוב","en":"Gavrilov","ar":"غافريلوف","ru":"Гаврилов"}', NULL, '04-6598212', NULL, TRUE),
('b1000000-0000-0000-0000-000000000030', 'a1000000-0000-0000-0000-000000000030', 'delegated-admin-cons-30@harmonia.local', 'DELEGATED_ADMIN', 'אינה', '{"he":"אינה","en":"Inna","ar":"إينا","ru":"Инна"}', 'לוקסמבורג', '{"he":"לוקסמבורג","en":"Luxembourg","ar":"لوكسمبورغ","ru":"Люксембург"}', NULL, '04-9893986', NULL, TRUE),
('b1000000-0000-0000-0000-000000000031', 'a1000000-0000-0000-0000-000000000031', 'delegated-admin-cons-31@harmonia.local', 'DELEGATED_ADMIN', 'שחף', '{"he":"שחף","en":"Shahaf","ar":"شاحاف","ru":"Шахаф"}', 'אאודה', '{"he":"אאודה","en":"Aouda","ar":"أعودا","ru":"Ауда"}', NULL, '08-6687000', NULL, TRUE),
('b1000000-0000-0000-0000-000000000032', 'a1000000-0000-0000-0000-000000000032', 'delegated-admin-cons-32@harmonia.local', 'DELEGATED_ADMIN', 'מיכאל', '{"he":"מיכאל","en":"Michael","ar":"ميخائيل","ru":"Михаэль"}', 'קרסנר', '{"he":"קרסנר","en":"Krasner","ar":"كراسنر","ru":"Краснер"}', NULL, '02-5630017', NULL, TRUE),
('b1000000-0000-0000-0000-000000000033', 'a1000000-0000-0000-0000-000000000033', 'delegated-admin-cons-33@harmonia.local', 'DELEGATED_ADMIN', 'ברק', '{"he":"ברק","en":"Barak","ar":"باراك","ru":"Барак"}', 'ייבין', '{"he":"ייבין","en":"Yevin","ar":"ييفين","ru":"Йевин"}', NULL, '02-6550422', NULL, TRUE),
('b1000000-0000-0000-0000-000000000034', 'a1000000-0000-0000-0000-000000000034', 'delegated-admin-cons-34@harmonia.local', 'DELEGATED_ADMIN', 'לנה', '{"he":"לנה","en":"Lena","ar":"لينا","ru":"Лена"}', 'נמירובסקי ויסקינד', '{"he":"נמירובסקי ויסקינד","en":"Nemirovsky Wiskind","ar":"نميروفسكي فيسكيند","ru":"Немировски-Вискинд"}', NULL, '02-5630017', NULL, TRUE),
('b1000000-0000-0000-0000-000000000035', 'a1000000-0000-0000-0000-000000000035', 'delegated-admin-cons-35@harmonia.local', 'DELEGATED_ADMIN', 'רבקה', '{"he":"רבקה","en":"Rivka","ar":"ريفكا","ru":"Ривка"}', 'נוימן', '{"he":"נוימן","en":"Neuman","ar":"نويمن","ru":"Нойман"}', NULL, '02-6528531', NULL, TRUE),
('b1000000-0000-0000-0000-000000000036', 'a1000000-0000-0000-0000-000000000036', 'delegated-admin-cons-36@harmonia.local', 'DELEGATED_ADMIN', 'אמיל', '{"he":"אמיל","en":"Emil","ar":"إميل","ru":"Эмиль"}', 'ג''מאל', '{"he":"ג''מאל","en":"Jamal","ar":"جمال","ru":"Джамаль"}', NULL, '04-9968532', NULL, TRUE),
('b1000000-0000-0000-0000-000000000037', 'a1000000-0000-0000-0000-000000000037', 'delegated-admin-cons-37@harmonia.local', 'DELEGATED_ADMIN', 'ראובן', '{"he":"ראובן","en":"Reuven","ar":"رؤوفين","ru":"Реувен"}', 'מלאך', '{"he":"מלאך","en":"Malach","ar":"مالاخ","ru":"Малах"}', NULL, '04-9979131', NULL, TRUE),
('b1000000-0000-0000-0000-000000000038', 'a1000000-0000-0000-0000-000000000038', 'delegated-admin-cons-38@harmonia.local', 'DELEGATED_ADMIN', 'מרק', '{"he":"מרק","en":"Mark","ar":"مارك","ru":"Марк"}', 'וולוך', '{"he":"וולוך","en":"Voloch","ar":"فولوخ","ru":"Волох"}', NULL, '09-8985111', NULL, TRUE),
('b1000000-0000-0000-0000-000000000039', 'a1000000-0000-0000-0000-000000000039', 'delegated-admin-cons-39@harmonia.local', 'DELEGATED_ADMIN', 'עפר', '{"he":"עפר","en":"Ofer","ar":"عوفر","ru":"Офер"}', 'עין הבר', '{"he":"עין הבר","en":"Ein Habar","ar":"عين هبار","ru":"Эйн Хабар"}', NULL, '09-7640740', NULL, TRUE),
('b1000000-0000-0000-0000-000000000040', 'a1000000-0000-0000-0000-000000000040', 'delegated-admin-cons-40@harmonia.local', 'DELEGATED_ADMIN', 'דיאנה', '{"he":"דיאנה","en":"Diana","ar":"ديانا","ru":"Диана"}', 'בוכור', '{"he":"בוכור","en":"Bucur","ar":"بوخور","ru":"Букур"}', NULL, '04-9580443', NULL, TRUE),
('b1000000-0000-0000-0000-000000000041', 'a1000000-0000-0000-0000-000000000041', 'delegated-admin-cons-41@harmonia.local', 'DELEGATED_ADMIN', 'שי', '{"he":"שי","en":"Shai","ar":"شاي","ru":"Шай"}', 'אורן', '{"he":"אורן","en":"Oren","ar":"أورين","ru":"Орен"}', NULL, '04-6238121', NULL, TRUE),
('b1000000-0000-0000-0000-000000000042', 'a1000000-0000-0000-0000-000000000042', 'delegated-admin-cons-42@harmonia.local', 'DELEGATED_ADMIN', 'יזהר', '{"he":"יזהר","en":"Yizhar","ar":"يزهار","ru":"Изхар"}', 'קרשון', '{"he":"קרשון","en":"Karshon","ar":"كرشون","ru":"Каршон"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000043', 'a1000000-0000-0000-0000-000000000043', 'delegated-admin-cons-43@harmonia.local', 'DELEGATED_ADMIN', 'רדה', '{"he":"רדה","en":"Rada","ar":"رادا","ru":"Рада"}', 'גורביץ', '{"he":"גורביץ","en":"Gurevich","ar":"جورفيتش","ru":"Гуревич"}', NULL, '08-9702210', NULL, TRUE),
('b1000000-0000-0000-0000-000000000044', 'a1000000-0000-0000-0000-000000000044', 'delegated-admin-cons-44@harmonia.local', 'DELEGATED_ADMIN', 'נטליה', '{"he":"נטליה","en":"Natalia","ar":"ناتاليا","ru":"Наталья"}', 'כץ', '{"he":"כץ","en":"Katz","ar":"كاتس","ru":"Кац"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000045', 'a1000000-0000-0000-0000-000000000045', 'delegated-admin-cons-45@harmonia.local', 'DELEGATED_ADMIN', 'מנחם', '{"he":"מנחם","en":"Menachem","ar":"مناحيم","ru":"Менахем"}', 'גרודזינסקי', '{"he":"גרודזינסקי","en":"Grodzinski","ar":"جرودزينسكي","ru":"Гродзински"}', NULL, '04-9109011', NULL, TRUE),
('b1000000-0000-0000-0000-000000000046', 'a1000000-0000-0000-0000-000000000046', 'delegated-admin-cons-46@harmonia.local', 'DELEGATED_ADMIN', 'אוהד', '{"he":"אוהד","en":"Ohad","ar":"أوهاد","ru":"Охад"}', 'טאוב', '{"he":"טאוב","en":"Taub","ar":"تاوب","ru":"Тауб"}', NULL, '02-5798343', NULL, TRUE),
('b1000000-0000-0000-0000-000000000047', 'a1000000-0000-0000-0000-000000000047', 'delegated-admin-cons-47@harmonia.local', 'DELEGATED_ADMIN', 'איליה', '{"he":"איליה","en":"Ilya","ar":"إيليا","ru":"Илья"}', 'ז''ורבל', '{"he":"ז''ורבל","en":"Zhuravel","ar":"زورافيل","ru":"Журавель"}', NULL, '00-3767373', NULL, TRUE),
('b1000000-0000-0000-0000-000000000048', 'a1000000-0000-0000-0000-000000000048', 'delegated-admin-cons-48@harmonia.local', 'DELEGATED_ADMIN', 'נטליה', '{"he":"נטליה","en":"Natalia","ar":"ناتاليا","ru":"Наталья"}', 'קליימן', '{"he":"קליימן","en":"Kleiman","ar":"كلايمان","ru":"Клейман"}', NULL, '02-5798343', NULL, TRUE),
('b1000000-0000-0000-0000-000000000049', 'a1000000-0000-0000-0000-000000000049', 'delegated-admin-cons-49@harmonia.local', 'DELEGATED_ADMIN', 'ערן', '{"he":"ערן","en":"Eran","ar":"عيران","ru":"Эран"}', 'אל בר', '{"he":"אל בר","en":"El Bar","ar":"إل بار","ru":"Эль Бар"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000050', 'a1000000-0000-0000-0000-000000000050', 'delegated-admin-cons-50@harmonia.local', 'DELEGATED_ADMIN', 'ד''''ר', '{"he":"ד''''ר","en":"Dr.","ar":"د.","ru":"Д-р"}', 'תייסיר חדאד', '{"he":"תייסיר חדאד","en":"Taysir Haddad","ar":"تيسير حداد","ru":"Тайсир Хаддад"}', NULL, '04-9570937', NULL, TRUE),
('b1000000-0000-0000-0000-000000000051', 'a1000000-0000-0000-0000-000000000051', 'delegated-admin-cons-51@harmonia.local', 'DELEGATED_ADMIN', 'דור', '{"he":"דור","en":"Dor","ar":"دور","ru":"Дор"}', 'וקסלר', '{"he":"וקסלר","en":"Veksler","ar":"وكسلر","ru":"Векслер"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000052', 'a1000000-0000-0000-0000-000000000052', 'delegated-admin-cons-52@harmonia.local', 'DELEGATED_ADMIN', 'מריה', '{"he":"מריה","en":"Maria","ar":"ماريا","ru":"Мария"}', 'זביאגין', '{"he":"זביאגין","en":"Zvyagin","ar":"زفياغين","ru":"Звягина"}', NULL, '08-9929420', NULL, TRUE),
('b1000000-0000-0000-0000-000000000053', 'a1000000-0000-0000-0000-000000000053', 'delegated-admin-cons-53@harmonia.local', 'DELEGATED_ADMIN', 'אביבה', '{"he":"אביבה","en":"Aviva","ar":"أفيفا","ru":"Авива"}', 'חיים טובים', '{"he":"חיים טובים","en":"Haim Tovim","ar":"حاييم توفيم","ru":"Хаим Товим"}', NULL, '08-9100499', NULL, TRUE),
('b1000000-0000-0000-0000-000000000054', 'a1000000-0000-0000-0000-000000000054', 'delegated-admin-cons-54@harmonia.local', 'DELEGATED_ADMIN', 'ראובן', '{"he":"ראובן","en":"Reuven","ar":"رؤوفين","ru":"Реувен"}', 'מלאך', '{"he":"מלאך","en":"Malach","ar":"مالاخ","ru":"Малах"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000055', 'a1000000-0000-0000-0000-000000000055', 'delegated-admin-cons-55@harmonia.local', 'DELEGATED_ADMIN', 'רן', '{"he":"רן","en":"Ran","ar":"ران","ru":"Ран"}', 'דוד', '{"he":"דוד","en":"David","ar":"دافيد","ru":"Давид"}', NULL, '08-9100499', NULL, TRUE),
('b1000000-0000-0000-0000-000000000056', 'a1000000-0000-0000-0000-000000000056', 'delegated-admin-cons-56@harmonia.local', 'DELEGATED_ADMIN', 'סמיר', '{"he":"סמיר","en":"Samir","ar":"سمير","ru":"Самир"}', 'מחול', '{"he":"מחול","en":"Makhoul","ar":"مخول","ru":"Махул"}', NULL, '09-8308800', NULL, TRUE),
('b1000000-0000-0000-0000-000000000057', 'a1000000-0000-0000-0000-000000000057', 'delegated-admin-cons-57@harmonia.local', 'DELEGATED_ADMIN', 'שמואל', '{"he":"שמואל","en":"Shmuel","ar":"شموئيل","ru":"Шмуэль"}', 'אלבז', '{"he":"אלבז","en":"Elbaz","ar":"إلباز","ru":"Эльбаз"}', NULL, '08-9934922', NULL, TRUE),
('b1000000-0000-0000-0000-000000000058', 'a1000000-0000-0000-0000-000000000058', 'delegated-admin-cons-58@harmonia.local', 'DELEGATED_ADMIN', 'אורי', '{"he":"אורי","en":"Uri","ar":"أوري","ru":"Ури"}', 'רייסנר', '{"he":"רייסנר","en":"Reisner","ar":"رايسنر","ru":"Райснер"}', NULL, '09-8308800', NULL, TRUE),
('b1000000-0000-0000-0000-000000000059', 'a1000000-0000-0000-0000-000000000059', 'delegated-admin-cons-59@harmonia.local', 'DELEGATED_ADMIN', 'דור', '{"he":"דור","en":"Dor","ar":"دور","ru":"Дор"}', 'וקסלר', '{"he":"וקסלר","en":"Veksler","ar":"وكسلر","ru":"Векслер"}', NULL, '04-9956152', NULL, TRUE),
('b1000000-0000-0000-0000-000000000060', 'a1000000-0000-0000-0000-000000000060', 'delegated-admin-cons-60@harmonia.local', 'DELEGATED_ADMIN', 'נירה', '{"he":"נירה","en":"Nira","ar":"نيرا","ru":"Нира"}', 'ספיר פינסקי', '{"he":"ספיר פינסקי","en":"Sapir Pinsky","ar":"سابير فينسكي","ru":"Сапир Пински"}', NULL, '04-6757628', NULL, TRUE),
('b1000000-0000-0000-0000-000000000061', 'a1000000-0000-0000-0000-000000000061', 'delegated-admin-cons-61@harmonia.local', 'DELEGATED_ADMIN', 'יוסי', '{"he":"יוסי","en":"Yossi","ar":"يوسي","ru":"Йоси"}', 'שור', '{"he":"שור","en":"Shor","ar":"شور","ru":"Шор"}', NULL, NULL, NULL, TRUE),
('b1000000-0000-0000-0000-000000000062', 'a1000000-0000-0000-0000-000000000062', 'delegated-admin-cons-62@harmonia.local', 'DELEGATED_ADMIN', 'יריב', '{"he":"יריב","en":"Yariv","ar":"ياريف","ru":"Ярив"}', 'דומני', '{"he":"דומני","en":"Domani","ar":"دوماني","ru":"Домани"}', NULL, '04-6520112', NULL, TRUE),
('b1000000-0000-0000-0000-000000000063', 'a1000000-0000-0000-0000-000000000063', 'delegated-admin-cons-63@harmonia.local', 'DELEGATED_ADMIN', 'פלג', '{"he":"פלג","en":"Peleg","ar":"بيليج","ru":"Пелег"}', 'ריפין', '{"he":"ריפין","en":"Rippin","ar":"ريفين","ru":"Риппин"}', NULL, '09-7922156', NULL, TRUE),
('b1000000-0000-0000-0000-000000000064', 'a1000000-0000-0000-0000-000000000064', 'delegated-admin-cons-64@harmonia.local', 'DELEGATED_ADMIN', 'שלומית', '{"he":"שלומית","en":"Shlomit","ar":"شلوميت","ru":"Шломит"}', 'מדר', '{"he":"מדר","en":"Madar","ar":"مدار","ru":"Мадар"}', NULL, '03-9286700', NULL, TRUE),
('b1000000-0000-0000-0000-000000000065', 'a1000000-0000-0000-0000-000000000065', 'delegated-admin-cons-65@harmonia.local', 'DELEGATED_ADMIN', 'אביעד', '{"he":"אביעד","en":"Aviad","ar":"أفيعاد","ru":"Авиад"}', 'אייל', '{"he":"אייל","en":"Eyal","ar":"إيال","ru":"Эяль"}', NULL, '09-7922156', NULL, TRUE),
('b1000000-0000-0000-0000-000000000066', 'a1000000-0000-0000-0000-000000000066', 'delegated-admin-cons-66@harmonia.local', 'DELEGATED_ADMIN', 'דוד', '{"he":"דוד","en":"David","ar":"ديفيد","ru":"Давид"}', 'סולן', '{"he":"סולן","en":"Solan","ar":"سولان","ru":"Солан"}', NULL, '09-8991446', NULL, TRUE),
('b1000000-0000-0000-0000-000000000067', 'a1000000-0000-0000-0000-000000000067', 'delegated-admin-cons-67@harmonia.local', 'DELEGATED_ADMIN', 'גוזיף', '{"he":"גוזיף","en":"Joseph","ar":"جوزيف","ru":"Джозеф"}', 'עודה', '{"he":"עודה","en":"Odeh","ar":"عودة","ru":"Оде"}', NULL, '04-8450117', NULL, TRUE),
('b1000000-0000-0000-0000-000000000068', 'a1000000-0000-0000-0000-000000000068', 'delegated-admin-cons-68@harmonia.local', 'DELEGATED_ADMIN', 'בר', '{"he":"בר","en":"Bar","ar":"بار","ru":"Бар"}', 'ערמון', '{"he":"ערמון","en":"Armon","ar":"أرمون","ru":"Армон"}', NULL, '03-6353328', NULL, TRUE),
('b1000000-0000-0000-0000-000000000069', 'a1000000-0000-0000-0000-000000000069', 'delegated-admin-cons-69@harmonia.local', 'DELEGATED_ADMIN', 'טניה', '{"he":"טניה","en":"Tanya","ar":"تانيا","ru":"Таня"}', 'שפירא', '{"he":"שפירא","en":"Shapira","ar":"شابيرا","ru":"Шапиро"}', NULL, '04-8450117', NULL, TRUE),
('b1000000-0000-0000-0000-000000000070', 'a1000000-0000-0000-0000-000000000070', 'delegated-admin-cons-70@harmonia.local', 'DELEGATED_ADMIN', 'אנה', '{"he":"אנה","en":"Anna","ar":"آنا","ru":"Анна"}', 'אסף', '{"he":"אסף","en":"Assaf","ar":"أساف","ru":"Асаф"}', NULL, '04-8730024', NULL, TRUE),
('b1000000-0000-0000-0000-000000000071', 'a1000000-0000-0000-0000-000000000071', 'delegated-admin-cons-71@harmonia.local', 'DELEGATED_ADMIN', 'חזי', '{"he":"חזי","en":"Hezi","ar":"حيزي","ru":"Хези"}', 'פלד', '{"he":"פלד","en":"Peled","ar":"بيليد","ru":"Пелед"}', NULL, '04-9831142', NULL, TRUE),
('b1000000-0000-0000-0000-000000000072', 'a1000000-0000-0000-0000-000000000072', 'delegated-admin-cons-72@harmonia.local', 'DELEGATED_ADMIN', 'אינה', '{"he":"אינה","en":"Inna","ar":"إينا","ru":"Инна"}', 'גולקו', '{"he":"גולקו","en":"Golko","ar":"جولكو","ru":"Голко"}', NULL, '04-8789714', NULL, TRUE),
('b1000000-0000-0000-0000-000000000073', 'a1000000-0000-0000-0000-000000000073', 'delegated-admin-cons-73@harmonia.local', 'DELEGATED_ADMIN', 'יוני', '{"he":"יוני","en":"Yoni","ar":"يوني","ru":"Йони"}', 'שמעוני', '{"he":"שמעוני","en":"Shimoni","ar":"شمعوني","ru":"Шимони"}', NULL, '03-9014527', NULL, TRUE),
('b1000000-0000-0000-0000-000000000074', 'a1000000-0000-0000-0000-000000000074', 'delegated-admin-cons-74@harmonia.local', 'DELEGATED_ADMIN', 'וורוד', '{"he":"וורוד","en":"Wurud","ar":"ورود","ru":"Вуруд"}', 'ג''ובראן בשארה', '{"he":"ג''ובראן בשארה","en":"Jubran Bishara","ar":"جبران بشارة","ru":"Джубран Бишара"}', NULL, '04-9655122', NULL, TRUE),
('b1000000-0000-0000-0000-000000000075', 'a1000000-0000-0000-0000-000000000075', 'delegated-admin-cons-75@harmonia.local', 'DELEGATED_ADMIN', 'ירון', '{"he":"ירון","en":"Yaron","ar":"يارون","ru":"Ярон"}', 'גן', '{"he":"גן","en":"Gan","ar":"جان","ru":"Ган"}', NULL, '03-9014527', NULL, TRUE),
('b1000000-0000-0000-0000-000000000076', 'a1000000-0000-0000-0000-000000000076', 'delegated-admin-cons-76@harmonia.local', 'DELEGATED_ADMIN', 'שולי', '{"he":"שולי","en":"Shuli","ar":"شولي","ru":"Шули"}', 'קורן', '{"he":"קורן","en":"Koren","ar":"كورين","ru":"Корен"}', NULL, '03-9655122', NULL, TRUE),
('b1000000-0000-0000-0000-000000000077', 'a1000000-0000-0000-0000-000000000077', 'delegated-admin-cons-77@harmonia.local', 'DELEGATED_ADMIN', 'ריטה', '{"he":"ריטה","en":"Rita","ar":"ريتا","ru":"Рита"}', 'וינוקור', '{"he":"וינוקור","en":"Vinokur","ar":"فينوكور","ru":"Винокур"}', NULL, '08-9316245', NULL, TRUE),
('b1000000-0000-0000-0000-000000000078', 'a1000000-0000-0000-0000-000000000078', 'delegated-admin-cons-78@harmonia.local', 'DELEGATED_ADMIN', 'מיכאלה', '{"he":"מיכאלה","en":"Michaela","ar":"ميخائيلا","ru":"Михаэла"}', 'בן חיים', '{"he":"בן חיים","en":"Ben Haim","ar":"بن حاييم","ru":"Бен-Хаим"}', NULL, '03-6135474', NULL, TRUE),
('b1000000-0000-0000-0000-000000000079', 'a1000000-0000-0000-0000-000000000079', 'delegated-admin-cons-79@harmonia.local', 'DELEGATED_ADMIN', 'רועי', '{"he":"רועי","en":"Roei","ar":"روعي","ru":"Рои"}', 'זוארץ', '{"he":"זוארץ","en":"Zuaretz","ar":"زواريتس","ru":"Зуарец"}', NULL, '03-5407580', NULL, TRUE),
('b1000000-0000-0000-0000-000000000080', 'a1000000-0000-0000-0000-000000000080', 'delegated-admin-cons-80@harmonia.local', 'DELEGATED_ADMIN', 'לימור', '{"he":"לימור","en":"Limor","ar":"ليمور","ru":"Лимор"}', 'אקטע', '{"he":"אקטע","en":"Akta","ar":"أكتا","ru":"Акта"}', NULL, '09-7711330', NULL, TRUE),
('b1000000-0000-0000-0000-000000000081', 'a1000000-0000-0000-0000-000000000081', 'delegated-admin-cons-81@harmonia.local', 'DELEGATED_ADMIN', 'אביב', '{"he":"אביב","en":"Aviv","ar":"أفيف","ru":"Авив"}', 'רון', '{"he":"רון","en":"Ron","ar":"رون","ru":"Рон"}', NULL, '03-9723041', NULL, TRUE),
('b1000000-0000-0000-0000-000000000082', 'a1000000-0000-0000-0000-000000000082', 'delegated-admin-cons-82@harmonia.local', 'DELEGATED_ADMIN', 'מאור', '{"he":"מאור","en":"Maor","ar":"ماؤور","ru":"Маор"}', 'לוי', '{"he":"לוי","en":"Levi","ar":"ليفي","ru":"Леви"}', NULL, '08-6802763', NULL, TRUE),
('b1000000-0000-0000-0000-000000000083', 'a1000000-0000-0000-0000-000000000083', 'delegated-admin-cons-83@harmonia.local', 'DELEGATED_ADMIN', 'עאמר', '{"he":"עאמר","en":"Amer","ar":"عامر","ru":"Амер"}', 'נח''לה', '{"he":"נח''לה","en":"Nakhleh","ar":"نخلة","ru":"Нахле"}', NULL, '04-9501135', NULL, TRUE),
('b1000000-0000-0000-0000-000000000084', 'a1000000-0000-0000-0000-000000000084', 'delegated-admin-cons-84@harmonia.local', 'DELEGATED_ADMIN', 'קוסטין', '{"he":"קוסטין","en":"Costin","ar":"كوستين","ru":"Костин"}', 'קנליס-אוליאר', '{"he":"קנליס-אוליאר","en":"Canellis-Olier","ar":"كانيليس-أوليار","ru":"Канеллис-Ольер"}', NULL, '03-5460524', NULL, TRUE),
('b1000000-0000-0000-0000-000000000085', 'a1000000-0000-0000-0000-000000000085', 'delegated-admin-cons-85@harmonia.local', 'DELEGATED_ADMIN', 'חגי', '{"he":"חגי","en":"Hagai","ar":"حجاي","ru":"Хагай"}', 'אמר', '{"he":"אמר","en":"Amar","ar":"أمار","ru":"Амар"}', NULL, '04-6298121', NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  national_id = EXCLUDED.national_id,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;
-- END AUTO-SEED-ADMINS

-- BEGIN AUTO-SEED-DOCS
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0001@harmonia.local', 'TEACHER', 'יעל', '{"he":"יעל","en":"Yael","ar":"ياعيل","ru":"Яэль"}', 'פלוטניארז', '{"he":"פלוטניארז","en":"Plotniarz","ar":"بلوتنيارز","ru":"Плотниарз"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%99%D7%A2%D7%9C-%D7%A4%D7%9C%D7%95%D7%98%D7%A0%D7%99%D7%90%D7%A8%D7%96-300x300.jpg', TRUE),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0002@harmonia.local', 'TEACHER', 'יעל', '{"he":"יעל","en":"Yael","ar":"ياعيل","ru":"Яэль"}', 'קדר', '{"he":"קדר","en":"Kadar","ar":"قدار","ru":"Кадар"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/12/%D7%A7%D7%93%D7%A8-%D7%99%D7%A2%D7%9C-150x150.png', TRUE),
('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0003@harmonia.local', 'TEACHER', 'שירה', '{"he":"שירה","en":"Shira","ar":"شيرا","ru":"Шира"}', 'סברוב', '{"he":"סברוב","en":"Sabrov","ar":"سابروف","ru":"Сабров"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/12/%D7%A1%D7%91%D7%A8%D7%95%D7%91-%D7%A9%D7%99%D7%A8%D7%94-150x150.png', TRUE),
('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0004@harmonia.local', 'TEACHER', 'אייל', '{"he":"אייל","en":"Eyal","ar":"إيال","ru":"Эяль"}', 'הרכבי', '{"he":"הרכבי","en":"Harkabi","ar":"هاركابي","ru":"Харкаби"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/12/%D7%94%D7%A8%D7%9B%D7%91%D7%99-%D7%90%D7%99%D7%99%D7%9C-2-150x150.png', TRUE),
('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0005@harmonia.local', 'TEACHER', 'עדיה', '{"he":"עדיה","en":"Adiya","ar":"عديا","ru":"Адия"}', 'לביא', '{"he":"לביא","en":"Lavi","ar":"لافي","ru":"Лави"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/12/%D7%9C%D7%91%D7%99%D7%90-%D7%A2%D7%93%D7%99%D7%94-2-150x150.png', TRUE),
('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0006@harmonia.local', 'TEACHER', 'טליה', '{"he":"טליה","en":"Talia","ar":"تاليا","ru":"Талия"}', 'גבעון', '{"he":"גבעון","en":"Givon","ar":"جيفون","ru":"Гивон"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%91%D7%A2%D7%95%D7%9F-%D7%98%D7%9C%D7%99%D7%94-%E2%80%93-%D7%A8%D7%9B%D7%96%D7%AA-%D7%9E%D7%97%D7%9C%D7%A7%D7%AA-%D7%94%D7%A4%D7%A1%D7%A0%D7%AA%D7%A8.png', TRUE),
('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0007@harmonia.local', 'TEACHER', 'גילי', '{"he":"גילי","en":"Gili","ar":"جيلي","ru":"Гили"}', 'אברבנאל', '{"he":"אברבנאל","en":"Abravanel","ar":"أبرفانيل","ru":"Абраванель"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%90%D7%91%D7%A8%D7%91%D7%A0%D7%90%D7%9C-%D7%92%D7%99%D7%9C%D7%99-300x200.png', TRUE),
('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0008@harmonia.local', 'TEACHER', 'אלכס', '{"he":"אלכס","en":"Alex","ar":"أليكس","ru":"Алекс"}', 'גולדברג', '{"he":"גולדברג","en":"Goldberg","ar":"جولدبرج","ru":"Голдберг"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%95%D7%9C%D7%93%D7%91%D7%A8%D7%92-%D7%90%D7%9C%D7%9B%D7%A1.png', TRUE),
('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0009@harmonia.local', 'TEACHER', 'פאינה', '{"he":"פאינה","en":"Faina","ar":"فاينا","ru":"Фаина"}', 'גלוזמן', '{"he":"גלוזמן","en":"Gluzman","ar":"جلوزمان","ru":"Глузман"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%9C%D7%95%D7%96%D7%9E%D7%9F-%D7%A4%D7%90%D7%99%D7%A0%D7%94-225x300.jpg', TRUE),
('c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0010@harmonia.local', 'TEACHER', 'אלה', '{"he":"אלה","en":"Ela","ar":"ألا","ru":"Эла"}', 'דובין', '{"he":"דובין","en":"Dubin","ar":"دوبين","ru":"Дубин"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%93%D7%95%D7%91%D7%99%D7%9F-%D7%90%D7%9C%D7%94-149x150.png', TRUE),
('c1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0011@harmonia.local', 'TEACHER', 'יעל', '{"he":"יעל","en":"Yael","ar":"ياعيل","ru":"Яэль"}', 'דרעי', '{"he":"דרעי","en":"Deri","ar":"دراعي","ru":"Дери"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/11/%D7%99%D7%A2%D7%9C-%D7%93%D7%A8%D7%A2%D7%99-200x300.jpg', TRUE),
('c1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0012@harmonia.local', 'TEACHER', 'שרה', '{"he":"שרה","en":"Sara","ar":"سارة","ru":"Сара"}', 'ויסר', '{"he":"ויסר","en":"Weiser","ar":"وايزر","ru":"Вейзер"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%95%D7%99%D7%A1%D7%A8-%D7%A9%D7%A8%D7%94.png', TRUE),
('c1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0013@harmonia.local', 'TEACHER', 'לנה', '{"he":"לנה","en":"Lena","ar":"لينا","ru":"Лена"}', 'הנקין', '{"he":"הנקין","en":"Hankin","ar":"هانكين","ru":"Ханкин"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%94%D7%A0%D7%A7%D7%99%D7%9F-%D7%9C%D7%A0%D7%94-191x300.jpg', TRUE),
('c1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0014@harmonia.local', 'TEACHER', 'אירנה', '{"he":"אירנה","en":"Irena","ar":"إيرينا","ru":"Ирена"}', 'פינקלסון', '{"he":"פינקלסון","en":"Finkielson","ar":"فينكيلسون","ru":"Финкельсон"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%A4%D7%99%D7%A0%D7%A7%D7%9C%D7%A1%D7%95%D7%9F-%D7%90%D7%99%D7%A8%D7%A0%D7%94.png', TRUE),
('c1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0015@harmonia.local', 'TEACHER', 'אלכס', '{"he":"אלכס","en":"Alex","ar":"أليكس","ru":"Алекс"}', 'פינקלסון', '{"he":"פינקלסון","en":"Finkielson","ar":"فينكيلسون","ru":"Финкельсон"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%A4%D7%99%D7%A0%D7%A7%D7%9C%D7%A1%D7%95%D7%9F-%D7%90%D7%9C%D7%9B%D7%A1.png', TRUE),
('c1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0016@harmonia.local', 'TEACHER', 'גיל', '{"he":"גיל","en":"Gil","ar":"جيل","ru":"Гиль"}', 'פקר', '{"he":"פקר","en":"Peker","ar":"بيكر","ru":"Пекер"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%99%D7%9C-%D7%A4%D7%A7%D7%A8.png', TRUE),
('c1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0017@harmonia.local', 'TEACHER', 'שגיב', '{"he":"שגיב","en":"Shagiv","ar":"شجيف","ru":"Шагив"}', 'ציוני', '{"he":"ציוני","en":"Tsioni","ar":"تسيوني","ru":"Циони"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/09/%D7%A6%D7%99%D7%95%D7%A0%D7%99-%D7%A9%D7%92%D7%99%D7%91.png', TRUE),
('c1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000015', 'teacher-15-0018@harmonia.local', 'TEACHER', 'נדב', '{"he":"נדב","en":"Nadav","ar":"ناداف","ru":"Надав"}', 'עין הגל', '{"he":"עין הגל","en":"Ein Hagal","ar":"عين هجال","ru":"Эйн Хагаль"}', NULL, NULL, 'https://alumahod.com/wp-content/uploads/2025/12/%D7%A0%D7%93%D7%91-%D7%A2%D7%99%D7%9F-%D7%94%D7%92%D7%9C-300x196.png', TRUE),
('c1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0001@harmonia.local', 'TEACHER', 'בר', '{"he":"בר","en":"Bar","ar":"بار","ru":"Бар"}', 'ערמון', '{"he":"ערמון","en":"Armon","ar":"أرمون","ru":"Армон"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_7288fa4a704043e7a6f005dd215653fd~mv2.jpg/v1/crop/x_97,y_0,w_1776,h_1776/fill/w_176,h_176,al_c,q_80,enc_avif/85_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0002@harmonia.local', 'TEACHER', 'לורה', '{"he":"לורה","en":"Laura","ar":"لورا","ru":"Лора"}', 'בורלא ששון', '{"he":"בורלא ששון","en":"Borla Sasson","ar":"بورلا ساسون","ru":"Борла Сассон"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_62b103f97aee4decb8394cae5067576c~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/28%20(3)_edited_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000021', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0003@harmonia.local', 'TEACHER', 'שריג', '{"he":"שריג","en":"Sharig","ar":"شريج","ru":"Шариг"}', 'הזנפלד', '{"he":"הזנפלד","en":"Hazenfeld","ar":"هازنفيلد","ru":"Хазенфельд"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_3d73f9d07a6740bdb381cfb04bed613b~mv2.jpg/v1/crop/x_0,y_122,w_2003,h_2067/fill/w_176,h_182,al_c,q_80,enc_avif/22_3_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000022', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0004@harmonia.local', 'TEACHER', 'אדוה', '{"he":"אדוה","en":"Adva","ar":"أدفا","ru":"Адва"}', 'חדידה', '{"he":"חדידה","en":"Hdida","ar":"حديدة","ru":"Хдида"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_cce729711f8f4fabb3570ec8ba9ebb46~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/25_3%2520(1)_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000023', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0005@harmonia.local', 'TEACHER', 'רועי', '{"he":"רועי","en":"Roei","ar":"روعي","ru":"Рои"}', 'צאיג', '{"he":"צאיג","en":"Tsaig","ar":"تسائيج","ru":"Цаиг"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_aaa6c24db450432aa1d9114c99a90cca~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/53_edited_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0006@harmonia.local', 'TEACHER', 'דפנה', '{"he":"דפנה","en":"Dafna","ar":"دافنا","ru":"Дафна"}', 'רביד', '{"he":"רביד","en":"Ravid","ar":"رافيد","ru":"Равид"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_09faf272546449b7ba5e7623a6a83687~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/27_3_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000025', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0007@harmonia.local', 'TEACHER', 'ניב', '{"he":"ניב","en":"Niv","ar":"نيف","ru":"Нив"}', 'עופר', '{"he":"עופר","en":"Ofer","ar":"عوفر","ru":"Офер"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_c3f571511b4e47bd95026d607cb17bb2~mv2.jpg/v1/crop/x_0,y_465,w_2003,h_2070/fill/w_176,h_182,al_c,q_80,enc_avif/29_1_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000026', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0008@harmonia.local', 'TEACHER', 'מריאנה', '{"he":"מריאנה","en":"Mariana","ar":"ماريانا","ru":"Мариана"}', 'גליקמן', '{"he":"גליקמן","en":"Glikman","ar":"جليكمان","ru":"Гликман"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_25fadef728df4fdf99f8a2555ab76354~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/11_3_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000027', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0009@harmonia.local', 'TEACHER', 'חיים', '{"he":"חיים","en":"Haim","ar":"حاييم","ru":"Хаим"}', 'מזר', '{"he":"מזר","en":"Mazar","ar":"مزار","ru":"Мазар"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_faed373029a545f89bbfbf842b1c7366~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/15_3_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000028', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0010@harmonia.local', 'TEACHER', 'ניר', '{"he":"ניר","en":"Nir","ar":"نير","ru":"Нир"}', 'פישקין', '{"he":"פישקין","en":"Fishkin","ar":"فيشكين","ru":"Фишкин"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_2ef70f2ac9164d30bc9be842f4bda99b~mv2.png/v1/fill/w_176,h_182,al_c,q_85,enc_avif/298696770_1048990335843228_5596559905577286962_n.png', TRUE),
('c1000000-0000-0000-0000-000000000029', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0011@harmonia.local', 'TEACHER', 'תומר', '{"he":"תומר","en":"Tomer","ar":"تومر","ru":"Томер"}', 'כהן', '{"he":"כהן","en":"Cohen","ar":"كوهن","ru":"Коэн"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_7af09cd1448d44369c4c6ec2974c45e5~mv2.jpg/v1/crop/x_201,y_0,w_1599,h_1652/fill/w_176,h_182,al_c,q_80,enc_avif/DSCF5726_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000030', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0012@harmonia.local', 'TEACHER', 'דנה', '{"he":"דנה","en":"Dana","ar":"دانا","ru":"Дана"}', 'כהן שריון', '{"he":"כהן שריון","en":"Cohen Sharion","ar":"كوهن شاريون","ru":"Коэн Шарион"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_ae834b8360d54b3fa7b000498ed08703~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/88_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000031', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0013@harmonia.local', 'TEACHER', 'דורט', '{"he":"דורט","en":"Dorth","ar":"دورت","ru":"Дорт"}', 'פלורנטין', '{"he":"פלורנטין","en":"Florentin","ar":"فلورنتين","ru":"Флорентин"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_192b0341e4b749b2a9301c4e17a25907~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/5_3_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000032', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0014@harmonia.local', 'TEACHER', 'רות', '{"he":"רות","en":"Ruth","ar":"روث","ru":"Рут"}', 'צרי', '{"he":"צרי","en":"Tseri","ar":"تسيري","ru":"Цери"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_58a1da86acfa48ec99151d9094c22078~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/10_1_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000033', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0015@harmonia.local', 'TEACHER', 'נדב', '{"he":"נדב","en":"Nadav","ar":"ناداف","ru":"Надав"}', 'פרידמן', '{"he":"פרידמן","en":"Friedman","ar":"فريدمان","ru":"Фридман"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_6dc6891885da4c0fb5a8d94d759671c5~mv2.jpg/v1/crop/x_279,y_0,w_1442,h_1490/fill/w_176,h_182,al_c,q_80,enc_avif/_1%D7%AA%D7%A6%D7%9C%D7%95%D7%9E%D7%99%20%D7%9E%D7%95%D7%A8%D7%99%D7%9D0475_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000034', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0016@harmonia.local', 'TEACHER', 'גונן', '{"he":"גונן","en":"Gonen","ar":"جونن","ru":"Гонен"}', 'רוזנברג', '{"he":"רוזנברג","en":"Rosenberg","ar":"روزنبرج","ru":"Розенберг"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_ff5021181442423babda25469afba454~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/24_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000035', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0017@harmonia.local', 'TEACHER', 'יאנה', '{"he":"יאנה","en":"Yana","ar":"يانا","ru":"Яна"}', 'וישנבצקי', '{"he":"וישנבצקי","en":"Vishnevski","ar":"فيشنيفسكي","ru":"Вишневски"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000036', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0018@harmonia.local', 'TEACHER', 'איוונה', '{"he":"איוונה","en":"Ivona","ar":"إيفونا","ru":"Ивона"}', 'קיש', '{"he":"קיש","en":"Kish","ar":"كيش","ru":"Киш"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_d5e6f319ace54dc0bab630b1498d1d2e~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/4_3_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000037', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0019@harmonia.local', 'TEACHER', 'אירינה', '{"he":"אירינה","en":"Irina","ar":"إيرينا","ru":"Ирина"}', 'וישנבצקי', '{"he":"וישנבצקי","en":"Vishnevski","ar":"فيشنيفسكي","ru":"Вишневски"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_8292cf673c3d44b6bbad295985f0b752~mv2.jpg/v1/crop/x_0,y_250,w_1080,h_1116/fill/w_176,h_182,al_c,q_80,enc_avif/9_1_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000038', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0020@harmonia.local', 'TEACHER', 'אבנר', '{"he":"אבנר","en":"Avner","ar":"أفنر","ru":"Авнер"}', 'חנני', '{"he":"חנני","en":"Hanani","ar":"حناني","ru":"Ханани"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_28efec23dd2f4b719541b5156b29f133~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/49_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000039', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0021@harmonia.local', 'TEACHER', 'עידו', '{"he":"עידו","en":"Ido","ar":"إيدو","ru":"Идо"}', 'אסא', '{"he":"אסא","en":"Asa","ar":"آسا","ru":"Аса"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_5b6774d8e6294246b353a3b9bf482a8f~mv2.jpg/v1/crop/x_93,y_0,w_1814,h_1874/fill/w_176,h_182,al_c,q_80,enc_avif/104_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000040', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0022@harmonia.local', 'TEACHER', 'יותם', '{"he":"יותם","en":"Yotam","ar":"يوتام","ru":"Йотам"}', 'ברק', '{"he":"ברק","en":"Barak","ar":"براك","ru":"Барак"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_59468b8f17734a02b38f3d1de0c2f207~mv2.jpg/v1/crop/x_94,y_0,w_1813,h_1873/fill/w_176,h_182,al_c,q_80,enc_avif/79_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000041', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0023@harmonia.local', 'TEACHER', 'אולה', '{"he":"אולה","en":"Ola","ar":"أولا","ru":"Ола"}', 'בינדר', '{"he":"בינדר","en":"Binder","ar":"بيندر","ru":"Биндер"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_302274a43f7145b380e22f736f0baf0e~mv2.jpg/v1/crop/x_0,y_250,w_1080,h_1116/fill/w_176,h_182,al_c,q_80,enc_avif/13_2_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000042', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0024@harmonia.local', 'TEACHER', 'אליאנה', '{"he":"אליאנה","en":"Eliana","ar":"إليانا","ru":"Элиана"}', 'לובנברג', '{"he":"לובנברג","en":"Lowenberg","ar":"لوينبرج","ru":"Ловенберг"}', NULL, NULL, 'https://static.wixstatic.com/media/e5ff77_5a0fb170b4f64c4e908cad643011e180~mv2.png/v1/fill/w_176,h_182,al_c,q_85,enc_avif/16_1.png', TRUE),
('c1000000-0000-0000-0000-000000000043', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0025@harmonia.local', 'TEACHER', 'ניר', '{"he":"ניר","en":"Nir","ar":"نير","ru":"Нир"}', 'ערמון', '{"he":"ערמון","en":"Armon","ar":"أرمون","ru":"Армон"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_f55209bd11954f82b58de82639b368d8~mv2.jpg/v1/crop/x_67,y_0,w_1867,h_1929/fill/w_176,h_182,al_c,q_80,enc_avif/72_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000044', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0026@harmonia.local', 'TEACHER', 'דניאל', '{"he":"דניאל","en":"Daniel","ar":"دانييل","ru":"Даниэль"}', 'אדג''יאשווילי', '{"he":"אדג''יאשווילי","en":"Adjashvili","ar":"أدجاشفيلي","ru":"Аджашвили"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_494c5f816d634155a1039cf7e2aaf161~mv2.jpg/v1/crop/x_159,y_0,w_1683,h_1739/fill/w_176,h_182,al_c,q_80,enc_avif/80_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000045', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0027@harmonia.local', 'TEACHER', 'נועה', '{"he":"נועה","en":"Noa","ar":"نوعا","ru":"Ноа"}', 'שירוון', '{"he":"שירוון","en":"Shirvan","ar":"شيرفان","ru":"Ширван"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_4e2440d5ed104667ad3d265155c0e115~mv2.jpg/v1/crop/x_299,y_0,w_1401,h_1448/fill/w_176,h_182,al_c,q_80,enc_avif/60_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000046', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0028@harmonia.local', 'TEACHER', 'אלון', '{"he":"אלון","en":"Alon","ar":"ألون","ru":"Алон"}', 'מלניק', '{"he":"מלניק","en":"Melnik","ar":"ملنيك","ru":"Мельник"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_45b2c44947e342e2b67a837020cb9b39~mv2.jpg/v1/crop/x_291,y_0,w_1419,h_1466/fill/w_176,h_182,al_c,q_80,enc_avif/63_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000047', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0029@harmonia.local', 'TEACHER', 'ליאור', '{"he":"ליאור","en":"Lior","ar":"ليئور","ru":"Лиор"}', 'מישל וירוט', '{"he":"מישל וירוט","en":"Michel Virot","ar":"ميشل فيرو","ru":"Мишель Виро"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_dd3e1472562c4157aa83ba8ab69e5d6b~mv2.jpg/v1/crop/x_334,y_0,w_1333,h_1377/fill/w_176,h_182,al_c,q_80,enc_avif/34_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000048', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0030@harmonia.local', 'TEACHER', 'מעיין', '{"he":"מעיין","en":"Ma'ayan","ar":"معيان","ru":"Маайан"}', 'זיטמן-פורת', '{"he":"זיטמן-פורת","en":"Zitman-Porat","ar":"زيتمان-بورات","ru":"Зитман-Порат"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_af30550657b445b285a38805fa977bc9~mv2.jpg/v1/crop/x_355,y_0,w_1289,h_1332/fill/w_176,h_182,al_c,q_80,enc_avif/39_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000049', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0031@harmonia.local', 'TEACHER', 'איתמר', '{"he":"איתמר","en":"Itamar","ar":"إيتامار","ru":"Итамар"}', 'ציון', '{"he":"ציון","en":"Zion","ar":"تسيون","ru":"Цион"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_4b50ee76df7f4aa7b4c594a6aa804d75~mv2.jpg/v1/crop/x_159,y_0,w_1517,h_1568/fill/w_176,h_182,al_c,q_80,enc_avif/41_edited_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000050', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0032@harmonia.local', 'TEACHER', 'תמר', '{"he":"תמר","en":"Tamar","ar":"تامار","ru":"Тамар"}', 'דויטש', '{"he":"דויטש","en":"Deutsch","ar":"دويتش","ru":"Дойч"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_0fa4f2f103784ca89866f5a9b8436838~mv2.jpg/v1/crop/x_261,y_0,w_1479,h_1528/fill/w_176,h_182,al_c,q_80,enc_avif/66_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000051', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0033@harmonia.local', 'TEACHER', 'חנן', '{"he":"חנן","en":"Hanan","ar":"حنان","ru":"Ханан"}', 'בכר', '{"he":"בכר","en":"Bachar","ar":"بخار","ru":"Бахар"}', NULL, NULL, 'https://static.wixstatic.com/media/3a428b_7d33aed5dd2b42ff8fd4b0ef104e254f~mv2.jpg/v1/crop/x_205,y_0,w_1589,h_1642/fill/w_176,h_182,al_c,q_80,enc_avif/58_edited.jpg', TRUE),
('c1000000-0000-0000-0000-000000000052', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0034@harmonia.local', 'TEACHER', 'עמרי', '{"he":"עמרי","en":"Omri","ar":"عمري","ru":"Омри"}', 'לנדה', '{"he":"לנדה","en":"Landa","ar":"لاندا","ru":"Ланда"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000053', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0035@harmonia.local', 'TEACHER', 'דור', '{"he":"דור","en":"Dor","ar":"دور","ru":"Дор"}', 'סמוכה', '{"he":"סמוכה","en":"Smukha","ar":"سموخة","ru":"Смуха"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000054', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0036@harmonia.local', 'TEACHER', 'שאלי', '{"he":"שאלי","en":"Shali","ar":"شالي","ru":"Шали"}', 'הרשקו', '{"he":"הרשקו","en":"Hershko","ar":"هيرشكو","ru":"Хершко"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000055', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0037@harmonia.local', 'TEACHER', 'חן', '{"he":"חן","en":"Chen","ar":"حن","ru":"Хен"}', 'שלו', '{"he":"שלו","en":"Shalev","ar":"شالف","ru":"Шالев"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000056', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0038@harmonia.local', 'TEACHER', 'דן', '{"he":"דן","en":"Dan","ar":"دان","ru":"Дан"}', 'ורון', '{"he":"ורון","en":"Varon","ar":"وارون","ru":"Варон"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000057', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0039@harmonia.local', 'TEACHER', 'צביקי', '{"he":"צביקי","en":"Tsviki","ar":"تسفيكي","ru":"Цвики"}', 'מורן', '{"he":"מורן","en":"Moran","ar":"موران","ru":"Моран"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000058', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0040@harmonia.local', 'TEACHER', 'אסנת', '{"he":"אסנת","en":"Osnat","ar":"أوسنات","ru":"Оснат"}', 'ברנר-סיון', '{"he":"ברנר-סיון","en":"Brenner-Sivan","ar":"برينر-سيفان","ru":"Бреннер-Сиван"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000059', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0041@harmonia.local', 'TEACHER', 'מריצ''ל', '{"he":"מריצ''ל","en":"Maricel","ar":"ماريسل","ru":"Мариссель"}', 'לורנס', '{"he":"לורנס","en":"Lawrence","ar":"لورنس","ru":"Лоренс"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000060', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0042@harmonia.local', 'TEACHER', 'מילה', '{"he":"מילה","en":"Mila","ar":"ميلا","ru":"Мила"}', 'ספוז''ניקוב סמרה', '{"he":"ספוז''ניקוב סמרה","en":"Spozhnikov Samara","ar":"سبوجنيكوف سمارا","ru":"Спожников Самара"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000061', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0043@harmonia.local', 'TEACHER', 'יוליה', '{"he":"יוליה","en":"Yulia","ar":"يوليا","ru":"Юлия"}', 'דולוב', '{"he":"דולוב","en":"Dolov","ar":"دولوف","ru":"Долов"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000062', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0044@harmonia.local', 'TEACHER', 'אולגה', '{"he":"אולגה","en":"Olga","ar":"أولغا","ru":"Ольга"}', 'סנדרסקייה', '{"he":"סנדרסקייה","en":"Sandersky","ar":"ساندرسكي","ru":"Сандерски"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000063', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0045@harmonia.local', 'TEACHER', 'רז', '{"he":"רז","en":"Raz","ar":"راز","ru":"Раз"}', 'ארנון', '{"he":"ארנון","en":"Arnon","ar":"أرنون","ru":"Арнон"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000064', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0046@harmonia.local', 'TEACHER', 'אילנה', '{"he":"אילנה","en":"Ilana","ar":"إيلانا","ru":"Илана"}', 'וינוקור', '{"he":"וינוקור","en":"Vinokur","ar":"فينوكور","ru":"Винокур"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000065', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0047@harmonia.local', 'TEACHER', 'דניאלה', '{"he":"דניאלה","en":"Daniela","ar":"دانييلا","ru":"Даниэла"}', 'ברקוביץ''', '{"he":"ברקוביץ''","en":"Berkowitz","ar":"بيركوفيتش","ru":"Беркович"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000066', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0048@harmonia.local', 'TEACHER', 'מרי', '{"he":"מרי","en":"Marie","ar":"ماري","ru":"Мари"}', 'אידה ברשינסקי', '{"he":"אידה ברשינסקי","en":"Ida Bershinsky","ar":"إيدا بيرشينسكي","ru":"Ида Берщинский"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000067', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0049@harmonia.local', 'TEACHER', 'עדן', '{"he":"עדן","en":"Eden","ar":"عيدن","ru":"Эден"}', 'גיאת', '{"he":"גיאת","en":"Giat","ar":"جيات","ru":"Гиат"}', NULL, NULL, NULL, TRUE),
('c1000000-0000-0000-0000-000000000068', 'a1000000-0000-0000-0000-000000000066', 'teacher-66-0050@harmonia.local', 'TEACHER', 'רחל', '{"he":"רחל","en":"Rachel","ar":"راحيل","ru":"Рахель"}', 'אילת', '{"he":"אילת","en":"Eilat","ar":"إيلات","ru":"Эйлат"}', NULL, NULL, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  first_name_i18n = EXCLUDED.first_name_i18n,
  last_name = EXCLUDED.last_name,
  last_name_i18n = EXCLUDED.last_name_i18n,
  national_id = EXCLUDED.national_id,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  is_active = EXCLUDED.is_active;

DROP TABLE IF EXISTS tmp_seed_teacher_profiles;
CREATE TEMP TABLE tmp_seed_teacher_profiles (
  user_id UUID PRIMARY KEY,
  bio JSONB NOT NULL,
  instruments TEXT[] NOT NULL DEFAULT '{}',
  education TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  available_for_new_students BOOLEAN DEFAULT TRUE,
  lesson_durations INT[] DEFAULT '{45}'
);

INSERT INTO tmp_seed_teacher_profiles (user_id, bio, instruments, education, video_url, available_for_new_students, lesson_durations)
VALUES
('c1000000-0000-0000-0000-000000000001', '{"he":"מנהלת, מנצחת תזמורות","en":"Director, orchestra conductor","ar":"مديرة، قائدة أوركسترا","ru":"Руководитель, дирижер оркестра"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000002', '{"he":"רכזת פדגוגית, מנצחת מקהלות, פסנתרנית","en":"Pedagogical coordinator, choir conductor, pianist","ar":"منسقة تربوية، قائدة جوقات، عازفة بيانو","ru":"Педагогический координатор, дирижер хора, пианистка"}'::jsonb, ARRAY['piano', 'general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000003', '{"he":"מנצחת מקהלות ילדים ונוער","en":"Children and youth choir conductor","ar":"قائدة جوقات الأطفال والشباب","ru":"Дирижер детских и молодежных хоров"}'::jsonb, ARRAY['voice', 'general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000004', '{"he":"מנצח תזמורות נוער, מעבד ומלחין","en":"Youth orchestra conductor, arranger and composer","ar":"قائد أوركسترا للشباب، موزع وملحن","ru":"Дирижер молодежных оркестров, аранжировщик и композитор"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000005', '{"he":"מנצחת מקהלת בוגרים, זמרת ג''אז","en":"Adult choir conductor, jazz singer","ar":"قائدة جوقة البالغين، مغنية جاز","ru":"Дирижер взрослого хора, джазовая певица"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000006', '{"he":"ראש מחלקת פסנתר","en":"Head of piano department","ar":"رئيسة قسم البيانو","ru":"Руководитель фортепианного отделения"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000007', '{"he":"פסנתר, תאוריה וקומפוזיציה","en":"Piano, theory and composition","ar":"بيانو، نظرية وتأليف","ru":"Фортепиано, теория и композиция"}'::jsonb, ARRAY['piano', 'composition'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000008', '{"he":"פסנתר והרכבים קאמריים","en":"Piano and chamber ensembles","ar":"بيانو ومجموعات موسيقى الحجرة","ru":"Фортепиано и камерные ансамбли"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000009', '{"he":"פסנתר ואורגנית","en":"Piano and keyboard","ar":"بيانو وأورغ","ru":"Фортепиано и клавишные"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000010', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000011', '{"he":"פסנתרנית וזמרת אופרה","en":"Pianist and opera singer","ar":"عازفة بيانو ومغنية أوبرا","ru":"Пианистка и оперная певица"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000012', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000013', '{"he":"פסנתר, ניצוח מקהלה","en":"Piano, choir conducting","ar":"بيانو وقيادة جوقة","ru":"Фортепиано, хоровое дирижирование"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000014', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000015', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000016', '{"he":"פסנתר ג''אז","en":"Jazz piano","ar":"بيانو جاز","ru":"Джазовое фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000017', '{"he":"פסנתר ג''אז, מעבד ומלחין","en":"Jazz piano, arranger and composer","ar":"بيانو جاز، موزع وملحن","ru":"Джазовое фортепиано, аранжировщик и композитор"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000018', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000019', '{"he":"מנהל הקונסרבטוריון","en":"Conservatory director","ar":"مدير الكونسرفاتوار","ru":"Директор консерватории"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000020', '{"he":"ויולה וכינור","en":"Viola and violin","ar":"فيولا وكمان","ru":"Альт и скрипка"}'::jsonb, ARRAY['violin', 'viola'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000021', '{"he":"קלרינט","en":"Clarinet","ar":"كلارينيت","ru":"Кларнет"}'::jsonb, ARRAY['clarinet'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000022', '{"he":"קלרינט","en":"Clarinet","ar":"كلارينيت","ru":"Кларнет"}'::jsonb, ARRAY['clarinet'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000023', '{"he":"גיטרה","en":"Guitar","ar":"غيتار","ru":"Гитара"}'::jsonb, ARRAY['guitar'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000024', '{"he":"כינור","en":"Violin","ar":"كمان","ru":"Скрипка"}'::jsonb, ARRAY['violin'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000025', '{"he":"טרומבון","en":"Trombone","ar":"ترومبون","ru":"Тромбон"}'::jsonb, ARRAY['trombone'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000026', '{"he":"אורגנית","en":"Keyboard","ar":"أورغ","ru":"Клавишные"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000027', '{"he":"טובה","en":"Tuba","ar":"توبا","ru":"Туба"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000028', '{"he":"בריטון וטרומבון","en":"Baritone and trombone","ar":"باريتون وترومبون","ru":"Баритон и тромбон"}'::jsonb, ARRAY['trombone'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000029', '{"he":"גיטרה חשמלית","en":"Electric guitar","ar":"غيتار كهربائي","ru":"Электрогитара"}'::jsonb, ARRAY['guitar'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000030', '{"he":"קלרינט","en":"Clarinet","ar":"كلارينيت","ru":"Кларнет"}'::jsonb, ARRAY['clarinet'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000031', '{"he":"חליליות","en":"Recorders","ar":"فلوت ريكوردر","ru":"Блокфлейты"}'::jsonb, ARRAY['flute'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000032', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000033', '{"he":"כלי הקשה","en":"Percussion","ar":"آلات إيقاع","ru":"Ударные"}'::jsonb, ARRAY['drums'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000034', '{"he":"תופים וכלי הקשה","en":"Drums and percussion","ar":"طبول وآلات إيقاع","ru":"Барабаны и ударные"}'::jsonb, ARRAY['drums'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000035', '{"he":"פיתוח קול ופסנתר","en":"Voice training and piano","ar":"تطوير الصوت وبيانو","ru":"Вокал и фортепиано"}'::jsonb, ARRAY['piano', 'voice'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000036', '{"he":"תאוריה ופיתוח שמיעה","en":"Theory and ear training","ar":"نظرية وتطوير السمع","ru":"Теория и развитие слуха"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000037', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000038', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000039', '{"he":"תופים","en":"Drums","ar":"طبول","ru":"Барабаны"}'::jsonb, ARRAY['drums'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000040', '{"he":"סקסופון","en":"Saxophone","ar":"ساكسوفون","ru":"Саксофон"}'::jsonb, ARRAY['saxophone'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000041', '{"he":"פיתוח קול","en":"Voice training","ar":"تطوير الصوت","ru":"Вокал"}'::jsonb, ARRAY['voice'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000042', '{"he":"כינור וויולה","en":"Violin and viola","ar":"كمان وفيولا","ru":"Скрипка и альт"}'::jsonb, ARRAY['violin', 'viola'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000043', '{"he":"סקסופון","en":"Saxophone","ar":"ساكسوفون","ru":"Саксофон"}'::jsonb, ARRAY['saxophone'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000044', '{"he":"כינור","en":"Violin","ar":"كمان","ru":"Скрипка"}'::jsonb, ARRAY['violin'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000045', '{"he":"חלילית","en":"Recorder","ar":"ريكوردر","ru":"Блокфлейта"}'::jsonb, ARRAY['flute'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000046', '{"he":"מנצח תזמורת","en":"Orchestra conductor","ar":"قائد أوركسترا","ru":"Дирижер оркестра"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000047', '{"he":"אבוב","en":"Oboe","ar":"أوبوا","ru":"Гобой"}'::jsonb, ARRAY['oboe'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000048', '{"he":"פיתוח קול","en":"Voice training","ar":"تطوير الصوت","ru":"Вокал"}'::jsonb, ARRAY['voice'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000049', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000050', '{"he":"צ''לו","en":"Cello","ar":"تشيلو","ru":"Виолончель"}'::jsonb, ARRAY['cello'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000051', '{"he":"מלווה בפסנתר","en":"Piano accompanist","ar":"مرافق على البيانو","ru":"Концертмейстер (фортепиано)"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000052', '{"he":"הפקה מוזיקלית","en":"Music production","ar":"إنتاج موسيقي","ru":"Музыкальное продюсирование"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000053', '{"he":"גיטרה בס","en":"Bass guitar","ar":"غيتار باس","ru":"Бас-гитара"}'::jsonb, ARRAY['guitar'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000054', '{"he":"טרומבון","en":"Trombone","ar":"ترومبون","ru":"Тромбон"}'::jsonb, ARRAY['trombone'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000055', '{"he":"מנצחת מקהלות","en":"Choir conductor","ar":"قائدة جوقات","ru":"Дирижер хора"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000056', '{"he":"חצוצרה","en":"Trumpet","ar":"بوق","ru":"Труба"}'::jsonb, ARRAY['trumpet'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000057', '{"he":"קרן יער","en":"French horn","ar":"هورن فرنسي","ru":"Валторна"}'::jsonb, ARRAY['french_horn'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000058', '{"he":"קרן יער","en":"French horn","ar":"هورن فرنسي","ru":"Валторна"}'::jsonb, ARRAY['french_horn'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000059', '{"he":"צ''לו","en":"Cello","ar":"تشيلو","ru":"Виолончель"}'::jsonb, ARRAY['cello'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000060', '{"he":"מלווה בפסנתר","en":"Piano accompanist","ar":"مرافق على البيانو","ru":"Концертмейстер (фортепиано)"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000061', '{"he":"ליווי פסנתר","en":"Piano accompaniment","ar":"مرافقة بيانو","ru":"Фортепианное сопровождение"}'::jsonb, ARRAY['piano', 'accompaniment'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000062', '{"he":"פיתוח קול","en":"Voice training","ar":"تطوير الصوت","ru":"Вокал"}'::jsonb, ARRAY['voice'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000063', '{"he":"כלי הקשה ותופים","en":"Percussion and drums","ar":"إيقاع وطبول","ru":"Ударные и барабаны"}'::jsonb, ARRAY['drums'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000064', '{"he":"אורגנית","en":"Keyboard","ar":"أورغ","ru":"Клавишные"}'::jsonb, ARRAY['general_music'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000065', '{"he":"חליל צד","en":"Flute","ar":"فلوت","ru":"Флейта"}'::jsonb, ARRAY['flute'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000066', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000067', '{"he":"פסנתר","en":"Piano","ar":"بيانو","ru":"Фортепиано"}'::jsonb, ARRAY['piano'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45]),
('c1000000-0000-0000-0000-000000000068', '{"he":"חליל צד","en":"Flute","ar":"فلوت","ru":"Флейта"}'::jsonb, ARRAY['flute'], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[45])
;

INSERT INTO teacher_profiles (user_id, bio, education, video_url, available_for_new_students, lesson_durations)
SELECT user_id, bio, education, video_url, available_for_new_students, lesson_durations
FROM tmp_seed_teacher_profiles
ON CONFLICT (user_id) DO UPDATE SET
  bio = EXCLUDED.bio,
  available_for_new_students = EXCLUDED.available_for_new_students,
  lesson_durations = EXCLUDED.lesson_durations;

INSERT INTO conservatorium_instruments (conservatorium_id, instrument_catalog_id, names, is_active, available_for_registration, available_for_rental)
SELECT DISTINCT
  u.conservatorium_id,
  tok.instrument_slug,
  ic.names,
  TRUE,
  TRUE,
  FALSE
FROM tmp_seed_teacher_profiles tp
JOIN users u ON u.id = tp.user_id
CROSS JOIN LATERAL unnest(COALESCE(tp.instruments, ARRAY[]::TEXT[])) AS tok(instrument_slug)
JOIN instrument_catalog ic ON ic.id = tok.instrument_slug
LEFT JOIN conservatorium_instruments ci
  ON ci.conservatorium_id = u.conservatorium_id
 AND ci.instrument_catalog_id = tok.instrument_slug
WHERE ci.id IS NULL;

INSERT INTO teacher_profile_instruments (teacher_user_id, conservatorium_instrument_id, is_primary)
SELECT
  tp.user_id,
  ci.id,
  (tok.ord = first_ord.first_ord) AS is_primary
FROM tmp_seed_teacher_profiles tp
JOIN users u ON u.id = tp.user_id
CROSS JOIN LATERAL unnest(COALESCE(tp.instruments, ARRAY[]::TEXT[])) WITH ORDINALITY AS tok(instrument_slug, ord)
JOIN LATERAL (
  SELECT MIN(x.ord) AS first_ord
  FROM unnest(COALESCE(tp.instruments, ARRAY[]::TEXT[])) WITH ORDINALITY AS x(val, ord)
) AS first_ord ON TRUE
JOIN conservatorium_instruments ci
  ON ci.conservatorium_id = u.conservatorium_id
 AND ci.instrument_catalog_id = tok.instrument_slug
ON CONFLICT (teacher_user_id, conservatorium_instrument_id) DO UPDATE
SET is_primary = teacher_profile_instruments.is_primary OR EXCLUDED.is_primary;

-- END AUTO-SEED-DOCS-I18N




-- ============================================================
-- STUDENTS, PARENTS, AND LESSONS (Mock-aligned seed data)
-- Mirrors the mock data in src/lib/data.ts for full-stack testing.
-- Student/parent UUIDs: e1... (students), f1... (parents)
-- Lesson UUIDs: l1...
-- ============================================================

-- Students (cons-15 = a1000000-0000-0000-0000-000000000015,
--           cons-66 = a1000000-0000-0000-0000-000000000066)
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000015', 'student@example.com',    'STUDENT', 'אריאל', '{"he":"אריאל","en":"Ariel","ar":"أرييل","ru":"Ариэль"}',    'לוי',       '{"he":"לוי","en":"Levi","ar":"ليفي","ru":"Леви"}',           '111111111', '050-1111111', 'https://i.pravatar.cc/150?u=student',  TRUE),
('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000015', 'student2@example.com',   'STUDENT', 'תמר',   '{"he":"תמר","en":"Tamar","ar":"تامار","ru":"Тамар"}',       'ישראלי',    '{"he":"ישראלי","en":"Israeli","ar":"إسرائيلي","ru":"Исраэли"}', '222222222', '052-2222222', 'https://i.pravatar.cc/150?u=student2', TRUE),
('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000015', 'student3@example.com',   'STUDENT', 'נועם',  '{"he":"נועם","en":"Noam","ar":"نوعام","ru":"Ноам"}',        'בן-דוד',    '{"he":"בן-דוד","en":"Ben-David","ar":"بن-داود","ru":"Бен-Давид"}', '311111111', '050-3333333', 'https://i.pravatar.cc/150?u=student3', TRUE),
('e1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000015', 'student4@example.com',   'STUDENT', 'שני',   '{"he":"שני","en":"Shani","ar":"شاني","ru":"Шани"}',         'אלמוג',     '{"he":"אלמוג","en":"Almog","ar":"ألموغ","ru":"Алмог"}',       '411111111', '052-4444444', 'https://i.pravatar.cc/150?u=student4', TRUE),
('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000015', 'student5@example.com',   'STUDENT', 'אריק',  '{"he":"אריק","en":"Arik","ar":"أريك","ru":"Арик"}',         'שמש',       '{"he":"שמש","en":"Shemesh","ar":"شيمش","ru":"Шемеш"}',        '511111111', '054-5555555', 'https://i.pravatar.cc/150?u=student5', TRUE),
('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000066', 'student6@example.com',   'STUDENT', 'יובל',  '{"he":"יובל","en":"Yuval","ar":"يوفال","ru":"Ювал"}',       'לוין',      '{"he":"לוין","en":"Levin","ar":"ليفين","ru":"Левин"}',        '611111111', '050-6666666', 'https://i.pravatar.cc/150?u=student6', TRUE),
('e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000066', 'student7@example.com',   'STUDENT', 'מיכל',  '{"he":"מיכל","en":"Michal","ar":"ميخال","ru":"Михаль"}',    'רוזן',      '{"he":"רוזן","en":"Rosen","ar":"روزن","ru":"Розен"}',         '711111111', '052-7777777', 'https://i.pravatar.cc/150?u=student7', TRUE),
('e1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000066', 'student8@example.com',   'STUDENT', 'דניאל', '{"he":"דניאל","en":"Daniel","ar":"دانييل","ru":"Даниэль"}', 'ברגר',      '{"he":"ברגר","en":"Berger","ar":"برغر","ru":"Бергер"}',       '811111111', '054-8888888', 'https://i.pravatar.cc/150?u=student8', TRUE),
('e1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000012', 'other.student@example.com', 'STUDENT', 'יונתן', '{"he":"יונתן","en":"Yonatan","ar":"يوناتان","ru":"Йонатан"}', 'כץ', '{"he":"כץ","en":"Katz","ar":"كاتز","ru":"Кац"}', '333333333', '054-3333333', 'https://i.pravatar.cc/150?u=other-student', TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role;

-- Parents
INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)
VALUES
('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000015', 'parent@example.com',  'PARENT', 'שרה',    '{"he":"שרה","en":"Sarah","ar":"سارة","ru":"Сара"}',      'כהן',       '{"he":"כהן","en":"Cohen","ar":"كوهين","ru":"Коэн"}',        '777777777', '052-7777770', 'https://i.pravatar.cc/150?u=parent',  TRUE),
('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000015', 'parent2@example.com', 'PARENT', 'רונית',  '{"he":"רונית","en":"Ronit","ar":"رونيت","ru":"Ронит"}',   'בן-דוד',    '{"he":"בן-דוד","en":"Ben-David","ar":"بن-داود","ru":"Бен-Давид"}', '922222222', '050-9999990', 'https://i.pravatar.cc/150?u=parent2', TRUE),
('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000015', 'parent3@example.com', 'PARENT', 'גלעד',   '{"he":"גלעד","en":"Gilad","ar":"جلعاد","ru":"Гилад"}',   'שמש',       '{"he":"שמש","en":"Shemesh","ar":"شيمش","ru":"Шемеш"}',      '922222923', '050-9999991', 'https://i.pravatar.cc/150?u=parent3', TRUE),
('f1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000066', 'parent4@example.com', 'PARENT', 'אורי',   '{"he":"אורי","en":"Uri","ar":"أوري","ru":"Ури"}',         'לוין',      '{"he":"לוין","en":"Levin","ar":"ليفين","ru":"Левин"}',      '922222924', '054-9999992', 'https://i.pravatar.cc/150?u=parent4', TRUE),
('f1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000066', 'parent5@example.com', 'PARENT', 'לימור',  '{"he":"לימור","en":"Limor","ar":"ليمور","ru":"Лимор"}',   'ברגר',      '{"he":"ברגר","en":"Berger","ar":"برغر","ru":"Бергер"}',     '922222925', '054-9999993', 'https://i.pravatar.cc/150?u=parent5', TRUE)
ON CONFLICT (email) DO UPDATE SET
  conservatorium_id = EXCLUDED.conservatorium_id,
  role = EXCLUDED.role;

-- Student profiles
INSERT INTO student_profiles (user_id, birth_date, school_name, grade, years_in_conservatorium)
VALUES
('e1000000-0000-0000-0000-000000000001', '2006-05-10', 'תיכון הדרים, הוד השרון', 'יב', 10),
('e1000000-0000-0000-0000-000000000002', '2007-02-15', 'תיכון הדרים, הוד השרון', 'יא', 8),
('e1000000-0000-0000-0000-000000000003', '2007-09-01', 'תיכון הדרים, הוד השרון', 'יא', 5),
('e1000000-0000-0000-0000-000000000004', '2009-04-12', 'חט"ב שמגר, הוד השרון',   'ז',  2),
('e1000000-0000-0000-0000-000000000005', '2006-11-20', 'תיכון הדרים, הוד השרון', 'יב', 9),
('e1000000-0000-0000-0000-000000000006', '2008-03-05', 'תיכון אורות, קריית אונו', 'ט', 4),
('e1000000-0000-0000-0000-000000000007', '2007-07-18', 'תיכון אורות, קריית אונו', 'י', 6),
('e1000000-0000-0000-0000-000000000008', '2010-01-30', 'חט"ב ביאליק, קריית אונו', 'ו', 1),
('e1000000-0000-0000-0000-000000000009', '2006-08-10', 'תיכון קלעי, גבעתיים',     'יב', 6)
ON CONFLICT (user_id) DO UPDATE SET
  school_name = EXCLUDED.school_name,
  grade = EXCLUDED.grade;

-- Lessons (uses directory teacher UUIDs c1..c68 and student UUIDs e1..)
-- c1=יעל פלוטניארז(cons-15), c6=טליה גבעון(cons-15), c17=שגיב ציוני(cons-15), c18=נדב עין הגל(cons-15)
-- c21=שריג הזנפלד(cons-66), c23=רועי צאיג(cons-66), c24=דפנה רביד(cons-66)
INSERT INTO lessons (id, conservatorium_id, teacher_id, student_id, scheduled_at, duration_minutes, status)
VALUES
('l1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '2026-03-08T14:00:00Z', 45, 'scheduled'),
('l1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', '2026-03-09T15:00:00Z', 45, 'scheduled'),
('l1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000004', '2026-03-10T15:00:00Z', 45, 'scheduled'),
('l1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000018', 'e1000000-0000-0000-0000-000000000003', '2026-03-11T17:00:00Z', 45, 'scheduled'),
('l1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000005', '2026-03-12T18:00:00Z', 60, 'scheduled'),
('l1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000066', 'c1000000-0000-0000-0000-000000000021', 'e1000000-0000-0000-0000-000000000006', '2026-03-08T16:00:00Z', 45, 'scheduled'),
('l1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000066', 'c1000000-0000-0000-0000-000000000024', 'e1000000-0000-0000-0000-000000000007', '2026-03-09T14:00:00Z', 45, 'scheduled'),
('l1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000066', 'c1000000-0000-0000-0000-000000000023', 'e1000000-0000-0000-0000-000000000008', '2026-03-10T17:00:00Z', 45, 'scheduled'),
-- Past completed lessons
('l1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000004', '2026-03-01T15:00:00Z', 45, 'completed'),
('l1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '2026-02-25T14:00:00Z', 45, 'completed')
ON CONFLICT (id) DO NOTHING;




-- ============================================================
-- INVOICES / PAYMENTS
-- ============================================================



