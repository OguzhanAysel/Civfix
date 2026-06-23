import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { Hammer, CheckCircle, Clock, AlertTriangle, FileText, ArrowRight, Upload, MapPin } from 'lucide-react';

export default function WorkerView({ loginName, userId, reports, setReports }) {
  const [selectedRepId, setSelectedRepId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [workerProfile, setWorkerProfile] = useState(null);

  useEffect(() => {
    async function loadWorkerProfile() {
      if (userId) {
        try {
          const prof = await dbService.getProfile(userId);
          setWorkerProfile(prof);
        } catch (err) {
          console.error("Worker profile load error:", err);
        }
      }
    }
    loadWorkerProfile();
  }, [userId]);

  // Filter reports that are assigned to this worker's department
  const getWorkerReports = (allReps) => {
    return allReps.filter(r => {
      // If we don't have worker profile or department is 'Genel' or empty, show all assigned
      if (!workerProfile || !workerProfile.department || workerProfile.department === 'Genel') {
        return true;
      }
      
      const dept = workerProfile.department.toLowerCase();
      const team = r.assignments?.assigned_team?.toLowerCase() || '';
      
      // Check if team name contains key terms of the department
      if (dept.includes('yol') && team.includes('yol')) return true;
      if (dept.includes('su') && team.includes('su')) return true;
      if (dept.includes('aydınlatma') && team.includes('aydınlatma')) return true;
      if (dept.includes('atık') && team.includes('atık')) return true;
      if (dept.includes('trafik') && team.includes('trafik')) return true;
      if (dept.includes('çevre') && (team.includes('çevre') || team.includes('park') || team.includes('bahçe'))) return true;
      if (dept.includes('park') && (team.includes('çevre') || team.includes('park') || team.includes('bahçe'))) return true;
      
      return false;
    });
  };

  const myReports = getWorkerReports(reports);
  const assignedReports = myReports.filter(r => r.status === 'Atandı' || r.status === 'Sahada');
  const finishedReports = myReports.filter(r => r.status === 'Çözüldü' && r.assignments);

  const selectedReport = reports.find(r => r.id === selectedRepId);

  // SLA Time Helper
  const getSLAStatus = (report) => {
    if (!report.sla_deadline) return { label: 'Yok', color: 'text-slate-400' };
    const deadline = new Date(report.sla_deadline).getTime();
    const diff = deadline - Date.now();
    if (diff < 0) return { label: 'SLA Aşımı (Gecikme)', color: 'text-red-500 font-bold animate-pulse' };
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return { label: `${hours}s ${minutes}d kaldı`, color: 'text-amber-500 font-semibold' };
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRepId) return;
    try {
      await dbService.updateReportStatus(selectedRepId, status);
      // Add comments log
      await dbService.addComment(
        selectedRepId, 
        `Ekip durumu '${status}' olarak güncelledi. Görevli: ${loginName}`, 
        loginName, 
        false
      );
      const updated = await dbService.getReports();
      setReports(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedRepId) return;
    
    const selectEl = document.getElementById('workerResolvedImage');
    const imageUrl = selectEl ? selectEl.value : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500";
    
    try {
      // Resolve the report
      await dbService.resolveReport(selectedRepId, imageUrl);
      // Add comment note
      const note = resolutionNote.trim() || "Sorun başarıyla giderildi ve onarıldı.";
      await dbService.addComment(selectedRepId, `Çalışma Raporu: ${note} (Görevli: ${loginName})`, loginName, false);
      
      setResolutionNote('');
      setSelectedRepId(null);
      
      const updated = await dbService.getReports();
      setReports(updated);
      alert("Görev başarıyla tamamlandı ve kapatıldı!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      
      {/* Sol Liste: Görevler */}
      <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Aktif Saha Görevleriniz ({assignedReports.length})
            </h3>
            <p className="text-3xs text-slate-400 mt-1">Durumu güncellemek veya kapatmak için göreve tıklayın</p>
          </div>
          <button
            onClick={async () => {
              const updated = await dbService.getReports();
              setReports(updated);
            }}
            className="text-4xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-200/40 dark:border-slate-700/40 transition-colors"
          >
            Yenile
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {assignedReports.length === 0 ? (
            <div className="text-center py-20 text-xs text-slate-400 italic">
              Şu an üzerinize atanan aktif bir görev bulunmamaktadır.
            </div>
          ) : (
            assignedReports.map((rep) => {
              const sla = getSLAStatus(rep);
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedRepId(rep.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedRepId === rep.id
                      ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-950/10 shadow-sm'
                      : 'border-slate-250/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-1.8 py-0.5 text-5xs font-black uppercase rounded ${
                      rep.status === 'Atandı' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {rep.status}
                    </span>
                    <span className="text-5xs font-mono text-slate-400">#{rep.id.replace('rep-', '')}</span>
                  </div>

                  <h4 className="text-2xs font-bold text-slate-800 dark:text-slate-100 mt-2">
                    {rep.title}
                  </h4>
                  <p className="text-3xs text-slate-400 mt-1 line-clamp-2">{rep.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                    <span className="text-slate-500 font-semibold">{rep.category}</span>
                    <span className={sla.color}>{sla.label}</span>
                  </div>
                </div>
              );
            })
          )}

          {/* Tamamlanan Görevler Geçmişi */}
          {finishedReports.length > 0 && (
            <div className="pt-6 space-y-3">
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 pb-2">
                <span className="text-4xs font-black text-slate-400 uppercase tracking-widest">Tamamlanan Görev Geçmişi</span>
              </div>
              {finishedReports.map(rep => (
                <div key={rep.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-200/40 dark:border-slate-800/45 rounded-xl opacity-75">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-success-650 dark:text-success-400 font-bold">✓ Tamamlandı</span>
                    <span className="text-4xs text-slate-400">#{rep.id.replace('rep-', '')}</span>
                  </div>
                  <h5 className="text-3xs font-bold text-slate-700 dark:text-slate-200 mt-1">{rep.title}</h5>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sağ Liste: Görev Detayları ve Durum Değişikliği */}
      <div className="w-1/2 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/5 flex flex-col">
        {selectedReport ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm space-y-6 flex-1">
            
            {/* Header */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-3xs font-semibold px-2 py-0.5 rounded">
                  {selectedReport.category}
                </span>
                <span className="text-3xs font-bold text-slate-400">
                  Görev No: #{selectedReport.id.replace('rep-', '')}
                </span>
              </div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                {selectedReport.title}
              </h2>
              <div className="flex items-center gap-1.5 text-3xs text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span className="truncate">{selectedReport.address}</span>
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-2">
              <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">Vatandaş Açıklaması</span>
              <p className="text-2xs text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850/80 leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            {/* İhbar Fotoğrafı */}
            {selectedReport.report_images?.[0] && (
              <div className="space-y-2">
                <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">Arıza Görseli (Giriş)</span>
                <div className="h-40 w-full rounded-xl overflow-hidden border border-slate-200/50">
                  <img src={selectedReport.report_images[0].image_url} alt="Öncesi" className="h-full w-full object-cover" />
                </div>
              </div>
            )}

            {/* Durum Değiştirme Butonları */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
              <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">Çalışma Aşaması Güncelle</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('Sahada')}
                  disabled={selectedReport.status === 'Sahada'}
                  className={`flex items-center justify-center gap-1.5 font-bold text-2xs py-2.5 rounded-xl transition-all border ${
                    selectedReport.status === 'Sahada'
                      ? 'bg-purple-500/10 border-purple-200 text-purple-650 dark:text-purple-400 font-black cursor-default'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200'
                  }`}
                >
                  👷 Çalışmaya Başla (Sahada)
                </button>
                
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('Atandı')}
                  disabled={selectedReport.status === 'Atandı'}
                  className={`flex items-center justify-center gap-1.5 font-bold text-2xs py-2.5 rounded-xl transition-all border ${
                    selectedReport.status === 'Atandı'
                      ? 'bg-amber-500/10 border-amber-200 text-amber-600 dark:text-amber-400 font-black cursor-default'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200'
                  }`}
                >
                  ⏸️ Duraklat (Atandı)
                </button>
              </div>
            </div>

            {/* Kapatma Ekranı (Resolved Fotoğrafı) */}
            <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-5">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-4xs font-bold uppercase tracking-wider text-slate-400">Görevi Tamamla ve Çözümle</span>
              </div>

              <form onSubmit={handleResolve} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Onarım Sonu Görsel Seçin</label>
                  <select
                    id="workerResolvedImage"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500">🛣️ Düzeltilmiş Asfalt (Temiz Yol)</option>
                    <option value="https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=500">💡 Aydınlatılan Sokak (Aktif Lamba)</option>
                    <option value="https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500">🔧 Altyapı Boru Tamiratı (Su Arıza)</option>
                    <option value="https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=500">🌳 Temizlenmiş ve Düzenlenmiş Alan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Çözüm Raporu / Tamamlama Notu</label>
                  <input
                    type="text"
                    required
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Onarılan alan hakkında kısa bir rapor notu yazın..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-2xs py-2.5 rounded-xl shadow-md transition-all"
                >
                  <CheckCircle className="h-4 w-4" />
                  Görev Çözüldü, Kapat!
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-450 italic text-2xs">
            <Hammer className="h-12 w-12 text-slate-350 dark:text-slate-800 mb-3 animate-bounce" />
            Detaylarını görüntülemek ve işlem yapmak için sol taraftan bir görev seçin.
          </div>
        )}
      </div>

    </div>
  );
}
