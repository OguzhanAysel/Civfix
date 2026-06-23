import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Briefcase, Phone, Award, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { dbService } from '../../services/dbService';

const DEPARTMENTS = [
  'Yol Bakım',
  'Su ve Kanalizasyon',
  'Aydınlatma',
  'Atık Yönetimi',
  'Trafik ve Tabela',
  'Çevre ve Parklar',
  'Genel'
];

export default function TeamsManagement() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Verileri çek
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dbService.getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error("Çalışan listesi çekilemedi:", err);
      setError(err.message || "Çalışan listesi yüklenirken beklenmedik bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Departman Güncelleme
  const handleDepartmentChange = async (workerId, newDept) => {
    try {
      setUpdatingId(workerId);
      setError(null);
      setSuccessMsg(null);
      
      await dbService.updateWorkerDepartment(workerId, newDept);
      
      // State'i güncelle
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, department: newDept } : w));
      
      setSuccessMsg("Görev birimi başarıyla güncellendi.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Görev birimi güncellenemedi:", err);
      setError(err.message || "Birim güncellenirken hata oluştu.");
    } finally {
      setUpdatingId(null);
    }
  };

  // İstatistikler
  const totalWorkers = workers.length;
  
  // En aktif birim (en çok çalışanı olan)
  const deptCounts = workers.reduce((acc, curr) => {
    const dept = curr.department || 'Genel';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  
  let topDept = 'Yok';
  let maxCount = 0;
  Object.entries(deptCounts).forEach(([dept, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topDept = dept;
    }
  });


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Sayfa Başlığı ve Açıklaması */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-350 bg-clip-text text-transparent flex items-center gap-2.5">
            <Users className="h-7 w-7 text-brand-500" />
            Saha Ekipleri Yönetimi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Belediye saha personelinin görevli oldukları uzmanlık birimlerini yönetin, ekipleri organize edin.
          </p>
        </div>
        
        <button
          onClick={fetchWorkers}
          className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/40 dark:border-slate-800/40 transition-all"
        >
          Yenile
        </button>
      </div>

      {/* Başarı Bildirimleri */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-350 p-4 rounded-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SQL Kolonu Hata Bildirimi */}
      {error && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-350 p-4 rounded-xl text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-bold">İşlem Başarısız:</p>
            <p>{error}</p>
            {error.includes("ALTER TABLE") && (
              <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-3xs font-mono overflow-x-auto whitespace-pre-wrap select-all border border-slate-850 mt-2">
                ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Genel';
              </pre>
            )}
          </div>
        </div>
      )}

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Kart 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5 dark:hover:shadow-none hover:-translate-y-0.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 text-white shadow-md shadow-brand-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xs text-slate-400 uppercase font-bold tracking-wider">Toplam Saha Çalışanı</span>
            <h3 className="text-xl font-black mt-0.5">{totalWorkers}</h3>
          </div>
        </div>

        {/* Kart 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5 dark:hover:shadow-none hover:-translate-y-0.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xs text-slate-400 uppercase font-bold tracking-wider">En Kalabalık Birim</span>
            <h3 className="text-base font-black mt-1 leading-tight">{topDept} {maxCount > 0 && `(${maxCount} Kişi)`}</h3>
          </div>
        </div>
      </div>

      {/* Çalışan Listesi Kartı */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <UserCheck className="h-4.5 w-4.5 text-brand-500" />
            Saha Ekibi Üyeleri ve Görev Atamaları
          </span>
          <span className="text-3xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.8 rounded-lg">
            {totalWorkers} Çalışan Listeleniyor
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Çalışan verileri yükleniyor...</span>
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Hiç Çalışan Kaydı Bulunmuyor</h4>
            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Sisteme kayıtlı, rolü 'worker' veya 'field_team' olan bir personel bulunamadı.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/10 text-3xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Çalışan Bilgisi</th>
                  <th className="px-6 py-4">İletişim</th>
                  <th className="px-6 py-4 text-center">Görev Birimi / Departman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {workers.map((worker) => {
                  const initials = worker.full_name
                    ? worker.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'SC';
                  const isUpdating = updatingId === worker.id;

                  return (
                    <tr 
                      key={worker.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                    >
                      {/* 1. Çalışan Bilgisi */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-850 dark:to-slate-800 text-slate-700 dark:text-slate-330 font-bold text-xs border border-slate-200/30 dark:border-slate-700/30">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                              {worker.full_name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                              {worker.role === 'field_team' ? 'Saha Çalışanı (Supabase)' : 'Saha Ekibi'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. İletişim */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{worker.phone || worker.phone_number || 'Belirtilmemiş'}</span>
                        </div>
                      </td>

                      {/* 4. Görev Birimi Dropdown */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center justify-center">
                          <div className="relative w-56">
                            <select
                              disabled={isUpdating}
                              value={worker.department || 'Genel'}
                              onChange={(e) => handleDepartmentChange(worker.id, e.target.value)}
                              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/80 transition-all ${
                                isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                            {isUpdating && (
                              <div className="absolute right-3 top-2.5">
                                <Loader2 className="h-3.5 w-3.5 text-brand-500 animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
