# 🏛️ CivicFix — Akıllı Kent Arıza ve İhbar Yönetim Sistemi

CivicFix, akıllı şehir vizyonu doğrultusunda belediyeler ile vatandaşlar arasındaki bağı güçlendiren, şehir genelindeki arızaların (yol, su, aydınlatma, atık vb.) konum tabanlı bildirilmesini, otomatik sınıflandırılmasını ve saha ekiplerince çözülmesini sağlayan modern bir **Arıza Yönetim ve İhbar Takip Platformudur**.

Proje, hem **React tabanlı bir Web Portalını** (Vatandaş ve Yönetici Arayüzleri) hem de **React Native tabanlı bir Mobil Uygulamayı** (Vatandaş İhbar Ekranları) tek bir Supabase veritabanı altyapısıyla birleştirir.

---

## 🚀 Proje Özellikleri

### 1. 📍 Konum Tabanlı Arıza İhbarı ve Harita Entegrasyonu
* Vatandaşlar, mobil veya web arayüzünden harita üzerinde konum işaretleyerek veya cihazın **GPS/Konum** servislerini kullanarak nokta atışı ihbar oluşturabilir.
* Hatalı test kayıtlarını önlemek amacıyla "Rastgele Konum" simülasyon butonları kaldırılılarak sadece gerçek GPS verisiyle çalışacak şekilde konum sistemi güvenli hale getirilmiştir.

### 2. 📸 Gelişmiş Görsel İhbar Sistemi & Kamera Entegrasyonu
* **Kameradan Çek (Mobil):** Mobil uygulamada tarayıcı üzerinden doğrudan kamera tetiklenerek (`capture="environment"`) arızanın fotoğrafı çekilebilir ve sisteme sıkıştırılmış base64 formatında yüklenebilir.
* **Mock Presets Kaldırıldı:** "Örnek arıza resmi seçme" gibi gerçekçi olmayan mock görseller sistemden temizlenmiştir. Kullanıcıların yalnızca gerçek fotoğraflarla ihbar göndermesi zorunlu kılınmıştır.
* **Yüksek Kaliteli Önizleme (Lightbox Modal):** İhbar listelerindeki Before/After (Öncesi/Sonrası) görsellerine tıklandığında z-index çakışmaları çözülmüş, sayfa üzerinde bulanık arka planlı (`backdrop-blur-md bg-slate-950/80`) yüksek kaliteli tam ekran görsel görüntüleme modülü entegre edilmiştir.

### 3. 👥 Saha Ekipleri & Departman Yönetim Paneli
* Belediye yöneticileri için özel **"Saha Ekipleri" (Teams Management)** paneli geliştirilmiştir.
* Çalışanlar uzmanlık alanlarına göre departmanlara (Yol Bakım, Su ve Kanalizasyon, Aydınlatma, Atık Yönetimi, Trafik ve Tabela, Çevre ve Parklar) ayrılabilir.
* Yönetici arayüzünde tek bir tıklama ile (dropdown/açılır kutu) çalışanın departmanı değiştirildiği anda Supabase veritabanında dinamik güncelleme tetiklenir.

### 4. 🏅 Vatandaş Güven Skoru & Rozet Sistemi
* İhbarın geçerliliği onaylanıp durum **"Çözüldü"** yapıldığında vatandaşın güven skoru (Trust Score) `+5` artar ve aktifliğine göre rozetler kazanır (*Güvenilir Vatandaş*, *Aktif Vatandaş*, *Elit Vatandaş*).
* Yanıltıcı ihbarlar yapılıp ihbar durumu **"İptal"** edildiğinde ise güven skoru otomatik olarak `-10` puan düşürülür.

### 5. 🛡️ Schema-Cache Hata Kurtarma ve Self-Healing Yapısı
* Supabase üzerinde şema güncellemelerinden kaynaklanan `PGRST111/PGRST204` (schema cache mismatch) ve kolon eksikliği hatalarına karşı **istemci tarafında dinamik hata kurtarma (fallback)** yapısı kurulmuştur.
* Eksik kolonlu eski şemalarda dahi sistem hata vermez; yeni eklenen parametreleri (`priority_score`, `sla_deadline` vb.) otomatik temizleyerek insert işlemini güvenle tamamlar.
* Yabancı anahtar (FK) kısıtlama hatalarında vatandaşın profili bulunamasa bile ihbarın sisteme iletilmesi için misafir modu tetiklenir.

---

## 🏗️ Teknoloji Yığını (Technology Stack)

* **Database (Veritabanı):** Supabase (PostgreSQL), İlişkisel Veri Modeli, SQL Triggers & Functions (Otomatik güven skoru ve sayaç yönetimi için).
* **Web Arayüzü:** React 18, Vite, Material-UI (MUI), React Router v6, Tailwind CSS.
* **Mobil Uygulama:** React Native, Expo, React Native Elements.
* **Servis ve API:** Supabase JS Client, JWT Authentication, Custom Database Services (`dbService.js` & `dbService.ts`).

---

## 📂 Proje Yapısı

```text
civicfix/
├── civicfix-web/           # React Web Uygulaması (Vatandaş & Yönetici Portalı)
│   ├── src/
│   │   ├── components/     # CitizenView.jsx, Header.jsx, TeamsManagement.jsx vb.
│   │   ├── services/       # dbService.js (Supabase Web İletişim Arayüzü)
│   │   └── App.jsx         # Web Yönlendirme ve State Yönetimi
│   └── package.json
│
├── civicfix-mobile/        # React Native / Expo Mobil Uygulaması (Vatandaş Portalı)
│   ├── src/
│   │   ├── app/            # index.tsx (Mobil Ana Ekran ve Kamera/Kayıt Arayüzü)
│   │   └── services/       # dbService.ts (Supabase Mobil İletişim Arayüzü)
│   └── package.json
│
└── supabase/
    └── schema.sql          # Veritabanı tabloları, ilişkiler ve tetikleyiciler (Triggers)
```

---

## 🔧 Kurulum ve Çalıştırma

### 1. Veritabanı Kurulumu
Supabase paneline gidin ve SQL Editor kısmına `supabase/schema.sql` dosyasındaki SQL komutlarını yapıştırıp çalıştırın. Bu işlem gerekli tüm tabloları, indeksleri ve otomatik güven skoru hesaplayan tetikleyicileri (triggers) oluşturacaktır.

### 2. Web Portalını Başlatma
```bash
cd civicfix-web
npm install
npm run dev
```
Web uygulaması varsayılan olarak **http://localhost:5173** portunda çalışacaktır.

### 3. Mobil Uygulamayı Başlatma
```bash
cd civicfix-mobile
npm install
npx expo start
```
Mobil uygulamayı cihazınızda test etmek için terminalde açılan QR kodu **Expo Go** uygulaması ile taratabilirsiniz.
```
```

### Yazar: **Oğuzhan Aysel**
