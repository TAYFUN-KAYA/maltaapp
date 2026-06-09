require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const School = require('../models/School');
const Tour = require('../models/Tour');
const Beach = require('../models/Beach');
const GuideArticle = require('../models/GuideArticle');
const CommunityRoom = require('../models/CommunityRoom');
const DailyInsight = require('../models/DailyInsight');
const DiscountCode = require('../models/DiscountCode');
const Event = require('../models/Event');
const AppConfig = require('../models/AppConfig');
const LanguageTestQuestion = require('../models/LanguageTestQuestion');
const { beachMedia, tourMedia, schoolMedia, insightImage, articleImage, eventImage } = require('./media');

const schools = [
  { name: 'Maltalingua', slug: 'maltalingua', city: 'st_julians', priceFrom: 165, rating: 4.7, featured: true, accreditations: ['FELTOM'], courseTypes: ['general', 'intensive'], description: 'St. Julian\'s merkezinde popüler dil okulu.' },
  { name: 'EC English Malta', slug: 'ec-english', city: 'st_julians', priceFrom: 195, rating: 4.8, featured: true, accreditations: ['British Council'], courseTypes: ['general', 'business', 'exam'], description: 'Uluslararası EC ağı, modern kampüs.' },
  { name: 'ACE English Malta', slug: 'ace-english', city: 'st_julians', priceFrom: 175, rating: 4.6, featured: true, accreditations: ['FELTOM'], courseTypes: ['general', 'intensive', 'junior'], description: 'Butik sınıflar ve sosyal aktivite programı.' },
  { name: 'University Language School', slug: 'uls', city: 'msida', priceFrom: 155, rating: 4.5, accreditations: ['FELTOM'], courseTypes: ['general', 'work_study'], description: 'Üniversite kampüsüne yakın ekonomik seçenek.' },
  { name: 'Sprachcaffe Malta', slug: 'sprachcaffe', city: 'st_julians', priceFrom: 180, rating: 4.4, courseTypes: ['general', 'intensive'], description: 'Alman kökenli kaliteli eğitim.' },
  { name: 'Club Class Malta', slug: 'club-class', city: 'swieqi', priceFrom: 160, rating: 4.3, courseTypes: ['general'], description: 'Uygun fiyatlı grup dersleri.' },
  { name: 'ESE Malta', slug: 'ese', city: 'st_julians', priceFrom: 190, rating: 4.6, featured: true, courseTypes: ['general', 'business'], description: 'Premium konum ve aktiviteler.' },
  { name: 'Inlingua Malta', slug: 'inlingua', city: 'sliema', priceFrom: 170, rating: 4.4, courseTypes: ['general', 'business'], description: 'Sliema sahil şeridinde.' },
  { name: 'AM Language Studio', slug: 'am-language', city: 'sliema', priceFrom: 150, rating: 4.2, courseTypes: ['general', 'intensive'], description: 'Küçük sınıflar, kişisel ilgi.' },
  { name: 'Gateway School of English', slug: 'gateway', city: 'san_gwann', priceFrom: 145, rating: 4.3, courseTypes: ['general'], description: 'Aile ortamı okul.' },
  { name: 'BELS Malta', slug: 'bels', city: 'st_julians', priceFrom: 168, rating: 4.5, courseTypes: ['general', 'exam'], description: 'IELTS odaklı programlar.' },
  { name: 'International House Malta', slug: 'ih-malta', city: 'st_julians', priceFrom: 185, rating: 4.7, accreditations: ['EAQUALS'], courseTypes: ['general', 'business', 'exam'], description: 'IH kalite standardı.' },
  { name: 'Easy School of Languages', slug: 'easy-school', city: 'valletta', priceFrom: 140, rating: 4.1, courseTypes: ['general'], description: 'Başkent Valletta\'da tarihi bina.' },
  { name: 'Atlas Language School', slug: 'atlas', city: 'st_julians', priceFrom: 172, rating: 4.4, courseTypes: ['general', 'intensive'], description: 'Genç öğrenci dostu.' },
  { name: 'Alpha School of English', slug: 'alpha', city: 'st_pauls', priceFrom: 158, rating: 4.3, courseTypes: ['general', 'junior'], description: 'Kuzey Malta, sakin ortam.' },
  { name: 'GV Malta', slug: 'gv-malta', city: 'st_julians', priceFrom: 162, rating: 4.4, courseTypes: ['general'], description: 'Genç öğrenci programları.' },
  { name: 'NSTS English Language Institute', slug: 'nsts', city: 'msida', priceFrom: 148, rating: 4.2, courseTypes: ['general', 'work_study'], description: 'Uygun fiyatlı uzun dönem.' },
  { name: 'Berlitz Malta', slug: 'berlitz', city: 'sliema', priceFrom: 210, rating: 4.5, courseTypes: ['business'], description: 'İş İngilizcesi odaklı.' },
  { name: 'Cavendish School of English', slug: 'cavendish', city: 'valletta', priceFrom: 152, rating: 4.1, courseTypes: ['general'], description: 'Valletta merkez.' },
  { name: 'English Language Academy', slug: 'ela', city: 'st_julians', priceFrom: 166, rating: 4.3, courseTypes: ['general', 'intensive'], description: 'Yoğun program seçenekleri.' },
  { name: 'European School of English', slug: 'eseu', city: 'sliema', priceFrom: 159, rating: 4.2, courseTypes: ['general'], description: 'Avrupa öğrenci topluluğu.' },
  { name: 'Frances King Malta', slug: 'frances-king', city: 'st_julians', priceFrom: 188, rating: 4.5, courseTypes: ['general', 'exam'], description: 'Cambridge sınav hazırlık.' },
  { name: 'Global Village Malta', slug: 'global-village', city: 'st_julians', priceFrom: 174, rating: 4.4, courseTypes: ['general'], description: 'Uluslararası ortam.' },
  { name: 'IELS Malta', slug: 'iels', city: 'sliema', priceFrom: 171, rating: 4.3, courseTypes: ['general', 'intensive'], description: 'Deneyimli öğretmen kadrosu.' },
  { name: 'Linguatime School of English', slug: 'linguatime', city: 'sliema', priceFrom: 153, rating: 4.1, courseTypes: ['general'], description: 'Esnek başlangıç tarihleri.' },
  { name: 'Maltalingua Junior', slug: 'maltalingua-junior', city: 'st_julians', priceFrom: 178, rating: 4.6, courseTypes: ['junior'], description: 'Yaz okulu ve genç program.' },
  { name: 'Malta University Language School', slug: 'muls', city: 'msida', priceFrom: 156, rating: 4.4, courseTypes: ['general', 'work_study'], description: 'Akademik ortam.' },
  { name: 'New York English Academy Malta', slug: 'nyea', city: 'st_julians', priceFrom: 169, rating: 4.3, courseTypes: ['general'], description: 'Amerikan İngilizcesi vurgusu.' },
  { name: 'Oxford House College Malta', slug: 'oxford-house', city: 'st_julians', priceFrom: 182, rating: 4.5, courseTypes: ['general', 'business'], description: 'İş ve genel İngilizce.' },
  { name: 'Pace Language Institute', slug: 'pace', city: 'valletta', priceFrom: 147, rating: 4.0, courseTypes: ['general'], description: 'Ekonomik şehir merkezi okul.' },
  { name: 'Queen\'s English Language School', slug: 'queens', city: 'st_julians', priceFrom: 164, rating: 4.3, courseTypes: ['general'], description: 'Butik aile okulu.' },
  { name: 'Rose of York Malta', slug: 'rose-york', city: 'sliema', priceFrom: 176, rating: 4.4, courseTypes: ['general', 'exam'], description: 'IELTS başarı odaklı.' },
  { name: 'School of English Malta', slug: 'sem', city: 'gzira', priceFrom: 151, rating: 4.2, courseTypes: ['general'], description: 'Gzira konum avantajı.' },
  { name: 'The British School Malta', slug: 'british-school', city: 'st_julians', priceFrom: 192, rating: 4.6, featured: true, accreditations: ['British Council'], courseTypes: ['general', 'business'], description: 'British Council akrediteli.' },
  { name: 'The Language Centre Malta', slug: 'tlc', city: 'st_julians', priceFrom: 167, rating: 4.3, courseTypes: ['general', 'intensive'], description: 'Modern sınıflar.' },
  { name: 'Vivian\'s School of English', slug: 'vivians', city: 'st_julians', priceFrom: 149, rating: 4.1, courseTypes: ['general'], description: 'Uygun fiyat kalite dengesi.' },
  { name: 'Wales School of English', slug: 'wales', city: 'sliema', priceFrom: 154, rating: 4.2, courseTypes: ['general'], description: 'Küçük gruplar.' },
  { name: 'Zarco English Academy', slug: 'zarco', city: 'valletta', priceFrom: 143, rating: 4.0, courseTypes: ['general'], description: 'Başkent yaşam deneyimi.' },
  { name: 'Accent Language School', slug: 'accent', city: 'st_julians', priceFrom: 161, rating: 4.2, courseTypes: ['general'], description: 'Konuşma odaklı dersler.' },
  { name: 'Bridge English School', slug: 'bridge', city: 'sliema', priceFrom: 157, rating: 4.1, courseTypes: ['general'], description: 'Sahil yürüme mesafesi.' },
];

