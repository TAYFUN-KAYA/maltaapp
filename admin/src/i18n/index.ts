import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createElement } from 'react';

const tr = {
  nav: {
    dashboard: 'Dashboard',
    schools: 'Okullar',
    tours: 'Turlar',
    beaches: 'Plajlar',
    articles: 'Rehber',
    events: 'Etkinlikler',
    insights: 'Gün Kartları',
    discounts: 'İndirim Kodları',
    emergency: 'Acil Destek',
    appConfig: 'Uygulama Ayarları',
    bookings: 'Tur Talepleri',
    applications: 'Başvurular',
    inquiries: 'Okul Soruları',
    customTours: 'Özel Tur',
    commissions: 'Komisyon',
    rooms: 'Odalar',
    languageTest: 'Dil Testi',
    notifications: 'Bildirimler',
  },
  notifications: {
    title: 'Bildirimler',
    empty: 'Bildirim yok',
    markAllRead: 'Tümünü okundu işaretle',
    colTitle: 'Başlık',
    colBody: 'Mesaj',
    colDate: 'Tarih',
  },
  common: {
    logout: 'Çıkış',
    loading: 'Yükleniyor...',
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    send: 'Gönder',
    adminPanel: 'Admin Panel',
  },
  bookings: {
    title: 'Tur Talepleri',
    subtitle: 'Teklif gönderin, onaylayın veya reddedin. Onayda kullanıcı takvime ekleyebilir.',
    user: 'Kullanıcı',
    tour: 'Tur',
    date: 'Tarih',
    participants: 'Kişi',
    discount: 'İndirim',
    status: 'Durum',
    actions: 'İşlem',
    quote: 'Teklif Ver',
    review: 'İncele',
    approve: 'Onayla',
    reject: 'Reddet',
    quoteModal: 'Teklif gönder',
    approveModal: 'Talebi onayla',
    quotePrice: 'Teklif (€)',
    pushMessage: 'Mesaj (bildirim)',
    approveMessage: 'Onay mesajı',
    rejectMessage: 'Red mesajı',
    rejectDefault: 'Talebiniz maalesef onaylanmadı.',
    approveDefault: 'Talebiniz onaylandı.',
  },
  customTours: {
    title: 'Özel Tur Talepleri',
    user: 'Kullanıcı',
    participants: 'Kişi',
    budget: 'Bütçe',
    requirements: 'İstekler',
    status: 'Durum',
    chat: 'Sohbet',
    quote: 'Teklif Ver',
    approve: 'Onayla',
    reject: 'Reddet',
    quoteModal: 'Teklif Gönder',
    rejectModal: 'Talebi reddet',
    price: 'Teklif fiyatı (EUR)',
    message: 'Mesaj',
    chatTitle: 'Sohbet',
    placeholder: 'Mesaj yazın...',
    admin: 'Admin',
    userLabel: 'Kullanıcı',
    rejectDefault: 'Özel tur talebiniz onaylanmadı.',
  },
  rooms: {
    title: 'Topluluk Odaları',
    newRoom: 'Yeni Oda',
    editRoom: 'Oda düzenle',
    name: 'Ad',
    slug: 'Slug',
    type: 'Tip',
    description: 'Açıklama',
    public: 'Herkese açık',
    members: 'Üyeler',
    memberCount: 'Üye sayısı',
    actions: 'İşlem',
    manageMembers: 'Üyeler',
    kick: 'Çıkar',
    kickConfirm: 'Bu kullanıcıyı odadan çıkarmak istediğinize emin misiniz?',
    deleteRoom: 'Odayı sil',
    deleteConfirm: 'Bu oda ve tüm mesajları silinecek. Emin misiniz?',
    noMembers: 'Henüz üye yok',
    joinedAt: 'Katılım',
    email: 'E-posta',
    empty: 'Oda bulunamadı',
  },
};

