import React, { useState, useEffect } from 'react';
import { Calendar, User, UserCheck, MessageSquare, Plus, FileText, ArrowRight, X, Sparkles, Send, CheckCircle } from 'lucide-react';
import { dbService } from '../../services/dbService';

function BeforeAfterSlider({ beforeUrl, afterUrl }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  return (
    <div className="space-y-2">
      <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">Çözüm Öncesi / Sonrası Karşılaştırması</span>
      <div className="relative h-48 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 select-none">
        {/* After Image (Full background) */}
        <img 
          src={afterUrl} 
          alt="Sonrası" 
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Before Image (Clipped by width) */}
        <div 
          className="absolute inset-0 h-full overflow-hidden border-r border-white/80 shadow-md"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={beforeUrl} 
            alt="Öncesi" 
            className="absolute inset-0 h-full w-full object-cover"
            style={{ width: '100%', maxWidth: 'none', height: '100%' }}
          />
          <div className="absolute top-2 left-2 bg-red-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-20">
            ÖNCESİ (İHBAR)
          </div>
        </div>
        
        {/* Label for AFTER */}
        <div className="absolute top-2 right-2 bg-emerald-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-20">
          SONRASI (ÇÖZÜM)
        </div>

        {/* Input Range Slider overlay */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={sliderPosition} 
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
        />

        {/* Custom Slider handle line & button */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-200">
            <span className="text-[10px] text-slate-450 font-bold font-mono">↔</span>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-center text-slate-400">Görselleri karşılaştırmak için slider'ı sürükleyin</p>
    </div>
  );
}

export default function KanbanBoard({ reports, setReports, loginName }) {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [assigneeTeam, setAssigneeTeam] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [comments, setComments] = useState([]);
  const [citizenProfile, setCitizenProfile] = useState(null);

  // 1. Kanban Sütun Tanımları
  const COLUMNS = [
    { id: 'Yeni', name: 'Yeni İhbarlar', color: 'border-blue-400 bg-blue-50/20 dark:bg-blue-950/10' },
    { id: 'İnceleniyor', name: 'İnceleniyor', color: 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10' },
    { id: 'Atandı', name: 'Teknik Ekibe Atandı', color: 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10' },
    { id: 'Sahada', name: 'Ekipler Sahada', color: 'border-purple-400 bg-purple-50/20 dark:bg-purple-950/10' },
    { id: 'Çözüldü', name: 'Çözüldü / Kapatıldı', color: 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10' }
  ];

  // 2. Drag & Drop Yönetimi (HTML5 Standardı)
  const handleDragStart = (e, reportId) => {
    e.dataTransfer.setData('text/plain', reportId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnId) => {
    const reportId = e.dataTransfer.getData('text/plain');
    if (!reportId) return;

    try {
      await dbService.updateReportStatus(reportId, columnId);
      const updatedReports = await dbService.getReports();
      setReports(updatedReports);
    } catch (err) {
      console.error("Durum güncelleme hatası:", err);
    }
  };

  // Seçili İhbar Detayları
  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Yorumlar ve Profil Yükleme
  useEffect(() => {
    async function loadDetails() {
      if (selectedReportId) {
        try {
          const coms = await dbService.getComments(selectedReportId);
          setComments(coms);

          const rep = reports.find(r => r.id === selectedReportId);
          if (rep && rep.citizen_id) {
            const profile = await dbService.getProfile(rep.citizen_id);
            setCitizenProfile(profile);
          } else {
            setCitizenProfile(null);
          }
        } catch (err) {
          console.error("Detay yükleme hatası:", err);
        }
      }
    }
    loadDetails();
  }, [selectedReportId, reports]);

  // Yorum Ekleme Handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedReportId) return;

    try {
      await dbService.addComment(selectedReportId, commentText, loginName || "Belediye Operatörü", false);
      setCommentText('');
      const coms = await dbService.getComments(selectedReportId);
      setComments(coms);
    } catch (err) {
      console.error("Yorum ekleme hatası:", err);
    }
  };

  // Ekip Atama Handler
  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!assigneeTeam.trim() || !selectedReportId) return;

    try {
      await dbService.assignTeam(selectedReportId, assigneeTeam, assignmentNotes);
      setAssigneeTeam('');
      setAssignmentNotes('');
      const updatedReports = await dbService.getReports();
      setReports(updatedReports);
    } catch (err) {
      console.error("Ekip atama hatası:", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Kanban Sütunları */}
      <div className="flex-1 flex gap-5 overflow-x-auto p-6 items-start">
        {COLUMNS.map(col => {
          const colReports = reports.filter(r => r.status === col.id);
          
          return (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="w-72 shrink-0 flex flex-col max-h-full"
            >
              
              {/* Sütun Başlığı */}
              <div className={`flex items-center justify-between px-4 py-3 border-t-3 ${col.color} rounded-t-xl bg-white dark:bg-slate-900 border-x border-slate-200/50 dark:border-slate-800/50`}>
                <span className="text-2xs font-bold text-slate-800 dark:text-slate-100">{col.name}</span>
                <span className="text-4xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                  {colReports.length}
                </span>
              </div>

              {/* Sütun Kart Listesi */}
              <div className="flex-1 overflow-y-auto p-2 bg-slate-100/50 dark:bg-slate-900/30 rounded-b-xl border-x border-b border-slate-200/50 dark:border-slate-800/50 space-y-3 min-h-[300px]">
                {colReports.map(rep => (
                  <div
                    key={rep.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, rep.id)}
                    onClick={() => setSelectedReportId(rep.id)}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none space-y-3"
                  >
                    
                    {/* Öncelik Etiketi, Skor ve İhbar No */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-5xs font-black uppercase tracking-wider ${
                          rep.priority === 'Acil' ? 'bg-emergency-50 text-emergency-600' :
                          rep.priority === 'Yüksek' ? 'bg-warning-50 text-warning-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {rep.priority}
                        </span>
                        {rep.priority_score && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.5 rounded">
                            🔥 {rep.priority_score}
                          </span>
                        )}
                        {rep.upvote_count > 0 && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1 py-0.5 rounded">
                            👍 {rep.upvote_count}
                          </span>
                        )}
                      </div>
                      <span className="text-5xs text-slate-400 font-bold">
                        #{rep.id.replace('rep-', '')}
                      </span>
                    </div>

                    {/* Başlık ve Açıklama */}
                    <div className="space-y-1">
                      <h4 className="text-2xs font-bold text-slate-850 dark:text-slate-100 line-clamp-1">
                        {rep.title}
                      </h4>
                      <p className="text-3xs text-slate-400 line-clamp-2 leading-relaxed">
                        {rep.description}
                      </p>
                    </div>

                    {/* Kategori Etiketi ve SLA */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-3xs font-semibold text-slate-500 dark:text-slate-400">
                          {rep.category}
                        </span>
                        {rep.status !== 'Çözüldü' && rep.sla_deadline && (
                          <span className="text-[8px] font-medium text-slate-400">
                            SLA: {new Date(rep.sla_deadline).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <span className="text-5xs text-slate-400">
                        {new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                ))}

                {colReports.length === 0 && (
                  <div className="py-12 text-center text-4xs text-slate-400 italic">
                    Kartı buraya sürükleyin
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Yan Detay Paneli (Slide-Out Panel) */}
      {selectedReport && (
        <div className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full z-20 animate-in slide-in-from-right duration-250">
          
          {/* Panel Başlığı */}
          <div className="flex items-center justify-between p-4.5 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-5xs font-bold uppercase tracking-wider text-slate-400">Arıza Detayları</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                İhbar #{selectedReport.id.replace('rep-', '')}
              </span>
            </div>
            <button 
              onClick={() => setSelectedReportId(null)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Panel İçeriği (Kaydırılabilir) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* 1. Başlık, Kategori ve Öncelik */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-150 leading-snug">
                {selectedReport.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-3xs font-semibold px-2 py-0.5 rounded">
                  {selectedReport.category}
                </span>
                <span className={`text-3xs font-bold px-2 py-0.5 rounded ${
                  selectedReport.priority === 'Acil' ? 'bg-emergency-50 text-emergency-600' :
                  selectedReport.priority === 'Yüksek' ? 'bg-warning-50 text-warning-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {selectedReport.priority} Öncelik
                </span>
              </div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                {selectedReport.description}
              </p>
              <div className="text-4xs text-slate-400 space-y-0.5">
                <div><span className="font-bold">Konum:</span> {selectedReport.address || `${selectedReport.latitude.toFixed(4)}, ${selectedReport.longitude.toFixed(4)}`}</div>
                {selectedReport.sla_deadline && (
                  <div>
                    <span className="font-bold">SLA Çözüm Hedefi:</span>{' '}
                    <span className="font-semibold text-rose-600 dark:text-rose-450">
                      {new Date(selectedReport.sla_deadline).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Dinamik Öncelik Skor Motoru ve Vatandaş Bilgileri */}
            <div className="space-y-3">
              {/* Vatandaş Güven Skoru */}
              {citizenProfile && (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">İhbarı Açan Vatandaş</span>
                    <h5 className="text-2xs font-black text-slate-800 dark:text-slate-200 truncate">{citizenProfile.full_name}</h5>
                    <p className="text-3xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-brand-650 dark:text-brand-400">{citizenProfile.badge || 'Yeni Vatandaş'}</span>
                      <span>•</span>
                      <span>Güven Skoru: <b className="text-slate-700 dark:text-slate-100">{citizenProfile.trust_score || 100}</b></span>
                    </p>
                  </div>
                </div>
              )}

              {/* Öncelik Skoru Gelişmiş Grafiği */}
              <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-4 dark:border-rose-950/60 dark:bg-rose-950/25 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-2xs font-extrabold text-rose-750 dark:text-rose-300">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-rose-500 animate-pulse" />
                    <span>Öncelik Skor Motoru (Upvote + Yoğunluk)</span>
                  </div>
                  <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-3xs font-black px-2 py-0.5 rounded-full">
                    {selectedReport.priority_score || 50}/100
                  </span>
                </div>
                
                <div className="space-y-1.5 text-3xs">
                  <div className="h-2.5 w-full rounded-full bg-slate-150 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        (selectedReport.priority_score || 50) >= 80 ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                        (selectedReport.priority_score || 50) >= 50 ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                        'bg-gradient-to-r from-emerald-500 to-amber-500'
                      }`}
                      style={{ width: `${selectedReport.priority_score || 50}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Oylama (Upvote): {selectedReport.upvote_count || 0} doğrulama</span>
                    <span>AI Kategori: {selectedReport.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Görsel Alanı (Comparison / Before After) */}
            {selectedReport.status === 'Çözüldü' && selectedReport.resolved_image_url ? (
              /* Before / After comparison slider */
              <BeforeAfterSlider 
                beforeUrl={selectedReport.report_images?.[0]?.image_url || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500"} 
                afterUrl={selectedReport.resolved_image_url} 
              />
            ) : (
              /* Single Before Image */
              selectedReport.report_images && selectedReport.report_images[0] && (
                <div className="space-y-1.8">
                  <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">Eklenen Görsel (Öncesi)</span>
                  <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200/50 bg-slate-100 relative group">
                    <img 
                      src={selectedReport.report_images[0].image_url} 
                      alt="Arıza Resmi" 
                      className="h-full w-full object-cover"
                    />
                    {selectedReport.report_images[0].ai_label && (
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-5xs px-2 py-0.8 rounded-lg font-semibold border border-white/10">
                        AI Sınıflandırma: {selectedReport.report_images[0].ai_label} (%{selectedReport.report_images[0].ai_confidence})
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* 4. Teknik Ekip Atama Formu */}
            {selectedReport.status !== 'Çözüldü' && (
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-4.5">
                <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">Saha Ekibi Atama</span>
                <form onSubmit={handleAssignTeam} className="space-y-3">
                  <div>
                    <select
                      value={assigneeTeam}
                      onChange={(e) => setAssigneeTeam(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Ekip Seçin...</option>
                      <option value="Yol Bakım 1. Bölge Timi">🚧 Yol Bakım 1. Bölge Timi</option>
                      <option value="Su Arıza Acil Müdahale B">💧 Su Arıza Acil Müdahale B</option>
                      <option value="Elektrik ve Aydınlatma Grubu 3">💡 Elektrik ve Aydınlatma Grubu 3</option>
                      <option value="Atık ve Çevre Temizlik Timi">♻️ Atık ve Çevre Temizlik Timi</option>
                      <option value="Trafik Sinyalizasyon Ekip A">🛑 Trafik Sinyalizasyon Ekip A</option>
                      <option value="Park/Bahçe Bakım Timi">🌳 Park/Bahçe Bakım Timi</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Ekip için atama notları..."
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-2xs py-2 rounded-lg shadow-sm transition-all"
                  >
                    <UserCheck className="h-4 w-4" />
                    Görevlendir ve Durumu Güncelle
                  </button>
                </form>
              </div>
            )}

            {/* 5. İhbarı Çözüldü Olarak İşaretle (Çözüm Fotoğrafı Yükleme Simülasyonu) */}
            {selectedReport.status !== 'Çözüldü' && (
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-4.5">
                <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">İhbarı Çözüldü Olarak Kapat</span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Onarım Sonu Tamamlanan Görsel</label>
                    <select
                      id="resolvedImageSelect"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      defaultValue="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=60"
                    >
                      <option value="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=60">🛣️ Onarılmış Asfalt (Yol Bakım)</option>
                      <option value="https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=500&auto=format&fit=crop&q=60">💡 Çalışan Sokak Lambası (Aydınlatma)</option>
                      <option value="https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop&q=60">🔧 Tamamlanmış Altyapı Borusu (Su/Kanalizasyon)</option>
                      <option value="https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=500&auto=format&fit=crop&q=60">🌳 Temizlenmiş Park/Bahçe Alanı</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const selectEl = document.getElementById('resolvedImageSelect');
                      const imageUrl = selectEl ? selectEl.value : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=60";
                      try {
                        await dbService.resolveReport(selectedReport.id, imageUrl);
                        const updated = await dbService.getReports();
                        setReports(updated);
                      } catch (err) {
                        console.error("Çözümleme hatası:", err);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xs py-2 rounded-lg shadow-sm transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Çözüldü Olarak İşaretle (Güven Skoru +5)
                  </button>
                </div>
              </div>
            )}

            {/* 6. İş Atama Detayları */}
            {selectedReport.assignments && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/20 space-y-1.5 text-3xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Atanan Ekip:</span>
                  <span className="font-black text-brand-600 dark:text-brand-400">{selectedReport.assignments.assigned_team}</span>
                </div>
                {selectedReport.assignments.notes && (
                  <div className="text-4xs italic">
                    Not: "{selectedReport.assignments.notes}"
                  </div>
                )}
                <div className="text-4xs text-slate-400 text-right">
                  Atama Zamanı: {new Date(selectedReport.assignments.assigned_at).toLocaleString()}
                </div>
              </div>
            )}

            {/* 7. Yorum Yazışma Alanı (Timeline / Comments) */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4.5">
              <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">İhbar Yazışmaları ve İlerleme</span>
              
              {/* Yorum Listesi */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {comments && comments.length > 0 ? (
                  comments.map(c => (
                    <div key={c.id} className={`p-3 rounded-lg border space-y-1 text-3xs ${
                      c.is_internal 
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50' 
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-850'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {c.user_name || (c.user_id ? 'Vatandaş' : 'Belediye Ekibi')}
                        </span>
                        <span className="text-4xs text-slate-400">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-350">{c.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-4xs text-slate-400 italic text-center py-4">Bu ihbar için henüz bir yazışma bulunmuyor</div>
                )}
              </div>

              {/* Yorum Ekleme Formu */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yazışma ekleyin..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.8 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