const tours = [
  { title: 'Blue Lagoon & Comino Boat Trip', category: 'boat', price: 35, duration: '6 saat', featured: true, audience: ['friends', 'couple', 'solo'], season: ['summer', 'all'], description: 'Malta\'nın en popüler tekne turu. Kristal berraklığında sular.' },
  { title: 'Gozo Full Day Tour', category: 'day_trip', price: 45, duration: '8 saat', featured: true, audience: ['family', 'friends'], description: 'Gozo adası keşfi, Azure Window bölgesi.' },
  { title: 'Valletta History Walking Tour', category: 'history', price: 25, duration: '3 saat', audience: ['family', 'couple'], season: ['all'], description: 'UNESCO başkenti rehberli yürüyüş.' },
  { title: 'Mdina Silent City Tour', category: 'history', price: 22, duration: '2.5 saat', description: 'Ortaçağ surları ve dar sokaklar.' },
  { title: 'Jeep Safari Adventure', category: 'jeep', price: 55, duration: '5 saat', audience: ['friends'], season: ['spring', 'autumn'], description: 'Kırsal Malta ve gizli koylar.' },
  { title: 'Sunset Cruise', category: 'sunset', price: 40, duration: '2 saat', featured: true, audience: ['couple'], season: ['summer'], description: 'Romantik gün batımı tekne turu.' },
  { title: 'Discover Scuba Diving', category: 'diving', price: 65, duration: '4 saat', description: 'İlk kez dalış deneyimi.' },
  { title: 'Kite Surf Intro Session', category: 'water_sports', price: 80, duration: '2 saat', season: ['summer'], description: 'Mellieha sahilde kite surf.' },
  { title: 'Private Boat Charter', category: 'private_charter', price: 350, duration: 'Esnek', description: 'Özel tekne, kendi rotanız.' },
  { title: 'Malta Wine Tasting', category: 'food_wine', price: 38, duration: '3 saat', audience: ['couple', 'friends'], description: 'Yerel şarap ve peynir tadımı.' },
  { title: 'Malta-Sicily Day Trip', category: 'day_trip', price: 89, duration: '12 saat', featured: true, description: 'Feribot ile Sicilya günübirlik.' },
  { title: 'Student Party Boat', category: 'student_party', price: 30, studentOnly: true, audience: ['friends', 'students'], season: ['summer'], description: 'Öğrencilere özel parti teknesi.' },
  { title: 'Language Exchange + Sliema Walk', category: 'language_exchange', price: 15, studentOnly: true, description: 'Dil pratiği ve sosyal gezi.' },
  { title: 'Three Cities Harbor Tour', category: 'history', price: 28, duration: '3 saat', description: 'Birgu, Senglea, Cospicua.' },
  { title: 'Marsaxlokk Market & Fish Lunch', category: 'food_wine', price: 32, description: 'Pazar günü balıkçı köyü turu.' },
  { title: 'Comino Caves Snorkel', category: 'boat', price: 42, season: ['summer'], description: 'Mağaralar ve snorkeling.' },
  { title: 'Winter Valletta Culture Tour', category: 'culture', price: 20, season: ['winter'], description: 'Kış kültür turu.' },
  { title: 'Summer Boat Party', category: 'student_party', price: 35, season: ['summer'], studentOnly: true, description: 'Yaz boat party.' },
  { title: 'Blue Grotto Boat', category: 'boat', price: 18, description: 'Mavi mağara tekne turu.' },
  { title: 'Horse Riding Malta', category: 'culture', price: 48, audience: ['family'], description: 'At turu.' },
  { title: 'Paddleboarding Session', category: 'water_sports', price: 35, season: ['summer'], description: 'SUP dersi.' },
  { title: 'Hop-On Hop-Off Bus', category: 'history', price: 22, description: 'Şehir tur otobüsü.' },
  { title: 'Mosta Dome & Villages', category: 'history', price: 24, description: 'Mosta ve köyler.' },
  { title: 'Dingli Cliffs Sunset', category: 'sunset', price: 15, audience: ['couple'], description: 'Uçurum gün batımı.' },
];

