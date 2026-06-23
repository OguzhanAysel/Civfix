import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Send, Check, AlertTriangle, Sparkles, Navigation, ListFilter, BellDot, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { dbService } from '../../services/dbService';
import { aiService } from '../../services/aiService';

// Telefon içi harita tıklama algılayıcısı
function LocationPicker({ onLocationSelect, markerPos }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });

  const customMarker = L.divIcon({
    html: `<div class="w-6 h-6 bg-indigo-650 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-5xs">📌</div>`,
    className: 'custom-picker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return markerPos ? <Marker position={markerPos} icon={customMarker} /> : null;
}

// Hazır Örnek Görseller (Mobil Simülatör Kamera Kaydı Taklidi İçin)
const PRESET_PHOTOS = [
  {
    name: "Asfalt Çukuru",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=60",
    text: "Yol ortasında büyük bir çukur var. Araçların lastiği patlayabilir.",
    category: "Yol Bakım",
    ai_label: "Asfalt Çukuru",
    confidence: 94
  },
  {
    name: "Sönük Sokak Lambası",
    url: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?w=500&auto=format&fit=crop&q=60",
    text: "Mühendislik Fakültesi önündeki sokak lambaları akşamları yanmıyor.",
    category: "Aydınlatma",
    ai_label: "Sönük Sokak Lambası",
    confidence: 89
  },
  {
    name: "Su Sızıntısı",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    text: "Kaldırımın altındaki borudan sürekli temiz su sızıyor, yol ıslak.",
    category: "Su ve Kanalizasyon",
    ai_label: "Su Sızıntısı",
    confidence: 91
  },
  {
    name: "Çöp Konteyneri Taşması",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500&auto=format&fit=crop&q=60",
    text: "Çöp konteyneri tamamen taşmış, mahallede koku yapıyor.",
    category: "Atık Yönetimi",
    ai_label: "Çöp Taşması",
    confidence: 92
  },
  {
    name: "Kırık Park Salıncağı",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop&q=60",
    text: "Parktaki zincirli salıncak kırılmış, çocuklar düşebilir.",
    category: "Çevre ve Parklar",
    ai_label: "Kırık Salıncak",
    confidence: 88
  }
];

export default function CitizenSimulator({ onReportSubmitted, currentReports }) {
  const [mobileTab, setMobileTab] = useState('create'); // 'create', 'reports', 'notifications'
  
  // İhbar Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState([39.8970, 32.7800]); // default Ankara
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // AI Analiz State
  const [aiPrediction, setAiPrediction] = useState({ category: 'Yol Bakım', priority: 'Normal', confidence: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState(null);
  
  // Mobil Bildirim State
  const [toastNotification, setToastNotification] = useState(null);
  const [localNotifications, setLocalNotifications] = useState([]);
  
  // Telefon Saati
  const [currentTime, setCurrentTime] = useState('');

  // Audio Ref (Push notification sesi için)
  const audioContextRef = useRef(null);

  // 1. Saat Güncellemesi
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Realtime Haberleşme Alıcısı (Web panelindeki değişiklikleri yakala)
  useEffect(() => {
    const handleRealtimeMessage = (e) => {
      const { type, data } = e.detail;

      if (type === 'REPORT_STATUS_UPDATED') {
        const notifTitle = `İhbar Güncellemesi (#${data.id.replace('rep-', '')})`;
        const notifMsg = `İhbarınız '${data.status}' aşamasına güncellendi.`;
        
        // Push notification popup göster
        setToastNotification({ title: notifTitle, message: notifMsg });
        playNotificationSound();

        // Bildirim listesini güncelle
        setLocalNotifications(dbService.getNotifications());
        
        // Toast bildirimini 5 saniye sonra kapat
        setTimeout(() => {
          setToastNotification(null);
        }, 5000);
      }
    };

    window.addEventListener('civicfix_realtime', handleRealtimeMessage);
    setLocalNotifications(dbService.getNotifications());
    return () => window.removeEventListener('civicfix_realtime', handleRealtimeMessage);
  }, []);

  // Telefon Bildirim Sesi Simülasyonu (Web Audio API)
  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Çift ton bildirim sesi
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.05); // G5
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.2); // C6

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.05);
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn("AudioContext ses çalma engellendi", err);
    }
  };

  // 3. Açıklama Değiştikçe AI Kategorizasyonu
  useEffect(() => {
    if (!description.trim()) {
      setAiPrediction({ category: 'Kategori Belirleniyor...', priority: 'Normal', confidence: 0 });
      setDuplicateReport(null);
      return;
    }

    setIsAnalyzing(true);
    const delayDebounceFn = setTimeout(async () => {
      // NLP kelime analizi
      const res = aiService.analyzeDescription(description);
      setAiPrediction({
        category: res.category,
        priority: res.priority,
        confidence: res.confidence
      });
      setIsAnalyzing(false);

      // Mükerrer Kontrolü (Aynı kategori ve 50m mesafe kontrolü)
      if (location) {
        const dup = await aiService.checkDuplicate(location[0], location[1], res.category);
        setDuplicateReport(dup);
      }

    }, 600); // Debounce süresi

    return () => clearTimeout(delayDebounceFn);
  }, [description, location]);

  // 4. Hazır Fotoğraf Seçme Handler'ı
  const handleSelectPresetPhoto = (preset) => {
    setSelectedPhoto(preset.url);
    setDescription(preset.text);
    setTitle(`${preset.name} Bildirimi`);
  };

  // 5. İhbar Gönderme Handler'ı
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || isAnalyzing) return;

    const reportData = {
      title: title.trim() || `${aiPrediction.category} Arızası`,
      description: description,
      category: aiPrediction.category,
      priority: aiPrediction.priority,
      latitude: location[0],
      longitude: location[1],
      address: `Vatandaş Konumu (${location[0].toFixed(4)}, ${location[1].toFixed(4)})`,
      citizen_name: "Yurttaş Can",
      status: "Yeni"
    };

    try {
      await dbService.createReport(reportData, selectedPhoto);
      
      // Temizleme ve Başarı Adımları
      setTitle('');
      setDescription('');
      setSelectedPhoto(null);
      setDuplicateReport(null);
      setMobileTab('reports'); // İhbarlarım listesine git

      // Web panelini güncelle
      onReportSubmitted();
    } catch (err) {
      console.error("İhbar gönderme hatası:", err);
    }
  };

  // İhbar Takip Zaman Çizelgesi
  const renderTimeline = (status) => {
    const steps = [
      { id: 'Yeni', label: 'Oluşturuldu' },
      { id: 'İnceleniyor', label: 'İnceleniyor' },
      { id: 'Atandı', label: 'Ekip Atandı' },
      { id: 'Sahada', label: 'Sahada' },
      { id: 'Çözüldü', label: 'Çözüldü' }
    ];

    const currentIdx = steps.findIndex(s => s.id === status);

    return (
      <div className="flex items-center justify-between w-full mt-3 px-1">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center relative">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-4xs font-bold transition-all ${
                  isDone 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {isDone && step.id === 'Çözüldü' ? '✓' : idx + 1}
                </div>
                <span className={`text-5xs mt-1.5 font-bold tracking-tight whitespace-nowrap absolute -bottom-4.5 ${
                  isCurrent ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.8 mx-1 rounded-full transition-all ${
                  idx < currentIdx ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      
      {/* 📱 Akıllı Telefon Dış Çerçevesi (Phone Frame) */}
      <div className="relative mx-auto h-[620px] w-[310px] rounded-[42px] border-[10px] border-slate-800 bg-slate-900 shadow-2xl ring-12 ring-slate-900/10 dark:border-slate-700">
        
        {/* Hoparlör ve Ön Kamera Notçu */}
        <div className="absolute top-0 left-1/2 z-40 h-4.5 w-32 -translate-x-1/2 rounded-b-xl bg-slate-800 dark:bg-slate-700 flex justify-center items-center gap-2">
          <div className="h-1 w-12 rounded bg-slate-600"></div>
          <div className="h-2 w-2 rounded-full bg-slate-650"></div>
        </div>

        {/* 📱 Telefon Ekranı (Screen Viewport) */}
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 select-none">
          
          {/* 1. Üst Durum Çubuğu (Status Bar) */}
          <div className="flex h-10 items-end justify-between px-6 pb-1.5 text-4xs font-black tracking-wide text-slate-700 dark:text-slate-350">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <span>📶</span>
              <span>🔋 89%</span>
            </div>
          </div>

          {/* 🔔 Canlı Push Notification Toast */}
          {toastNotification && (
            <div className="absolute top-11 left-3 right-3 z-50 flex items-start gap-2.5 rounded-2xl border border-indigo-200/50 bg-white/95 p-3 shadow-lg dark:border-indigo-950/50 dark:bg-slate-900/95 backdrop-blur-md animate-in slide-in-from-top duration-300">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <BellDot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-4xs font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                  {toastNotification.title}
                </h5>
                <p className="text-5xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {toastNotification.message}
                </p>
              </div>
            </div>
          )}

          {/* 2. Ekran İçeriği (Tab Bazlı Kaydırma) */}
          <div className="flex-1 overflow-y-auto px-4.5 py-3.5 space-y-4">
            
            {/* TAB: YENİ İHBAR OLUŞTUR */}
            {mobileTab === 'create' && (
              <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xs font-extrabold tracking-tight text-slate-800 dark:text-slate-150">Yeni İhbar Bildir</h2>
                  <span className="text-5xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-850 px-1.8 py-0.5 rounded">Vatandaş Portalı</span>
                </div>

                {/* Hazır Görsel Seçimi */}
                <div className="space-y-1.5">
                  <label className="text-5xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-400">Arıza Fotoğrafı Seç / Çek</label>
                  <div className="flex gap-2 overflow-x-auto pb-1.5">
                    {PRESET_PHOTOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPresetPhoto(preset)}
                        className={`h-14 w-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all relative ${
                          selectedPhoto === preset.url ? 'border-indigo-600 scale-[0.98]' : 'border-transparent'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 text-white text-[7px] font-bold text-center truncate py-0.5">
                          {preset.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seçilen Fotoğraf Önizleme ve AI Analizi */}
                {selectedPhoto && (
                  <div className="relative rounded-xl overflow-hidden h-28 border border-slate-200/50 bg-slate-100">
                    <img src={selectedPhoto} alt="Seçilen Arıza" className="h-full w-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setSelectedPhoto(null); }}
                      className="absolute top-1.5 right-1.5 h-5 w-5 bg-slate-900/60 hover:bg-slate-900 rounded-full text-white flex items-center justify-center text-4xs"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white text-5xs px-2 py-0.8 rounded-lg font-bold border border-indigo-400 flex items-center gap-1.5 backdrop-blur-xs">
                      <Sparkles className="h-3 w-3" />
                      <span>AI Nesne Algılama: %{aiPrediction.confidence} {aiPrediction.category}</span>
                    </div>
                  </div>
                )}

                {/* Açıklama Yazı Alanı */}
                <div className="space-y-1.5">
                  <label className="text-5xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-400">Açıklama</label>
                  <textarea
                    rows="2.5"
                    required
                    placeholder="Lütfen arızayı detaylı açıklayın. AI otomatik analiz edecektir..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-3xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Yapay Zekâ Gerçek Zamanlı Analiz Göstergesi */}
                {description.trim() && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-3 dark:border-indigo-950/60 dark:bg-indigo-950/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-750 dark:text-indigo-300">
                        <Sparkles className={`h-3 w-3 text-indigo-500 ${isAnalyzing ? 'animate-spin' : 'animate-pulse'}`} />
                        <span>AI Otomatik Algılama</span>
                      </div>
                      {isAnalyzing ? (
                        <span className="text-[8px] text-slate-400 italic">Çözümleniyor...</span>
                      ) : (
                        <span className="text-[8px] text-success-600 font-bold">Analiz Hazır</span>
                      )}
                    </div>
                    
                    {!isAnalyzing && (
                      <div className="flex flex-wrap gap-2 text-5xs font-extrabold">
                        <span className="bg-indigo-100/60 text-indigo-650 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.8 rounded">
                          Kat: {aiPrediction.category}
                        </span>
                        <span className={`px-2 py-0.8 rounded ${
                          aiPrediction.priority === 'Acil' ? 'bg-emergency-50 text-emergency-600' :
                          aiPrediction.priority === 'Yüksek' ? 'bg-warning-50 text-warning-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          Öncelik: {aiPrediction.priority}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mükerrer Kayıt Uyarısı (50 Metre Kuralı) */}
                {duplicateReport && (
                  <div className="rounded-xl border border-emergency-200 bg-emergency-50/20 p-3 dark:border-emergency-900 dark:bg-emergency-950/20 flex items-start gap-2 animate-bounce">
                    <ShieldAlert className="h-4.5 w-4.5 text-emergency-600 dark:text-emergency-400 shrink-0" />
                    <div className="space-y-1">
                      <h6 className="text-5xs font-black text-emergency-600 dark:text-emergency-400 leading-none">Mükerrer Kayıt Riski</h6>
                      <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-tight">
                        {duplicateReport.distance}m yakınında aynı kategoride aktif bir arıza kaydı zaten açık!
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileTab('reports');
                          setSelectedPhoto(null);
                          setDescription('');
                        }}
                        className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 underline"
                      >
                        Olan kaydı takip et
                      </button>
                    </div>
                  </div>
                )}

                {/* Haritadan Konum Seçme */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-5xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-400">Haritada Konum Seç</label>
                    <span className="text-[8px] text-slate-400">Konuma tıklayın</span>
                  </div>
                  
                  {/* Telefon İçi Harita */}
                  <div className="h-28 w-full rounded-xl overflow-hidden border border-slate-200/50 bg-slate-100 z-0">
                    <MapContainer 
                      center={location} 
                      zoom={13} 
                      className="h-full w-full"
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker onLocationSelect={setLocation} markerPos={location} />
                    </MapContainer>
                  </div>
                </div>

                {/* Gönder Butonu */}
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-2xs py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  <Send className="h-3.5 w-3.5" />
                  İhbarı Gönder
                </button>
              </form>
            )}

            {/* TAB: İHBARLARIM (TAKİP EKRANI) */}
            {mobileTab === 'reports' && (
              <div className="space-y-4 pb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xs font-extrabold tracking-tight text-slate-800 dark:text-slate-150">Bildirdiğim Sorunlar</h2>
                  <span className="text-5xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-850 px-1.8 py-0.5 rounded">Takip Çizelgesi</span>
                </div>

                <div className="space-y-7">
                  {currentReports.length === 0 ? (
                    <div className="py-24 text-center text-4xs text-slate-400 italic">Henüz bir ihbar bildirmediniz</div>
                  ) : (
                    currentReports.map(rep => (
                      <div 
                        key={rep.id} 
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-5xs font-bold text-slate-400">İhbar #{rep.id.replace('rep-', '')}</span>
                          <span className="text-5xs text-slate-450 font-bold">{rep.category}</span>
                        </div>
                        
                        <h4 className="text-3xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                          {rep.title}
                        </h4>

                        {/* Canlı Çizelge Zaman Tüneli */}
                        <div className="pt-1.5 pb-3">
                          {renderTimeline(rep.status)}
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: BİLDİRİMLER LİSTESİ */}
            {mobileTab === 'notifications' && (
              <div className="space-y-4 pb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xs font-extrabold tracking-tight text-slate-800 dark:text-slate-150">Gelen Bildirimler</h2>
                  <span className="text-5xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-850 px-1.8 py-0.5 rounded">Push Logs</span>
                </div>

                <div className="space-y-3">
                  {localNotifications.length === 0 ? (
                    <div className="py-24 text-center text-4xs text-slate-400 italic">Gelen bildirim bulunmuyor</div>
                  ) : (
                    localNotifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl space-y-1 text-[10px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 leading-none">{notif.title}</span>
                          <span className="text-[8px] text-slate-400">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-normal">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* 3. Alt Telefon Navigasyon Çubuğu (Tabs Bar) */}
          <div className="flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 px-3 dark:border-slate-850 dark:bg-slate-900/95 backdrop-blur-md">
            
            {/* Tab: İhbar Bildir */}
            <button
              onClick={() => setMobileTab('create')}
              className={`flex flex-col items-center gap-1.5 text-5xs font-extrabold transition-colors ${
                mobileTab === 'create' ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-400'
              }`}
            >
              <Camera className="h-4.5 w-4.5" />
              <span>İhbar Bildir</span>
            </button>

            {/* Tab: İhbarlarım */}
            <button
              onClick={() => setMobileTab('reports')}
              className={`flex flex-col items-center gap-1.5 text-5xs font-extrabold transition-colors ${
                mobileTab === 'reports' ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-400'
              }`}
            >
              <ListFilter className="h-4.5 w-4.5" />
              <span>İhbarlarım</span>
            </button>

            {/* Tab: Bildirimler */}
            <button
              onClick={() => setMobileTab('notifications')}
              className={`flex flex-col items-center gap-1.5 text-5xs font-extrabold transition-colors relative ${
                mobileTab === 'notifications' ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-400'
              }`}
            >
              <BellDot className="h-4.5 w-4.5" />
              <span>Bildirimler</span>
              {localNotifications.some(n => !n.is_read) && (
                <span className="absolute top-0 right-2 h-2 w-2 rounded-full bg-emergency-600" />
              )}
            </button>

          </div>

          {/* 4. Alt Home Indicator (Çizgisi) */}
          <div className="flex h-5 w-full items-center justify-center bg-white dark:bg-slate-900">
            <div className="h-1 w-28 rounded-full bg-slate-350 dark:bg-slate-750"></div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
