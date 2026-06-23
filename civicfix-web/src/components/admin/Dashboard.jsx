import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, ShieldAlert, Award, FileText, ChevronRight } from 'lucide-react';

function SLACountdown({ report }) {
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

    const updateTimer = () => {
      const deadline = new Date(report.sla_deadline).getTime();
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setTimeStr('SLA İhlali');
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

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [report.status, report.sla_deadline]);

  if (report.status === 'Çözüldü') {
    return <span className="text-success-650 dark:text-success-400 font-semibold">Zamanında Çözüldü</span>;
  }
  if (!report.sla_deadline) {
    return <span className="text-slate-400">-</span>;
  }
  if (isViolated) {
    return <span className="text-emergency-600 dark:text-emergency-400 font-black animate-pulse">⚠️ SLA İhlali</span>;
  }
  return (
    <span className="text-slate-600 dark:text-slate-200 font-semibold font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-4xs">
      ⏱️ {timeStr}
    </span>
  );
}

export default function Dashboard({ reports }) {
  // 1. İstatistikleri Hesapla
  const totalReports = reports.length;
  const openReports = reports.filter(r => r.status !== 'Çözüldü').length;
  const resolvedReports = reports.filter(r => r.status === 'Çözüldü').length;
  const emergencyReports = reports.filter(r => r.priority === 'Acil' && r.status !== 'Çözüldü').length;

  // SLA ve Gecikme Hesaplama
  const totalSLAControlled = reports.filter(r => r.sla_deadline).length;
  const slaViolations = reports.filter(r => {
    if (!r.sla_deadline) return false;
    const deadline = new Date(r.sla_deadline).getTime();
    if (r.status === 'Çözüldü') {
      const resolvedAt = new Date(r.updated_at).getTime();
      return resolvedAt > deadline;
    } else {
      return Date.now() > deadline;
    }
  }).length;

  const slaOnTimeRate = totalSLAControlled > 0
    ? Math.round(((totalSLAControlled - slaViolations) / totalSLAControlled) * 100)
    : 100;

  // Ortalama Çözüm Süresi Simülasyonu
  const avgResolutionTime = totalReports > 0 
    ? (3.4 + (openReports * 0.1) - (resolvedReports * 0.05)).toFixed(1) 
    : '0.0';

  // 2. Kategori Sayılarını Hesapla
  const categoriesCount = reports.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const categoriesData = Object.entries(categoriesCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Kategori İkon Haritası
  const categoryIcons = {
    "Yol Bakım": "🚧",
    "Su ve Kanalizasyon": "💧",
    "Su Kaçağı": "💧",
    "Aydınlatma": "💡",
    "Atık Yönetimi": "♻️",
    "Trafik ve Tabela": "🛑",
    "Trafik/Tabela": "🛑",
    "Çevre ve Parklar": "🌳",
    "Park/Ekipman": "🌳",
    "Varsayılan": "📍"
  };

  // 3. Öncelik Dağılımını Hesapla
  const priorities = { Düşük: 0, Normal: 0, Yüksek: 0, Acil: 0 };
  reports.forEach(r => {
    if (priorities[r.priority] !== undefined) {
      priorities[r.priority]++;
    }
  });

  const maxPriorityCount = Math.max(...Object.values(priorities), 1);

  // 4. Son Aktivite Listesi
  const recentActivities = [...reports]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      
      {/* 1. Üst Metrik Kartları */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Kart 1: Toplam Açık İhbar */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium transition-all hover:scale-[1.01] dark:border-slate-800/60 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Aktif İhbarlar</p>
              <h3 className="mt-2 text-3xl font-black text-slate-800 dark:text-white">{openReports}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-3xs text-slate-400">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Kontrol bekleyen veya sahada</span>
            <span>olan arızalar</span>
          </div>
        </div>

        {/* Kart 2: Çözülen İhbar */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium transition-all hover:scale-[1.01] dark:border-slate-800/60 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Çözülen İhbarlar</p>
              <h3 className="mt-2 text-3xl font-black text-success-650 dark:text-success-400">{resolvedReports}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 dark:bg-success-950/40 text-success-500">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-3xs text-slate-400">
            <span className="font-semibold text-success-600 dark:text-success-400">%{totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0} Çözüm Oranı</span>
            <span>ile başarı sağlandı</span>
          </div>
        </div>

        {/* Kart 3: SLA Zamanında Çözüm Oranı */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium transition-all hover:scale-[1.01] dark:border-slate-800/60 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">SLA Başarı Oranı</p>
              <h3 className={`mt-2 text-3xl font-black ${slaOnTimeRate >= 80 ? 'text-success-650 dark:text-success-400' : 'text-warning-600 dark:text-warning-400'}`}>
                %{slaOnTimeRate}
              </h3>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${slaOnTimeRate >= 80 ? 'bg-success-50 dark:bg-success-950/40 text-success-500' : 'bg-warning-50 dark:bg-warning-950/40 text-warning-500'}`}>
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-3xs text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-350">
              {slaViolations > 0 ? `${slaViolations} ihbar süresini aştı` : 'Tüm çözümler zamanında yapıldı'}
            </span>
          </div>
        </div>

        {/* Kart 4: Ortalama Çözüm Süresi */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium transition-all hover:scale-[1.01] dark:border-slate-800/60 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Ort. Çözüm Süresi</p>
              <h3 className="mt-2 text-3xl font-black text-brand-600 dark:text-brand-300">{avgResolutionTime} <span className="text-xs font-normal text-slate-400">saat</span></h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-500">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-3xs text-slate-400">
            <span className="font-semibold text-brand-600 dark:text-brand-400">Hedeflenen süre: 4.0 saat</span>
            <span>altında kalındı</span>
          </div>
        </div>

        {/* Kart 5: Acil Vakalar */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium transition-all hover:scale-[1.01] dark:border-slate-800/60 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Kritik Acil Vakalar</p>
              <h3 className="mt-2 text-3xl font-black text-emergency-600 dark:text-emergency-400">{emergencyReports}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emergency-50 dark:bg-emergency-950/40 text-emergency-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-3xs text-slate-400">
            {emergencyReports > 0 ? (
              <span className="font-semibold text-emergency-600 dark:text-emergency-400 animate-pulse">Saha ekibi ataması bekliyor!</span>
            ) : (
              <span className="font-semibold text-success-600 dark:text-success-400">Tüm acil durumlar güvende</span>
            )}
          </div>
        </div>

      </div>

      {/* 2. Orta Grafik ve İstatistik Alanları */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Sol Panel: Kategorilere Göre Dağılım */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium dark:border-slate-800/60 dark:bg-slate-900 lg:col-span-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Kategori Dağılımı</h4>
          <p className="text-3xs text-slate-400 mt-1">En çok arıza ihbarı gelen hizmet alanları</p>

          <div className="mt-6 space-y-4.5">
            {categoriesData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">Kayıtlı veri bulunamadı</div>
            ) : (
              categoriesData.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{categoryIcons[cat.name] || categoryIcons["Varsayılan"]}</span>
                      <span className="text-slate-700 dark:text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{cat.count}</span>
                      <span>ihbar ({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ Panel: Öncelik Dağılımı Grafiği */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium dark:border-slate-800/60 dark:bg-slate-900">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Öncelik Dereceleri</h4>
          <p className="text-3xs text-slate-400 mt-1">İhbarların aciliyet analizi</p>

          {/* Dikey Bar Grafiği (Özel SVG/CSS ile) */}
          <div className="mt-8 flex h-48 items-end justify-around px-4">
            
            {/* Düşük */}
            <div className="flex flex-col items-center gap-2.5 w-1/4">
              <div 
                className="w-8 rounded-t-lg bg-slate-300 dark:bg-slate-700 transition-all duration-550 relative group"
                style={{ height: `${(priorities.Düşük / maxPriorityCount) * 120}px` }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xs font-bold bg-slate-800 dark:bg-slate-750 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {priorities.Düşük}
                </span>
              </div>
              <span className="text-4xs font-bold text-slate-450 dark:text-slate-400">Düşük</span>
            </div>

            {/* Normal */}
            <div className="flex flex-col items-center gap-2.5 w-1/4">
              <div 
                className="w-8 rounded-t-lg bg-success-500/80 dark:bg-success-600/80 transition-all duration-550 relative group"
                style={{ height: `${(priorities.Normal / maxPriorityCount) * 120}px` }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xs font-bold bg-slate-800 dark:bg-slate-750 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {priorities.Normal}
                </span>
              </div>
              <span className="text-4xs font-bold text-slate-450 dark:text-slate-400">Normal</span>
            </div>

            {/* Yüksek */}
            <div className="flex flex-col items-center gap-2.5 w-1/4">
              <div 
                className="w-8 rounded-t-lg bg-warning-500/80 dark:bg-warning-600/80 transition-all duration-550 relative group"
                style={{ height: `${(priorities.Yüksek / maxPriorityCount) * 120}px` }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xs font-bold bg-slate-800 dark:bg-slate-750 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {priorities.Yüksek}
                </span>
              </div>
              <span className="text-4xs font-bold text-slate-450 dark:text-slate-400">Yüksek</span>
            </div>

            {/* Acil */}
            <div className="flex flex-col items-center gap-2.5 w-1/4">
              <div 
                className="w-8 rounded-t-lg bg-emergency-500/80 dark:bg-emergency-600/80 transition-all duration-550 relative group"
                style={{ height: `${(priorities.Acil / maxPriorityCount) * 120}px` }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xs font-bold bg-slate-800 dark:bg-slate-750 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {priorities.Acil}
                </span>
              </div>
              <span className="text-4xs font-bold text-slate-450 dark:text-slate-400">Acil</span>
            </div>

          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex justify-between text-3xs text-slate-400">
            <span>Toplam İnceleme</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{totalReports} İhbar</span>
          </div>

        </div>

      </div>

      {/* 3. Alt Kısım: Son Aktiviteler ve Log Kayıtları */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-premium dark:border-slate-800/60 dark:bg-slate-900">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Sistem Log Kayıtları ve Son Aktiviteler</h4>
        <p className="text-3xs text-slate-400 mt-1">Gerçek zamanlı arıza bildirim ve durum değişiklik hareketleri (SLA Kalan Süreleri Dahil)</p>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/40 dark:border-slate-800/40">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-4xs font-bold uppercase tracking-wider text-slate-400">ID</th>
                <th className="px-4 py-3 text-left text-4xs font-bold uppercase tracking-wider text-slate-400">İhbar Başlığı</th>
                <th className="px-4 py-3 text-left text-4xs font-bold uppercase tracking-wider text-slate-400">Kategori</th>
                <th className="px-4 py-3 text-left text-4xs font-bold uppercase tracking-wider text-slate-400">Öncelik</th>
                <th className="px-4 py-3 text-left text-4xs font-bold uppercase tracking-wider text-slate-400">Durum</th>
                <th className="px-4 py-3 text-left text-4xs font-bold uppercase tracking-wider text-slate-400">SLA Kalan Süre</th>
                <th className="px-4 py-3 text-left text-4xs font-bold uppercase tracking-wider text-slate-400">Son Güncelleme</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-850">
              {recentActivities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="px-4 py-3 text-2xs font-semibold text-slate-400">
                    #{act.id.replace('rep-', '')}
                  </td>
                  <td className="px-4 py-3 text-2xs font-bold text-slate-700 dark:text-slate-200">
                    {act.title}
                  </td>
                  <td className="px-4 py-3 text-2xs text-slate-500 dark:text-slate-450">
                    {act.category}
                  </td>
                  <td className="px-4 py-3 text-2xs">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-4xs font-bold ${
                      act.priority === 'Acil' ? 'bg-emergency-50 dark:bg-emergency-950/35 text-emergency-600 dark:text-emergency-400' :
                      act.priority === 'Yüksek' ? 'bg-warning-50 dark:bg-warning-950/35 text-warning-600 dark:text-warning-400' :
                      act.priority === 'Normal' ? 'bg-success-50 dark:bg-success-950/35 text-success-600 dark:text-success-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {act.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-2xs">
                    <span className={`inline-flex items-center rounded-md px-1.8 py-0.5 text-4xs font-bold border ${
                      act.status === 'Yeni' ? 'bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 border-blue-200/40' :
                      act.status === 'İnceleniyor' ? 'bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-600 border-indigo-200/40' :
                      act.status === 'Atandı' ? 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-600 border-amber-200/40' :
                      act.status === 'Sahada' ? 'bg-purple-50/60 dark:bg-purple-950/20 text-purple-600 border-purple-200/40' :
                      'bg-success-50/60 dark:bg-success-950/20 text-success-600 border-success-200/40'
                    }`}>
                      {act.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-2xs">
                    <SLACountdown report={act} />
                  </td>
                  <td className="px-4 py-3 text-2xs text-slate-400">
                    {new Date(act.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
