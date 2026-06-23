import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { aiService } from '../../services/aiService';
import { Camera, MapPin, Sparkles, AlertTriangle, Send, ThumbsUp, CheckCircle, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Yedek Resim Sabiti
const DEFAULT_REPORT_IMAGE = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=60";

function CitizenSLACountdown({ report }) {
  const [timeStr, setTimeStr] = useState('');
  const [isViolated, setIsViolated] = useState(false);

  useEffect(() => {
    if (report.status === 'Çözüldü') {
      setTimeStr('Tamamlandı');
      setIsViolated(false);
      return;
    }
    if (!report.sla_deadline) {
      setTimeStr('-');
      return;
    }

    const update = () => {
      const diff = new Date(report.sla_deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeStr('Süresi Geçti (SLA İhlali)');
        setIsViolated(true);
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const pad = (n) => String(n).padStart(2, '0');
        setTimeStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        setIsViolated(false);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [report.status, report.sla_deadline]);

  if (report.status === 'Çözüldü') {
    return <span className="text-success-650 dark:text-success-400 font-semibold text-4xs">✓ Çözüldü</span>;
  }
  if (!report.sla_deadline) return null;

  return (
    <span className={`text-4xs font-bold ${isViolated ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
      {isViolated ? '⚠️ SLA İhlali (Gecikme)' : `⏱️ Kalan SLA: ${timeStr}`}
    </span>
  );
}

export default function CitizenView({ loginName, userId, reports, setReports }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'list'
  const [subTab, setSubTab] = useState('community'); // 'community', 'personal'
  
  // Form State
  const [description, setDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [latitude, setLatitude] = useState(39.8972);
  const [longitude, setLongitude] = useState(32.7794);
  const [address, setAddress] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // AI & Duplicate
  const [aiResult, setAiResult] = useState({ category: 'Yol Bakım', priority: 'Normal', confidence: 0 });
  const [duplicateReport, setDuplicateReport] = useState(null);
  const [profile, setProfile] = useState({ trust_score: 100, badge: 'Yeni Vatandaş' });

  // Gelişmiş Filtreleme ve Konum State'leri
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [distanceLimit, setDistanceLimit] = useState('All');
  const [userGps, setUserGps] = useState([39.8972, 32.7794]);

  // GPS konumunu otomatik çekme
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserGps([lat, lng]);
          // Form alanındaki başlangıç konumunu da gerçek GPS yapalım
          setLatitude(lat);
          setLongitude(lng);
        },
        (err) => console.warn("GPS konumu alınamadı:", err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      const p = await dbService.getProfile(userId || 'citizen-user');
      if (p) setProfile(p);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [reports]);

  // AI NLP analysis on description change
  useEffect(() => {
    if (!description.trim()) {
      setAiResult({ category: 'Yol Bakım', priority: 'Normal', confidence: 0 });
      setDuplicateReport(null);
      return;
    }

    const res = aiService.analyzeDescription(description);
    setAiResult(res);

    aiService.checkDuplicate(latitude, longitude, res.category, reports)
      .then(dup => setDuplicateReport(dup));
  }, [description, latitude, longitude]);


  // Custom Image Upload (Base64 Sıkıştırma)
  const handleUploadPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let w = img.width;
            let h = img.height;

            if (w > h) {
              if (w > MAX_WIDTH) {
                h *= MAX_WIDTH / w;
                w = MAX_WIDTH;
              }
            } else {
              if (h > MAX_HEIGHT) {
                w *= MAX_HEIGHT / h;
                h = MAX_HEIGHT;
              }
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, w, h);

            const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
            setSelectedPhoto(compressedUrl);
          };
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Get GPS Location
  const handleGetGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          alert("GPS konumu alınamadı. Lütfen konum izinlerini kontrol edin.");
        }
      );
    } else {
      alert("Cihazınızda GPS desteği bulunmuyor.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    const reportData = {
      title: `${aiResult.category} Bildirimi`,
      description,
      category: aiResult.category,
      priority: aiResult.priority,
      latitude,
      longitude,
      address: address.trim() || `Konut Bölgesi (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      citizen_id: userId || 'citizen-user',
      status: 'Yeni'
    };

    try {
      const report = await dbService.createReport(reportData, selectedPhoto);
      alert("İhbarınız belediyeye iletildi!");
      
      if (report && report.id) {
        const myReps = JSON.parse(localStorage.getItem('civicfix_my_reports') || '[]');
        myReps.push(report.id);
        localStorage.setItem('civicfix_my_reports', JSON.stringify(myReps));
      }

      setDescription('');
      setSelectedPhoto(null);
      setAddress('');
      setDuplicateReport(null);
      
      const updated = await dbService.getReports();
      setReports(updated);
      setActiveTab('list');
      setSubTab('personal');
    } catch (err) {
      console.error(err);
      alert("İhbar Gönderilemedi: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleUpvote = async (reportId) => {
    try {
      await dbService.upvoteReport(reportId, userId || 'citizen-user');
      alert("İhbarı doğruladınız! Öncelik skoru yükseltildi.");
      const updated = await dbService.getReports();
      setReports(updated);
    } catch (err) {
      alert(err.message || "Bunu zaten oyladınız.");
    }
  };

  // Harici mesafe hesaplama fonksiyonu (Haversine formülü)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Mesafe (km)
  };

  // Yerel cihazdan oluşturulan ihbar listesini oku
  const myLocalReportIds = JSON.parse(localStorage.getItem('civicfix_my_reports') || '[]');

  // Filter reports
  const filteredReports = reports
    .filter(r => subTab === 'personal' ? (
      r.citizen_id === userId || 
      r.citizen_id === 'citizen-user' || 
      r.citizen_name === 'Yurttaş Can' ||
      myLocalReportIds.includes(r.id)
    ) : true)
    .filter(r => categoryFilter === 'All' ? true : r.category === categoryFilter)
    .filter(r => {
      if (distanceLimit === 'All') return true;
      const limit = parseFloat(distanceLimit);
      return getDistance(userGps[0], userGps[1], r.latitude, r.longitude) <= limit;
    });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Profil Header Bilgisi */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200">Vatandaş Portalı</h2>
          <p className="text-3xs text-slate-400">Arıza bildiriminde bulunun, sorunları çözün ve puan kazanın</p>
        </div>
        <div className="flex items-center gap-3 bg-brand-50/20 dark:bg-brand-950/20 px-4 py-2 border border-brand-100/30 dark:border-brand-900/30 rounded-xl">
          <div className="text-right">
            <span className="block text-3xs font-extrabold text-brand-650 dark:text-brand-400 leading-tight">
              {profile.badge || 'Yeni Vatandaş'}
            </span>
            <span className="block text-4xs text-slate-400">Güven Skoru</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 font-black flex items-center justify-center text-xs">
            ⭐
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{profile.trust_score || 100}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sol Menü: Sekmeler */}
        <div className="w-56 border-r border-slate-250/50 dark:border-slate-850 bg-white dark:bg-slate-900 flex flex-col p-4 space-y-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-2xs transition-all ${
              activeTab === 'create'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            📷 Yeni İhbar Oluştur
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-2xs transition-all ${
              activeTab === 'list'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            📋 Süreç Takip & Çevre
          </button>
        </div>

        {/* Sağ Alan: İçerik */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: OLUŞTUR */}
          {activeTab === 'create' && (
            <div className="max-w-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Yeni Arıza İhbarı Bildir
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Fotoğraf Ekleme */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">Fotoğraf Ekle</label>
                  <div className="flex gap-3 overflow-x-auto pb-1 items-center">
                    <button
                      type="button"
                      onClick={handleUploadPhoto}
                      className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-slate-350 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <span className="text-xl">📸</span>
                      <span className="text-[9px] font-bold mt-1">Cihazdan Seç</span>
                    </button>
                  </div>
                </div>

                {/* Görsel Önizleme ve AI Glow */}
                {selectedPhoto && (
                  <div className="relative h-40 w-full rounded-xl overflow-hidden border border-slate-200">
                    <img src={selectedPhoto} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-brand-600/90 backdrop-blur-sm px-3 py-1.8 text-white text-[9px] font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI Sınıfı: {aiResult.category}</span>
                      <span>Giriş Doğrulandı</span>
                    </div>
                  </div>
                )}

                {/* Açıklama */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">Açıklama Detayları</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Arızayı ve bulunduğu sokağı kısaca açıklayın..."
                    className="w-full h-24 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                  />
                </div>

                {/* AI Analizi */}
                {description.trim() && (
                  <div className="p-3 bg-brand-50/15 border border-brand-100 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-brand-700 flex items-center gap-1">🧠 Yapay Zekâ NLP Analizi:</span>
                    <div className="flex gap-2">
                      <span className="bg-white px-2 py-0.5 text-[8px] font-bold text-brand-600 border border-brand-200 rounded">
                        Kategori: {aiResult.category}
                      </span>
                      <span className="bg-white px-2 py-0.5 text-[8px] font-bold text-brand-600 border border-brand-200 rounded">
                        Öncelik: {aiResult.priority}
                      </span>
                    </div>
                  </div>
                )}

                {/* Mükerrer Kontrolü */}
                {duplicateReport && (
                  <div className="p-3 bg-red-50/20 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-[9px] leading-relaxed">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Mükerrer Bildirim Riski!</span>
                      Bu bölgede ({duplicateReport.distance}m yakınında) zaten açık bir `{aiResult.category}` ihbarı bulunuyor.
                    </div>
                  </div>
                )}

                {/* Açık Adres Girişi */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">Arıza Açık Adresi</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Sokak, mahalle, bina no ve kapı no gibi açık adres bilgisi yazın..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* GPS Konumu */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-450 font-bold uppercase mb-1">Enlem (Latitude)</label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={latitude}
                        onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 px-3 py-1.5 text-3xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-450 font-bold uppercase mb-1">Boylam (Longitude)</label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={longitude}
                        onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 px-3 py-1.5 text-3xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGetGPSLocation}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-3xs py-1.8 rounded-lg shadow-sm transition-all"
                  >
                    📍 Konumumu GPS'ten Al
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-2xs py-2.5 rounded-xl shadow-md"
                >
                  <Send className="h-4 w-4" />
                  İhbarı Belediye Sistemine Gönder
                </button>

              </form>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] overflow-hidden">
              
              {/* Sol Sütun: Filtreler ve Liste */}
              <div className="w-full lg:w-1/2 flex flex-col h-full space-y-4">
                
                {/* Filtreleme ve Sekme Kontrolleri */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm">
                  {/* Alt Sekmeler */}
                  <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSubTab('community')}
                      className={`px-3 py-1.5 rounded-md font-bold text-[10px] transition-all ${
                        subTab === 'community' ? 'bg-white dark:bg-slate-700 shadow text-brand-600 dark:text-brand-300' : 'text-slate-500'
                      }`}
                    >
                      👥 Çevre
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubTab('personal')}
                      className={`px-3 py-1.5 rounded-md font-bold text-[10px] transition-all ${
                        subTab === 'personal' ? 'bg-white dark:bg-slate-700 shadow text-brand-600 dark:text-brand-300' : 'text-slate-500'
                      }`}
                    >
                      👤 Benim
                    </button>
                  </div>

                  {/* Kategori Filtresi */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none"
                  >
                    <option value="All">Tüm Kategoriler</option>
                    <option value="Yol Bakım">🚧 Yol Bakım</option>
                    <option value="Su ve Kanalizasyon">💧 Su ve Kanalizasyon</option>
                    <option value="Aydınlatma">💡 Aydınlatma</option>
                    <option value="Atık Yönetimi">♻️ Atık Yönetimi</option>
                    <option value="Trafik ve Tabela">🛑 Trafik ve Tabela</option>
                    <option value="Çevre ve Parklar">🌳 Çevre ve Parklar</option>
                  </select>

                  {/* Mesafe Filtresi */}
                  <select
                    value={distanceLimit}
                    onChange={(e) => setDistanceLimit(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none"
                  >
                    <option value="All">📍 Tüm Mesafeler</option>
                    <option value="1.5">📍 Yakın (1.5 km)</option>
                    <option value="5.0">📍 Çevre (5 km)</option>
                    <option value="15.0">📍 Bölge (15 km)</option>
                    <option value="50.0">📍 Şehir (50 km)</option>
                  </select>
                </div>

                {/* Kaydırılabilir Kart Listesi */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-400 italic">
                      Gösterilecek kayıt bulunamadı.
                    </div>
                  ) : (
                    filteredReports.map((rep) => (
                      <div key={rep.id} className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/60 rounded-2xl p-4.5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="space-y-2.5">
                          
                          {/* Görsel (Unresolved arıza resmi için) */}
                          {rep.report_images?.[0]?.image_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(rep.report_images[0].image_url)}
                              className="h-40 w-full rounded-xl overflow-hidden border border-slate-200/50 bg-slate-100 group relative block focus:outline-none focus:ring-2 focus:ring-brand-500 text-left"
                            >
                              <img src={rep.report_images[0].image_url} alt="Arıza Resmi" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                <span className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-5xs font-black px-3 py-1.5 rounded-lg shadow-lg border border-slate-200/30 uppercase tracking-wider">🔎 Tam Ekran</span>
                              </div>
                            </button>
                          )}

                          <div className="flex justify-between items-center">
                            <span className={`px-1.8 py-0.5 text-5xs font-black uppercase tracking-wider rounded ${
                              rep.status === 'Yeni' ? 'bg-blue-50 text-blue-600' :
                              rep.status === 'Çözüldü' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {rep.status}
                            </span>
                            {rep.priority_score && (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.5 rounded">
                                🔥 Öncelik: {rep.priority_score}
                              </span>
                            )}
                          </div>

                          <h4 className="text-2xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                            {rep.title}
                          </h4>
                          <p className="text-3xs text-slate-500 leading-relaxed">
                            {rep.description}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">📍 {rep.address}</p>
                        </div>

                        {/* Çözülmüş İhbar İçin After Görseli */}
                        {rep.status === 'Çözüldü' && rep.resolved_image_url && (
                          <div className="p-2.5 bg-emerald-50/10 border border-emerald-100 rounded-xl space-y-1.5">
                            <span className="block text-[8px] font-bold text-emerald-500 uppercase">Onarım Sonu Görsel (Sonrası)</span>
                            <button
                              type="button"
                              onClick={() => setLightboxImage(rep.resolved_image_url)}
                              className="h-28 w-full rounded-lg overflow-hidden group relative block focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                            >
                              <img src={rep.resolved_image_url} alt="Sonrası" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                <span className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-5xs font-black px-3 py-1.5 rounded-lg shadow-lg border border-emerald-200/30 uppercase tracking-wider">🔎 Tam Ekran</span>
                              </div>
                            </button>
                          </div>
                        )}

                        {/* Footer & SLA & Upvote */}
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-3xs font-semibold text-slate-450">{rep.category}</span>
                            <CitizenSLACountdown report={rep} />
                          </div>
                          
                          {rep.status !== 'Çözüldü' && (
                            <button
                              type="button"
                              onClick={() => handleUpvote(rep.id)}
                              className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/20 dark:hover:bg-brand-950/40 text-4xs font-bold px-2.5 py-1.5 rounded-lg border border-brand-200/35"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              Doğrula ({rep.upvote_count || 0})
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Sağ Sütun: Harita Görünümü */}
              <div className="w-full lg:w-1/2 h-full rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 bg-white relative z-0 min-h-[300px]">
                <MapContainer
                  center={userGps}
                  zoom={14}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Kullanıcının Konumu (Mavi Pulsing Marker) */}
                  <Marker position={userGps} icon={L.divIcon({
                    html: `
                      <div class="relative flex items-center justify-center w-8 h-8">
                        <span class="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-40 animate-ping"></span>
                        <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-4xs shadow-md border-2 border-white">
                          🔵
                        </div>
                      </div>
                    `,
                    className: 'custom-citizen-icon',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  })}>
                    <Popup>
                      <div className="text-center font-bold text-3xs text-blue-600">Sizin Konumunuz (GPS)</div>
                    </Popup>
                  </Marker>

                  {/* Yakındakiler Arama Çemberi (Dynamic Radius) */}
                  {distanceLimit !== 'All' && (
                    <Circle
                      center={userGps}
                      radius={parseFloat(distanceLimit) * 1000}
                      pathOptions={{
                        fillColor: '#3b82f6',
                        fillOpacity: 0.08,
                        color: '#3b82f6',
                        weight: 1.5,
                        dashArray: '4, 4'
                      }}
                    />
                  )}

                  {/* İhbar Markerları */}
                  {filteredReports.map(rep => {
                    let colorClass = 'bg-amber-500 ring-amber-200';
                    if (rep.status === 'Çözüldü') colorClass = 'bg-emerald-500 ring-emerald-100';
                    else if (rep.priority === 'Acil') colorClass = 'bg-rose-600 ring-rose-200';
                    else if (rep.priority === 'Yüksek') colorClass = 'bg-orange-500 ring-orange-200';

                    return (
                      <Marker
                        key={`map-${rep.id}`}
                        position={[rep.latitude, rep.longitude]}
                        icon={L.divIcon({
                          html: `
                            <div class="relative flex items-center justify-center w-7 h-7">
                              <div class="relative flex items-center justify-center w-5.5 h-5.5 rounded-full ${colorClass} text-white font-bold text-4xs shadow-md border-2 border-white">
                                📍
                              </div>
                            </div>
                          `,
                          className: 'custom-report-icon',
                          iconSize: [28, 28],
                          iconAnchor: [14, 14],
                        })}
                      >
                        <Popup>
                          <div className="p-1 w-48 space-y-1.5 text-slate-800 dark:text-slate-100">
                            <span className="text-[7px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                              {rep.category}
                            </span>
                            <h4 className="text-3xs font-bold leading-tight">{rep.title}</h4>
                            
                            {rep.report_images?.[0]?.image_url && (
                              <img src={rep.report_images[0].image_url} alt="Görsel" className="h-16 w-full object-cover rounded" />
                            )}
                            
                            <p className="text-[8px] text-slate-500 leading-normal line-clamp-2">{rep.description}</p>
                            <div className="flex justify-between items-center border-t border-slate-100 pt-1 text-[8px] font-bold text-brand-650">
                              <span>Durum: {rep.status}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 transition-all duration-300 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={() => setLightboxImage(null)}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-all shadow-lg border border-white/10 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <img 
              src={lightboxImage} 
              alt="Görsel Önizleme" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-850/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