const extraTours = Array.from({ length: 35 }, (_, i) => ({
  title: `Malta Activity ${i + 16}`,
  category: ['boat', 'history', 'culture', 'food_wine'][i % 4],
  price: 20 + (i % 30),
  duration: '3 saat',
  description: `Popüler aktivite #${i + 16}`,
  season: ['all'],
  audience: ['solo', 'friends'],
}));

const beaches = [
  { name: 'Blue Lagoon', slug: 'blue-lagoon', island: 'comino', crowdLevel: 'very_high', featured: true, coordinates: { lat: 36.0132, lng: 14.3231 }, description: 'Avrupa\'nın en güzel koylarından biri.', facilities: ['snorkel', 'boat_access'] },
  { name: 'Golden Bay', slug: 'golden-bay', island: 'malta', crowdLevel: 'high', featured: true, coordinates: { lat: 35.9362, lng: 14.3442 }, description: 'Kum plaj, gün batımı.', facilities: ['parking', 'cafe', 'rentals'] },
  { name: 'Ghadira Bay (Mellieha)', slug: 'ghadira', island: 'malta', crowdLevel: 'medium', coordinates: { lat: 35.968, lng: 14.36 }, description: 'Aile dostu uzun kumsal.' },
  { name: 'St. Peter\'s Pool', slug: 'st-peters-pool', island: 'malta', crowdLevel: 'medium', coordinates: { lat: 36.0468, lng: 14.5494 }, description: 'Doğal kayalık havuz.' },
  { name: 'Ramla Bay (Gozo)', slug: 'ramla-bay', island: 'gozo', crowdLevel: 'medium', featured: true, coordinates: { lat: 36.06, lng: 14.28 }, description: 'Kızıl kumlu Gozo plajı.' },
  { name: 'Popeye Village Beach', slug: 'popeye', island: 'malta', crowdLevel: 'high', coordinates: { lat: 35.961, lng: 14.341 }, description: 'Popeye köyü yanında.' },
  { name: 'Paradise Bay', slug: 'paradise-bay', island: 'malta', crowdLevel: 'low', coordinates: { lat: 35.99, lng: 14.33 }, description: 'Sakin, küçük koy.' },
  { name: 'Pretty Bay', slug: 'pretty-bay', island: 'malta', crowdLevel: 'medium', coordinates: { lat: 35.825, lng: 14.527 }, description: 'Birgi yakını halk plajı.' },
  { name: 'Mellieha Bay', slug: 'mellieha-bay', island: 'malta', crowdLevel: 'high', coordinates: { lat: 35.957, lng: 14.362 }, description: 'Geniş kumsal, su sporları.' },
  { name: 'St. George\'s Bay', slug: 'st-georges', island: 'malta', crowdLevel: 'high', coordinates: { lat: 35.928, lng: 14.488 }, description: 'St. Julian\'s merkez plaj.' },
  { name: 'Balluta Bay', slug: 'balluta', island: 'malta', crowdLevel: 'medium', coordinates: { lat: 35.922, lng: 14.492 }, description: 'Şehir plajı, kafe yakını.' },
  { name: 'Armier Bay', slug: 'armier', island: 'malta', crowdLevel: 'low', coordinates: { lat: 35.98, lng: 14.33 }, description: 'Kuzeyde sakin koy.' },
  { name: 'Anchor Bay', slug: 'anchor', island: 'malta', crowdLevel: 'medium', coordinates: { lat: 35.961, lng: 14.341 }, description: 'Popeye çevresi.' },
  { name: 'Gnejna Bay', slug: 'gnejna', island: 'malta', crowdLevel: 'low', coordinates: { lat: 35.92, lng: 14.34 }, description: 'Doğal ve sakin.' },
  { name: 'Fomm ir-Rih', slug: 'fomm-rih', island: 'malta', crowdLevel: 'low', coordinates: { lat: 35.91, lng: 14.32 }, description: 'Ulaşımı zor gizli plaj.' },
  { name: 'St. Thomas Bay', slug: 'st-thomas', island: 'malta', crowdLevel: 'medium', coordinates: { lat: 35.84, lng: 14.56 }, description: 'Güneydoğu Malta.' },
  { name: 'Kalanka Bay', slug: 'kalanka', island: 'malta', crowdLevel: 'low', coordinates: { lat: 35.83, lng: 14.57 }, description: 'Kayalık koy.' },
  { name: 'Xlendi Bay (Gozo)', slug: 'xlendi', island: 'gozo', crowdLevel: 'medium', featured: true, coordinates: { lat: 36.027, lng: 14.218 }, description: 'Gozo batı kıyısı.' },
  { name: 'San Blas Bay', slug: 'san-blas', island: 'gozo', crowdLevel: 'low', coordinates: { lat: 36.05, lng: 14.24 }, description: 'İnce kumlu gizli plaj.' },
  { name: 'Hondoq Bay', slug: 'hondoq', island: 'gozo', crowdLevel: 'medium', coordinates: { lat: 36.03, lng: 14.28 }, description: 'Turkuaz su.' },
  { name: 'Mgarr ix-Xini', slug: 'mgarr-xini', island: 'gozo', crowdLevel: 'low', coordinates: { lat: 36.02, lng: 14.2 }, description: 'Dar koy.' },
  { name: 'Crystal Lagoon', slug: 'crystal-lagoon', island: 'comino', crowdLevel: 'high', coordinates: { lat: 36.01, lng: 14.32 }, description: 'Comino dalış noktası.' },
  { name: 'St. Mary\'s Bay (Comino)', slug: 'comino-bay', island: 'comino', crowdLevel: 'medium', coordinates: { lat: 36.015, lng: 14.33 }, description: 'Comino ana koy.' },
  { name: 'Qawra Point', slug: 'qawra', island: 'malta', crowdLevel: 'medium', coordinates: { lat: 35.948, lng: 14.425 }, description: 'Kaya plajı.' },
  { name: 'Sliema Rocky Beach', slug: 'sliema', island: 'malta', crowdLevel: 'high', coordinates: { lat: 35.912, lng: 14.502 }, description: 'Şehir yüzme noktaları.' },
  { name: 'Bugibba Perched Beach', slug: 'bugibba', island: 'malta', crowdLevel: 'high', coordinates: { lat: 35.948, lng: 14.41 }, description: 'Yapay plaj platformu.' },
];

