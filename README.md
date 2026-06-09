# MaltaStart

Malta'da dil öğrencileri ve turistler için kapsamlı platform.

## Proje Yapısı

| Klasör | Teknoloji | Açıklama |
|--------|-----------|----------|
| `mobile/` | Expo (React Native) | iOS & Android uygulaması |
| `backend/` | Node.js + Express + MongoDB | REST API + Socket.io |
| `admin/` | React + Vite | Yönetim paneli |

## Hızlı Başlangıç

### Backend
```bash
cd backend
cp .env.example .env
# MongoDB URI ve JWT_SECRET düzenleyin
npm install
npm run seed
npm run dev
```

### Mobile
```bash
cd mobile
npm install
# .env içinde EXPO_PUBLIC_API_URL=http://localhost:3000/api
npx expo start
```

### Admin
```bash
cd admin
npm install
npm run dev
```

## Özellikler

- **Keşfet**: Kişiselleştirilmiş öneriler, hava, plaj uyarıları
- **Okullar**: 35+ okul, filtreleme, karşılaştırma, başvuru
- **Turlar**: Hazır paketler, özel tur teklifi, rezervasyon
- **Yaşam Rehberi**: Plajlar, ulaşım, yemek, pratik bilgiler
- **Topluluk**: Odalar, mesajlaşma, feed

## Diller

Türkçe, English, Deutsch, العربية, Español

## Teknoloji Kararı: Expo

React Native **Expo** seçildi çünkü:
- Push notification, OTA güncelleme, harita ve çoklu dil için hızlı entegrasyon
- iOS + Android tek kod tabanı
- Production için EAS Build

## Mimari

```
maltstart/
├── mobile/     → Expo (5 tab navigation)
├── backend/    → Express + MongoDB + Socket.io
└── admin/      → React + Vite
```

## API Özeti

| Modül | Endpoint |
|-------|----------|
| Keşfet | `GET /api/discover/home`, chatbot, bütçe, dil testi |
| Okullar | `GET/POST /api/schools`, inquiry, apply |
| Turlar | `GET/POST /api/tours`, book, custom-request |
| Rehber | `GET /api/guide/beaches`, articles, weather |
| Topluluk | `GET/POST /api/community/rooms`, feed, DM |
| Admin | `GET/POST/PATCH /api/admin/*` (okul, tur, plaj, makale, etkinlik, indirim, kartlar, ayarlar) |
| Uygulama ayarları | `GET /api/config/public` (acil numaralar, hızlı linkler, destek odası) |

## Admin panel içerik yönetimi

Tüm mobil içerik admin panelden yönetilir:

- **Okullar / Turlar / Plajlar / Rehber / Etkinlikler** – ekleme, düzenleme, pasifleştirme
- **Gün kartları (insights)** – Keşfet ekranı kartları
- **İndirim kodları** – mobilde doğrulama API ile
- **Uygulama ayarları** – acil numaralar, Bolt/Tallinja linkleri, chatbot metni, 7/24 destek odası
- **Komisyon** – kayıtlı başvurulardan özet
- **Özel tur** – teklif + kullanıcıyla sohbet

Seed yalnızca ilk kurulum içindir; canlıda değişiklikler admin üzerinden yapılır.

## Admin Giriş (seed sonrası)

- E-posta: `admin@maltstart.com`
- Şifre: `Admin123!`

## Ortam Değişkenleri

`backend/.env`:
```
OPENWEATHER_API_KEY=...   # https://openweathermap.org/api
```

## Ödeme Yok – Talep Akışı

Tüm turlar **talep formu** ile admin panele düşer (`Tur Talepleri`). Teklif → onay → push bildirimi.

## Push & Konum

- Expo push token kaydı (`/api/notifications/register-token`)
- Kalabalık plaja yaklaşınca yerel bildirim (`/api/notifications/location-check`)

## Offline

Mobil: `fetchWithCache` ile keşfet, plajlar ve top50 önbelleklenir (6 saat).
# maltaapp