const en: typeof tr = {
  nav: {
    dashboard: 'Dashboard',
    schools: 'Schools',
    tours: 'Tours',
    beaches: 'Beaches',
    articles: 'Guide',
    events: 'Events',
    insights: 'Daily Cards',
    discounts: 'Discount Codes',
    emergency: 'Emergency',
    appConfig: 'App Settings',
    bookings: 'Tour Requests',
    applications: 'Applications',
    inquiries: 'School Inquiries',
    customTours: 'Custom Tours',
    commissions: 'Commissions',
    rooms: 'Rooms',
    languageTest: 'Language Test',
    notifications: 'Notifications',
  },
  notifications: {
    title: 'Notifications',
    empty: 'No notifications',
    markAllRead: 'Mark all read',
    colTitle: 'Title',
    colBody: 'Message',
    colDate: 'Date',
  },
  common: {
    logout: 'Logout',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    send: 'Send',
    adminPanel: 'Admin Panel',
  },
  bookings: {
    title: 'Tour Requests',
    subtitle: 'Send a quote, approve, or reject. Users can add confirmed tours to calendar.',
    user: 'User',
    tour: 'Tour',
    date: 'Date',
    participants: 'Guests',
    discount: 'Discount',
    status: 'Status',
    actions: 'Actions',
    quote: 'Send quote',
    review: 'Review',
    approve: 'Approve',
    reject: 'Reject',
    quoteModal: 'Send quote',
    approveModal: 'Approve request',
    quotePrice: 'Quote (€)',
    pushMessage: 'Message (notification)',
    approveMessage: 'Approval message',
    rejectMessage: 'Rejection message',
    rejectDefault: 'Your request was not approved.',
    approveDefault: 'Your request has been approved.',
  },
  customTours: {
    title: 'Custom Tour Requests',
    user: 'User',
    participants: 'Guests',
    budget: 'Budget',
    requirements: 'Requirements',
    status: 'Status',
    chat: 'Chat',
    quote: 'Send quote',
    approve: 'Approve',
    reject: 'Reject',
    quoteModal: 'Send Quote',
    rejectModal: 'Reject request',
    price: 'Quote price (EUR)',
    message: 'Message',
    chatTitle: 'Chat',
    placeholder: 'Type a message...',
    admin: 'Admin',
    userLabel: 'User',
    rejectDefault: 'Your custom tour request was not approved.',
  },
  rooms: {
    title: 'Community Rooms',
    newRoom: 'New room',
    editRoom: 'Edit room',
    name: 'Name',
    slug: 'Slug',
    type: 'Type',
    description: 'Description',
    public: 'Public',
    members: 'Members',
    memberCount: 'Members',
    actions: 'Actions',
    manageMembers: 'Members',
    kick: 'Remove',
    kickConfirm: 'Remove this user from the room?',
    deleteRoom: 'Delete room',
    deleteConfirm: 'This will delete the room and all messages. Continue?',
    noMembers: 'No members yet',
    joinedAt: 'Joined',
    email: 'Email',
    empty: 'Room not found',
  },
};

const dicts = { tr, en } as const;
export type AdminLang = keyof typeof dicts;

type Dict = (typeof dicts)['tr'];

function get(obj: Dict, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else return path;
  }
  return typeof cur === 'string' ? cur : path;
}

const AdminI18nContext = createContext<{
  lang: AdminLang;
  setLang: (l: AdminLang) => void;
  t: (key: string) => string;
} | null>(null);

export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>(
    () => (localStorage.getItem('admin_lang') as AdminLang) || 'tr'
  );

  const setLang = useCallback((l: AdminLang) => {
    setLangState(l);
    localStorage.setItem('admin_lang', l);
  }, []);

  const t = useCallback((key: string) => get(dicts[lang], key), [lang]);

  return createElement(
    AdminI18nContext.Provider,
    { value: { lang, setLang, t } },
    children
  );
}

export function useAdminT() {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) throw new Error('useAdminT requires AdminI18nProvider');
  return ctx;
}
