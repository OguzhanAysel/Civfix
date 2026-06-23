import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Filter, Layers, Info, Trash2, Calendar } from 'lucide-react';

// Leaflet varsayılan marker görsel hatasını çözmek için Custom HTML (Tailwind) Pin tasarımı
const createCustomIcon = (priority, status) => {
  let colorClass = 'bg-success-600 ring-success-200';
  let pulseClass = '';

  if (status === 'Çözüldü') {
    colorClass = 'bg-emerald-500 ring-emerald-100';
  } else if (priority === 'Acil') {
    colorClass = 'bg-emergency-600 ring-emergency-200';
    pulseClass = 'animate-ping opacity-75';
  } else if (priority === 'Yüksek') {
    colorClass = 'bg-warning-650 ring-warning-200';
  } else if (priority === 'Normal') {
    colorClass = 'bg-amber-500 ring-amber-200';
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-7 h-7">
        <span class="absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-30 ${pulseClass}"></span>
        <div class="relative flex items-center justify-center w-5.5 h-5.5 rounded-full ${colorClass} text-white font-bold text-4xs shadow-md border-2 border-white dark:border-slate-900">
          📍
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export default function MapView({ reports, onStatusChange }) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isHeatmapView, setIsHeatmapView] = useState(false);

  // Ankara / Çankaya merkez koordinatları (Proje lokasyonu)
  const centerPosition = [39.8970, 32.7800];

  // Filtreleme mantığı
  const filteredReports = reports.filter(rep => {
    const matchesCat = filterCategory === 'All' || rep.category === filterCategory;
    const matchesPriority = filterPriority === 'All' || rep.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || rep.status === filterStatus;
    return matchesCat && matchesPriority && matchesStatus;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      
      {/* 1. Üst Filtreleme Paneli */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 z-10">
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.8 text-2xs font-bold text-slate-500 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <span>Filtreler:</span>
          </div>

          {/* Kategori Filtresi */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.8 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="All">Tüm Kategoriler</option>
            <option value="Yol Bakım">🚧 Yol Bakım</option>
            <option value="Su ve Kanalizasyon">💧 Su ve Kanalizasyon</option>
            <option value="Aydınlatma">💡 Aydınlatma</option>
            <option value="Atık Yönetimi">♻️ Atık Yönetimi</option>
            <option value="Trafik ve Tabela">🛑 Trafik ve Tabela</option>
            <option value="Çevre ve Parklar">🌳 Çevre ve Parklar</option>
          </select>

          {/* Öncelik Filtresi */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.8 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="All">Tüm Öncelikler</option>
            <option value="Düşük">Düşük</option>
            <option value="Normal">Normal</option>
            <option value="Yüksek">Yüksek</option>
            <option value="Acil">Acil</option>
          </select>

          {/* Durum Filtresi */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.8 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="All">Tüm Durumlar</option>
            <option value="Yeni">Yeni</option>
            <option value="İnceleniyor">İnceleniyor</option>
            <option value="Atandı">Atandı</option>
            <option value="Sahada">Sahada</option>
            <option value="Çözüldü">Çözüldü</option>
          </select>

          {/* Temizle Butonu */}
          {(filterCategory !== 'All' || filterPriority !== 'All' || filterStatus !== 'All') && (
            <button
              onClick={() => {
                setFilterCategory('All');
                setFilterPriority('All');
                setFilterStatus('All');
              }}
              className="flex items-center gap-1 text-3xs font-semibold text-emergency-600 dark:text-emergency-400 hover:underline"
            >
              <Trash2 className="h-3 w-3" />
              Sıfırla
            </button>
          )}
        </div>

        {/* Isı Haritası Katmanı Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHeatmapView(!isHeatmapView)}
            className={`flex items-center gap-2 px-3.5 py-1.8 rounded-lg text-2xs font-bold border transition-all ${
              isHeatmapView
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Isı Haritası (Heatmap): {isHeatmapView ? 'Açık' : 'Kapalı'}</span>
          </button>
        </div>

      </div>

      {/* 2. Harita Alanı */}
      <div className="flex-1 w-full relative z-0">
        
        {/* Harita Göstergesi (Legend) */}
        <div className="absolute bottom-6 left-6 z-[1000] rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-lg dark:border-slate-800/80 dark:bg-slate-900/95 backdrop-blur-sm">
          <h5 className="text-3xs font-bold uppercase tracking-wider text-slate-400">Harita Lejantı</h5>
          <div className="mt-2.5 space-y-2 text-4xs font-bold text-slate-650 dark:text-slate-300">
            {isHeatmapView ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emergency-650 animate-pulse inline-block"></span>
                  <span>Çok Yoğun Arıza Bölgesi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-warning-500 inline-block"></span>
                  <span>Orta Yoğun Arıza Bölgesi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-success-500 inline-block"></span>
                  <span>Düşük Yoğun / Çözülmüş Alan</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emergency-600 border border-white inline-block"></span>
                  <span>Acil İhbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-warning-650 border border-white inline-block"></span>
                  <span>Yüksek Öncelik</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 border border-white inline-block"></span>
                  <span>Normal Öncelik</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 border border-white inline-block"></span>
                  <span>Çözülmüş İhbar</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Harita Konteyneri */}
        <MapContainer 
          center={centerPosition} 
          zoom={14} 
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap Standart Harita Katmanı */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Isı Haritası Katmanı Simülasyonu */}
          {isHeatmapView && (
            filteredReports.map(rep => {
              let color = '#fab005'; // Normal
              let radius = 150;
              if (rep.priority === 'Acil') {
                color = '#e03131'; // Acil
                radius = 220;
              } else if (rep.status === 'Çözüldü') {
                color = '#37b24d'; // Çözülmüş
                radius = 80;
              }
              
              return (
                <Circle
                  key={`heat-${rep.id}`}
                  center={[rep.latitude, rep.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.25,
                    color: color,
                    weight: 1,
                    className: 'heatmap-pulse'
                  }}
                />
              );
            })
          )}

          {/* Pinler ve Detay Baloncukları (Popups) */}
          {!isHeatmapView && (
            filteredReports.map(rep => (
              <Marker
                key={rep.id}
                position={[rep.latitude, rep.longitude]}
                icon={createCustomIcon(rep.priority, rep.status)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1.5 w-64 space-y-2 text-slate-800 dark:text-slate-100">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-5xs font-bold uppercase tracking-wider ${
                        rep.priority === 'Acil' ? 'bg-emergency-50 text-emergency-600' :
                        rep.priority === 'Yüksek' ? 'bg-warning-50 text-warning-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {rep.priority} Öncelik
                      </span>
                      <span className="text-4xs text-slate-400 font-semibold">
                        #{rep.id.replace('rep-', '')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold leading-tight">{rep.title}</h4>
                    <p className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-2">{rep.description}</p>
                    
                    {/* Görsel Önizleme */}
                    {rep.report_images && rep.report_images[0] && (
                      <div className="h-24 w-full rounded-lg overflow-hidden border border-slate-200/50 mt-1.5 bg-slate-100">
                        <img 
                          src={rep.report_images[0].image_url} 
                          alt="Arıza Resmi" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-4xs text-slate-400 font-semibold">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-5xs text-slate-400 font-semibold">Durum</span>
                        <span className="text-3xs font-extrabold text-brand-600 dark:text-brand-400">{rep.status}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {rep.status !== 'Çözüldü' && (
                          <button
                            onClick={() => onStatusChange(rep.id, 'Çözüldü')}
                            className="bg-success-600 hover:bg-success-700 text-white font-bold text-5xs px-2 py-1 rounded"
                          >
                            Çözüldü İşaretle
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))
          )}

        </MapContainer>
      </div>

    </div>
  );
}