async function seed() {
  await connectDB();
  console.log('Seeding...');

  await Promise.all([
    User.deleteMany({}),
    School.deleteMany({}),
    Tour.deleteMany({}),
    Beach.deleteMany({}),
    GuideArticle.deleteMany({}),
    CommunityRoom.deleteMany({}),
    DailyInsight.deleteMany({}),
    DiscountCode.deleteMany({}),
    Event.deleteMany({}),
    AppConfig.deleteMany({}),
    LanguageTestQuestion.deleteMany({}),
  ]);

  await User.create({
    email: process.env.ADMIN_EMAIL || 'admin@maltstart.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    name: 'MaltaStart Admin',
    role: 'admin',
    emailVerified: true,
  });

  await School.insertMany(schools.map((s) => {
    const media = schoolMedia(s.city, s.slug);
    return {
      ...s,
      priceTable: [{ course: 'General English', weeks: 4, price: s.priceFrom * 4, currency: 'EUR' }],
      logo: media.logo,
      images: media.images,
      minAge: 16,
      active: true,
      videoUrl: s.slug === 'maltalingua' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
    };
  }));

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const groupDate = { date: nextWeek, spotsLeft: 8 };

  await Tour.insertMany([...tours, ...extraTours].map((t, i) => {
    const media = tourMedia(t.category, t.title);
    return {
      ...t,
      active: true,
      currency: 'EUR',
      includes: ['Rehber'],
      images: media.images,
      rating: 4.2 + (i % 8) * 0.1,
      reviewCount: 10 + (i % 50),
      videoUrl: i === 0 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
      availableDates: i < 25 ? [groupDate, { date: new Date(nextWeek.getTime() + 86400000 * 3), spotsLeft: 4 }] : [],
    };
  }));
  await Beach.insertMany(
    beaches.map((b) => ({
      ...b,
      images: beachMedia(b.slug),
      crowdPrediction:
        b.crowdLevel === 'very_high'
          ? 'Öğle saatlerinde çok kalabalık – sabah erken veya hafta içi önerilir.'
          : b.crowdLevel === 'high'
            ? 'Hafta sonu yoğun olabilir.'
            : 'Genelde sakin.',
    }))
  );
  const guideArticles = [
    { title: 'Tallinja Kart Rehberi', category: 'transport', content: 'Malta otobüs ağı için Tallinja kart satın alın. Haftalık unlimited ~21 EUR.', tags: ['ulaşım'], externalLinks: [{ label: 'Tallinja', url: 'https://www.publictransport.mt/' }] },
    { title: 'Bolt & Taksi', category: 'transport', content: 'Bolt uygulaması Malta\'da yaygın. Havaalanı transferleri için sabit fiyat seçenekleri.', externalLinks: [{ label: 'Bolt', url: 'https://bolt.eu/' }] },
    { title: 'Feribot Saatleri (Gozo)', category: 'transport', content: 'Cirkewwa-Gozo feribotu sık sefer. Arabalı ve yaya bilet farklı.', externalLinks: [{ label: 'Gozo Channel', url: 'https://www.gozochannel.com/' }] },
    { title: 'Türk Restoranları Listesi', category: 'food', content: 'St. Julian\'s ve Sliema\'da Türk mutfağı: kebap, lahmacun, kahvaltı mekanları.', tags: ['yemek', 'türk'] },
    { title: 'Maltalı Lezzetler', category: 'food', content: 'Pastizzi, rabbit stew, ftira bread – yerel tatlar.', tags: ['malta'] },
    { title: 'Acil Sağlık & Güvenlik', category: 'practical', content: 'Acil: 112. Mater Dei Hospital. Polis: 21224001.', tags: ['acil'] },
    { title: 'SIM Kart & İnternet', category: 'practical', content: 'Havaalanında GO ve Epic standları. 15-25 EUR paketler.', tags: ['sim'] },
    { title: 'Valletta Gezi Rehberi', category: 'attraction', content: 'St. John\'s Co-Cathedral, Upper Barrakka Gardens, sokaklar.', featured: true },
    { title: 'Three Cities', category: 'attraction', content: 'Birgu, Senglea, Cospicua – tarihi liman bölgesi.' },
    { title: 'Gozo & Comino', category: 'attraction', content: 'Günübirlik ada turları, Blue Lagoon erken saat önerisi.' },
    { title: 'Marsaxlokk Pazar', category: 'attraction', content: 'Pazar günü balık pazarı ve renkli tekne limanı.' },
    { title: 'Alışveriş & Süpermarket', category: 'practical', content: 'Pama, Spar, Lidl – Sliema ve St. Julian\'s şubeleri.' },
  ];
  await GuideArticle.insertMany(
    guideArticles.map((a, i) => ({
      ...a,
      images: [articleImage(a.category)],
      order: i,
    }))
  );

  const rooms = await CommunityRoom.insertMany([
    { name: 'Türkler Malta\'da', slug: 'turks-malta', type: 'country', description: 'Türk topluluğu', memberCount: 1240 },
    { name: 'Work & Study', slug: 'work-study', type: 'topic', description: 'Çalışma ve eğitim', memberCount: 580 },
    { name: 'Party Crew', slug: 'party-crew', type: 'topic', description: 'Etkinlik ve gece hayatı', memberCount: 890 },
    { name: 'Language Exchange', slug: 'lang-exchange', type: 'language_exchange', description: 'Dil pratiği buluşmaları', memberCount: 420 },
    { name: '7/24 Türkçe Destek', slug: 'turkce-destek', type: 'topic', description: 'Canlı destek ekibi', memberCount: 3200 },
  ]);

  const emergencyI18n = (tr, en) => ({ tr, en, de: en || tr, ar: '', es: en || tr });
  await AppConfig.create({
    key: 'main',
    emergencyPage: {
      title: '7/24 Acil Destek',
      subtitle: 'Malta acil durum ve pratik bilgiler',
      body:
        'Bu sayfa genel bilgilendirme amaçlıdır. Ciddi acil durumlarda önce yerel acil hatlarını (112) arayın.\n\n' +
        'MaltaStart yalnızca Malta\'da yaşam, eğitim ve seyahat süreçlerinizde yol gösterici bilgiler sunar; tıbbi veya resmi acil müdahale yerine geçmez.',
      titleI18n: emergencyI18n('7/24 Acil Destek', '24/7 Emergency Support'),
      subtitleI18n: emergencyI18n(
        'Malta acil durum ve pratik bilgiler',
        'Malta emergency & practical information'
      ),
      bodyI18n: emergencyI18n(
        'Bu sayfa genel bilgilendirme amaçlıdır. Ciddi acil durumlarda önce yerel acil hatlarını (112) arayın.\n\nMaltaStart yalnızca Malta\'da yaşam, eğitim ve seyahat süreçlerinizde yol gösterici bilgiler sunar; tıbbi veya resmi acil müdahale yerine geçmez.',
        'This page is for general information only. In a serious emergency, call local services (112) first.\n\nMaltaStart provides guidance for life, study and travel in Malta; it does not replace official or medical emergency response.'
      ),
    },
    emergencyInfoSections: [
      {
        title: 'Acil durumda ne yapmalı?',
        body:
          '• Sakin kalın ve konumunuzu netleştirin\n• 112 ile ambulans/polis çağırın\n• Pasaport ve sigorta bilgilerinizi hazır bulundurun\n• Türk konsolosluğu çalışma saatlerini kontrol edin',
        titleI18n: emergencyI18n('Acil durumda ne yapmalı?', 'What to do in an emergency?'),
        bodyI18n: emergencyI18n(
          '• Sakin kalın ve konumunuzu netleştirin\n• 112 ile ambulans/polis çağırın\n• Pasaport ve sigorta bilgilerinizi hazır bulundurun',
          '• Stay calm and confirm your location\n• Call 112 for ambulance/police\n• Keep passport and insurance details ready'
        ),
        icon: 'alert-circle',
        order: 0,
      },
      {
        title: 'MaltaStart desteği',
        body:
          'Yazılı destek ve topluluk için uygulama içindeki Asistan ve Topluluk bölümlerini kullanabilirsiniz. Bu sayfa yalnızca bilgilendirme içerir.',
        titleI18n: emergencyI18n('MaltaStart desteği', 'MaltaStart support'),
        bodyI18n: emergencyI18n(
          'Yazılı destek ve topluluk için uygulama içindeki Asistan ve Topluluk bölümlerini kullanabilirsiniz.',
          'Use the Assistant and Community sections in the app for text support. This page is informational only.'
        ),
        icon: 'information-circle',
        order: 1,
      },
    ],
    emergencyContacts: [
      {
        label: 'Acil (Ambulans/Polis)',
        labelI18n: emergencyI18n('Acil (Ambulans/Polis)', 'Emergency (112)'),
        number: '112',
        icon: 'call',
        order: 0,
      },
      {
        label: 'Polis',
        labelI18n: emergencyI18n('Polis', 'Police'),
        number: '21224001',
        icon: 'shield',
        order: 1,
      },
      {
        label: 'Mater Dei Hospital',
        labelI18n: emergencyI18n('Mater Dei Hastanesi', 'Mater Dei Hospital'),
        number: '25454000',
        icon: 'medkit',
        order: 2,
      },
      {
        label: 'Türk Konsolosluğu',
        labelI18n: emergencyI18n('Türk Konsolosluğu', 'Turkish Consulate'),
        number: '21337711',
        icon: 'flag',
        order: 3,
      },
    ],
    quickLinks: [
      { label: 'Tallinja', url: 'https://www.publictransport.mt/', icon: 'bus', category: 'transport', order: 0 },
      { label: 'Bolt', url: 'https://bolt.eu/', icon: 'car', category: 'transport', order: 1 },
      { label: 'Gozo Feribot', url: 'https://www.gozochannel.com/', icon: 'boat', category: 'transport', order: 2 },
    ],
    chatbotWelcome: {
      tr: 'Merhaba! MaltaStart 7/24 asistanıyım. Turlar, okullar veya canlı destek için yazın.',
      en: 'Hello! I am MaltaStart assistant. Ask about tours, schools, or live support.',
    },
    supportRoomId: rooms[4]._id,
    supportPhone: '+35699999999',
  });

  await LanguageTestQuestion.insertMany([
    {
      question: 'Choose the correct word: I ___ to Malta last year.',
      questionEn: 'Choose the correct word: I ___ to Malta last year.',
      options: ['go', 'went', 'gone'],
      answerIndex: 1,
      order: 0,
    },
    {
      question: 'She ___ studying English for three months.',
      questionEn: 'She ___ studying English for three months.',
      options: ['is', 'has been', 'was'],
      answerIndex: 1,
      order: 1,
    },
    {
      question: 'If I ___ more time, I would visit Gozo.',
      questionEn: 'If I ___ more time, I would visit Gozo.',
      options: ['have', 'had', 'will have'],
      answerIndex: 1,
      order: 2,
    },
    {
      question: 'They ___ living in Sliema since January.',
      questionEn: 'They ___ living in Sliema since January.',
      options: ['are', 'have been', 'were'],
      answerIndex: 1,
      order: 3,
    },
    {
      question: 'Could you tell me where ___ the bus stop?',
      questionEn: 'Could you tell me where ___ the bus stop?',
      options: ['is', 'are', 'was'],
      answerIndex: 0,
      order: 4,
    },
    {
      question: 'I have never ___ to Comino before.',
      questionEn: 'I have never ___ to Comino before.',
      options: ['been', 'be', 'being'],
      answerIndex: 0,
      order: 5,
    },
    {
      question: 'The course ___ start next Monday.',
      questionEn: 'The course ___ start next Monday.',
      options: ['will', 'is', 'has'],
      answerIndex: 0,
      order: 6,
    },
    {
      question: 'She speaks English very ___.',
      questionEn: 'She speaks English very ___.',
      options: ['good', 'well', 'betterly'],
      answerIndex: 1,
      order: 7,
    },
    {
      question: 'How ___ students are in your class?',
      questionEn: 'How ___ students are in your class?',
      options: ['much', 'many', 'lot'],
      answerIndex: 1,
      order: 8,
    },
    {
      question: 'I look forward ___ meeting you in Valletta.',
      questionEn: 'I look forward ___ meeting you in Valletta.',
      options: ['to', 'for', 'at'],
      answerIndex: 0,
      order: 9,
    },
  ]);

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  await DailyInsight.insertMany([
    { date: today, userTypes: ['all'], title: 'Bugün deniz 26°C', description: 'Mükemmel yüzme havası. Blue Lagoon erken gidin!', priority: 10, image: insightImage(0) },
    { date: today, userTypes: ['tourist'], title: 'Gozo günübirlik turu', description: 'En çok satan tur – 4 kişilik grup indirimi', priority: 7, image: insightImage(2) },
    { date: today, userTypes: ['work_study'], title: 'Work & Study programları', description: 'Haftalık dil + yarı zamanlı çalışma seçenekleri', priority: 8, image: insightImage(3) },
  ]);

  await DiscountCode.insertMany([
    { code: 'TURK20', percent: 20, forTurkish: true, active: true },
    { code: 'EARLYBIRD15', percent: 15, earlyBird: true, active: true },
  ]);

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 3);
  await Event.insertMany([
    { title: 'Language Exchange – Sliema', description: 'Türkçe-İngilizce pratik buluşması', date: eventDate, location: 'Sliema promenade', type: 'language_exchange', maxAttendees: 20, image: eventImage('language_exchange') },
    { title: 'Party Crew – Boat Pre-Meet', description: 'Parti teknesi öncesi tanışma', date: new Date(eventDate.getTime() + 86400000), location: 'St. Julian\'s', type: 'party', maxAttendees: 40, image: eventImage('party') },
    { title: 'Work & Study Networking', description: 'İş ve eğitim networking', date: new Date(eventDate.getTime() + 86400000 * 2), location: 'Valletta', type: 'meetup', maxAttendees: 30, image: eventImage('meetup') },
  ]);

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
