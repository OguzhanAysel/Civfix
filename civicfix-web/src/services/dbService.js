// CivicFix - Veritabanı ve Supabase Entegrasyon Servisi

import { createClient } from '@supabase/supabase-js';

// Gerçek Supabase Ayarları (Eğer .env dosyasında tanımlıysa gerçek Supabase'e bağlanır)
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabase = SUPABASE_URL && SUPABASE_ANON_KEY;

export const supabase = isRealSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// ----------------------------------------------------
// Demo Veri Seti (İstatistikler ve Harita İçin Zengin Veri)
// ----------------------------------------------------
const DEMO_REPORTS = [
  {
    id: "rep-101",
    title: "Mühendislik Fakültesi Önü Çukur",
    description: "Yolun tam ortasında derin bir çukur oluşmuş. Araçlar geçerken zarar görüyor ve kaçmak için şerit değiştirirken tehlike yaratıyor.",
    category: "Yol Bakım",
    priority: "Yüksek",
    status: "Yeni",
    latitude: 39.8972,
    longitude: 32.7794,
    address: "Üniversite Bulvarı, Mühendislik Fakültesi Önü",
    citizen_name: "Ahmet Yılmaz",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 saat önce
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "rep-102",
    title: "Atatürk Parkı Kırık Salıncak",
    description: "Çocuk parkındaki zincirli salıncaklardan birinin halkası kırılmış, çocukların düşme tehlikesi var.",
    category: "Çevre ve Parklar",
    priority: "Normal",
    status: "İnceleniyor",
    latitude: 39.9042,
    longitude: 32.7885,
    address: "Atatürk Parkı Çocuk Alanı",
    citizen_name: "Zeynep Demir",
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 saat önce
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "rep-103",
    title: "Gazi Caddesi Su Kaçağı",
    description: "Kaldırımın altından şebeke suyu fışkırıyor. Yol göle dönmüş durumda, basınç oldukça yüksek.",
    category: "Su ve Kanalizasyon",
    priority: "Acil",
    status: "Atandı",
    latitude: 39.8935,
    longitude: 32.7680,
    address: "Gazi Caddesi No: 45 önü",
    citizen_name: "Mehmet Can",
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 saat önce
    updated_at: new Date(Date.now() - 8 * 3600000).toISOString()
  },
  {
    id: "rep-104",
    title: "Sokak Lambası Yanmıyor",
    description: "123. Sokaktaki 4 adet aydınlatma direği akşamları hiç yanmıyor. Sokak çok karanlık ve güvensiz.",
    category: "Aydınlatma",
    priority: "Normal",
    status: "Sahada",
    latitude: 39.9110,
    longitude: 32.7930,
    address: "Hürriyet Mahallesi, 123. Sokak",
    citizen_name: "Fatma Şahin",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 gün önce
    updated_at: new Date(Date.now() - 15 * 3600000).toISOString()
  },
  {
    id: "rep-105",
    title: "Devrilmiş Trafik Levhası",
    description: "Kavşaktaki 'Yol Ver' tabelası rüzgardan dolayı devrilmiş. Sürücüler kavşağa kontrolsüz giriyor.",
    category: "Trafik ve Tabela",
    priority: "Yüksek",
    status: "Çözüldü",
    latitude: 39.8885,
    longitude: 32.7712,
    address: "Bahçelievler Kavşağı, 7. Cadde Girişi",
    citizen_name: "Murat Kaya",
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(), // 2 gün önce
    updated_at: new Date(Date.now() - 36 * 3600000).toISOString()
  },
  {
    id: "rep-106",
    title: "Çöp Konteyneri Taşmış",
    description: "Konteyner tamamen dolu, etrafına çöpler saçılmış ve sokakta koku yapmaya başlamış.",
    category: "Atık Yönetimi",
    priority: "Normal",
    status: "Yeni",
    latitude: 39.9015,
    longitude: 32.7820,
    address: "Cumhuriyet Mahallesi, Gül Sokak No: 12",
    citizen_name: "Elif Yıldız",
    created_at: new Date(Date.now() - 1.5 * 3600000).toISOString(), // 1.5 saat önce
    updated_at: new Date(Date.now() - 1.5 * 3600000).toISOString()
  },
  // Isı haritası için aynı bölgede yoğunlaşan arıza kayıtları
  {
    id: "rep-107",
    title: "Kampüs İçi Yol Çökmesi",
    description: "Kütüphane arkasındaki yolda asfalt çökmüş. Bisiklet ve scooter kullananlar için büyük tehlike.",
    category: "Yol Bakım",
    priority: "Yüksek",
    status: "Yeni",
    latitude: 39.8980,
    longitude: 32.7785, // rep-101'e çok yakın
    address: "Üniversite Kampüsü, Merkez Kütüphane Yolu",
    citizen_name: "Buse Öztürk",
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: "rep-108",
    title: "Mühendislik Otoparkı Logar Taşması",
    description: "Logar kapağından kirli su sızıyor, otoparkın bir kısmına ulaşılamıyor.",
    category: "Su ve Kanalizasyon",
    priority: "Acil",
    status: "Yeni",
    latitude: 39.8965,
    longitude: 32.7805, // rep-101 ve 107'ye çok yakın
    address: "Mühendislik Fakültesi Açık Otoparkı",
    citizen_name: "Caner Aydın",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString()
  }
];

const DEMO_IMAGES = [
  { id: "img-101", report_id: "rep-101", image_url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=60", ai_label: "Asfalt Çukuru", ai_confidence: 94 },
  { id: "img-102", report_id: "rep-102", image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop&q=60", ai_label: "Kırık Park Ekipmanı", ai_confidence: 88 },
  { id: "img-103", report_id: "rep-103", image_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60", ai_label: "Su Kaçağı", ai_confidence: 91 },
  { id: "img-104", report_id: "rep-104", image_url: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?w=500&auto=format&fit=crop&q=60", ai_label: "Sönük Sokak Lambası", ai_confidence: 89 },
  { id: "img-105", report_id: "rep-105", image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60", ai_label: "Devrilmiş Trafik Levhası", ai_confidence: 95 },
  { id: "img-106", report_id: "rep-106", image_url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500&auto=format&fit=crop&q=60", ai_label: "Çöp Konteyneri Taşması", ai_confidence: 92 }
];

const DEMO_COMMENTS = [
  { id: "com-1", report_id: "rep-103", user_name: "Belediye Operatörü", message: "İhbar acil statüsünde onaylandı. Teknik su işleri ekibine iş emri gönderildi.", is_internal: true, created_at: new Date(Date.now() - 10 * 3600000).toISOString() },
  { id: "com-2", report_id: "rep-103", user_name: "Teknik Ekip Lideri", message: "Gazi Caddesi üzerindeki vanalar kapatıldı, basınç düşürüldü. Boru tamiratına başlanıyor.", is_internal: false, created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "com-3", report_id: "rep-104", user_name: "Saha Ekipleri A", message: "Aydınlatma direklerinin sigortalarında arıza tespit edildi. Kablo yenileme çalışması sahada devam ediyor.", is_internal: false, created_at: new Date(Date.now() - 15 * 3600000).toISOString() }
];

const DEMO_ASSIGNMENTS = [
  { id: "asn-103", report_id: "rep-103", assigned_team: "Su Arıza Acil Müdahale Ekibi B", notes: "Ana vanaların kapatılması ve borunun yamanması görevi.", assigned_at: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "asn-104", report_id: "rep-104", assigned_team: "Elektrik ve Aydınlatma Grubu 2", notes: "Sigorta panosunun ve armatürlerin yenilenmesi görevi.", assigned_at: new Date(Date.now() - 15 * 3600000).toISOString() }
];

// ----------------------------------------------------
// Gelişmiş Özellikler Yardımcı Fonksiyonları (SLA & Öncelik Skor Motoru)
// ----------------------------------------------------
const getSLADeadline = (category) => {
  let hours = 48; // Varsayılan SLA
  const cat = category?.trim();
  if (cat === 'Su Kaçağı' || cat === 'Su ve Kanalizasyon') {
    hours = 6;
  } else if (cat === 'Aydınlatma') {
    hours = 12;
  } else if (cat === 'Yol Bakım') {
    hours = 24;
  }
  return new Date(Date.now() + hours * 3600000).toISOString();
};

const getNearbyReportsCount = (lat, lng, allReports) => {
  if (!lat || !lng || !allReports) return 0;
  // Yaklaşık 500 metre (0.005 enlem/boylam farkı) içerisindeki aktif ihbarların sayısı
  return allReports.filter(r => 
    r.status !== 'Çözüldü' &&
    Math.abs(r.latitude - lat) < 0.005 &&
    Math.abs(r.longitude - lng) < 0.005
  ).length;
};

const calculatePriorityScore = (priority, upvoteCount = 0, nearbyCount = 0) => {
  let base = 30; // Varsayılan 'Normal'
  if (priority === 'Düşük') base = 10;
  else if (priority === 'Normal') base = 30;
  else if (priority === 'Yüksek') base = 60;
  else if (priority === 'Acil') base = 90;
  
  const score = base + (upvoteCount * 5) + (nearbyCount * 10);
  return Math.min(100, Math.max(0, score));
};

// LocalStorage Veritabanı Yönetimi (Fallback Modu)
const initLocalDB = () => {
  if (!localStorage.getItem('civicfix_reports')) {
    localStorage.setItem('civicfix_reports', JSON.stringify(DEMO_REPORTS));
  }
  if (!localStorage.getItem('civicfix_images')) {
    localStorage.setItem('civicfix_images', JSON.stringify(DEMO_IMAGES));
  }
  if (!localStorage.getItem('civicfix_comments')) {
    localStorage.setItem('civicfix_comments', JSON.stringify(DEMO_COMMENTS));
  }
  if (!localStorage.getItem('civicfix_assignments')) {
    localStorage.setItem('civicfix_assignments', JSON.stringify(DEMO_ASSIGNMENTS));
  }
  if (!localStorage.getItem('civicfix_notifications')) {
    localStorage.setItem('civicfix_notifications', JSON.stringify([]));
  }
  if (!localStorage.getItem('civicfix_upvotes')) {
    localStorage.setItem('civicfix_upvotes', JSON.stringify([]));
  }
  if (!localStorage.getItem('civicfix_profiles')) {
    localStorage.setItem('civicfix_profiles', JSON.stringify([
      { id: "citizen-user", full_name: "Misafir Vatandaş", role: "citizen", trust_score: 100, badge: "Yeni Vatandaş", reports_count: 0, verified_count: 0 }
    ]));
  }
};

initLocalDB();

// Gerçek zamanlı tetikleyici yardımcı fonksiyonu
const triggerRealtimeUpdate = (type, data) => {
  const event = new CustomEvent('civicfix_realtime', {
    detail: { type, data }
  });
  window.dispatchEvent(event);
  
  // StorageEvent simülasyonu (başka sekmeler için)
  localStorage.setItem('civicfix_last_update', JSON.stringify({ type, data, timestamp: Date.now() }));
};

// ----------------------------------------------------
// Veri Servisleri Metotları
// ----------------------------------------------------
export const dbService = {
  // 1. Tüm İhbarları Getir
  async getReports() {
    if (isRealSupabase) {
      const { data, error } = await supabase
        .from('reports')
        .select(`*, report_images(*), assignments(*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const reports = JSON.parse(localStorage.getItem('civicfix_reports'));
      const images = JSON.parse(localStorage.getItem('civicfix_images'));
      const assignments = JSON.parse(localStorage.getItem('civicfix_assignments'));
      
      return reports.map(rep => ({
        ...rep,
        report_images: images.filter(img => img.report_id === rep.id),
        assignments: assignments.find(asn => asn.report_id === rep.id) || null
      }));
    }
  },

  // 2. Yeni İhbar Oluştur
  async createReport(reportData, imageFile = null) {
    const slaDeadline = getSLADeadline(reportData.category);

    if (isRealSupabase) {
      // Öncelik skoru hesabı için tüm ihbarları al
      let nearbyCount = 0;
      try {
        const { data: allReports } = await supabase.from('reports').select('id, latitude, longitude, status');
        nearbyCount = getNearbyReportsCount(reportData.latitude, reportData.longitude, allReports);
      } catch (err) {
        console.error("Öncelik hesaplama hatası:", err);
      }
      const priorityScore = calculatePriorityScore(reportData.priority, 0, nearbyCount);

      // Supabase 'reports' tablosunda 'citizen_name' kolonu bulunmadığı için çıkartıyoruz
      const { citizen_name, ...supabaseData } = reportData;
      
      const reportPayload = {
        ...supabaseData,
        sla_deadline: slaDeadline,
        priority_score: priorityScore,
        upvote_count: 0
      };

      // Eğer citizen_id geçersiz bir değerse null yapıyoruz
      if (!reportPayload.citizen_id || reportPayload.citizen_id === 'citizen-user') {
        reportPayload.citizen_id = null;
      }

      let report = null;
      let repError = null;
      try {
        const { data, error } = await supabase
          .from('reports')
          .insert([reportPayload])
          .select()
          .single();
        report = data;
        repError = error;
        if (repError) throw repError;
      } catch (err) {
        const errMsg = err.message || '';
        const errCode = err.code || '';
        
        // 1. Durum: Eksik kolon veya şema önbellek uyuşmazlığı
        if (
          errCode === 'PGRST111' || errCode === 'PGRST204' || errCode === '42703' ||
          errMsg.includes('priority_score') || errMsg.includes('sla_deadline') || 
          errMsg.includes('upvote_count') || errMsg.includes('resolved_image_url') ||
          errMsg.includes('schema cache') || errMsg.includes('column')
        ) {
          console.warn("Retrying report insert without advanced schema columns:", errMsg);
          const fallbackPayload = { ...reportPayload };
          delete fallbackPayload.priority_score;
          delete fallbackPayload.sla_deadline;
          delete fallbackPayload.upvote_count;
          delete fallbackPayload.resolved_image_url;
          
          try {
            const { data: retryReport, error: retryError } = await supabase
              .from('reports')
              .insert([fallbackPayload])
              .select()
              .single();
            if (retryError) throw retryError;
            report = retryReport;
          } catch (retryErr) {
            const retryMsg = retryErr.message || '';
            const retryCode = retryErr.code || '';
            if (retryCode === '23503' || retryMsg.includes('foreign key') || retryMsg.includes('citizen_id')) {
              console.warn("Retrying report insert without citizen_id due to foreign key constraint:", retryMsg);
              const fallbackPayload2 = { ...fallbackPayload };
              fallbackPayload2.citizen_id = null;
              const { data: finalReport, error: finalError } = await supabase
                .from('reports')
                .insert([fallbackPayload2])
                .select()
                .single();
              if (finalError) throw finalError;
              report = finalReport;
            } else {
              throw retryErr;
            }
          }
        }
        // 2. Durum: Doğrudan foreign key hatası (şema hatası olmadan)
        else if (errCode === '23503' || errMsg.includes('foreign key') || errMsg.includes('citizen_id')) {
          console.warn("Retrying report insert without citizen_id due to foreign key constraint:", errMsg);
          const fallbackPayload = { ...reportPayload };
          fallbackPayload.citizen_id = null;
          const { data: retryReport, error: retryError } = await supabase
            .from('reports')
            .insert([fallbackPayload])
            .select()
            .single();
          if (retryError) throw retryError;
          report = retryReport;
        } else {
          throw err;
        }
      }


      // Resim Varsa Yükleme (Base64 veya File)
      if (imageFile && report) {
        const { error: imgError } = await supabase
          .from('report_images')
          .insert([{
            report_id: report.id,
            image_url: imageFile,
            ai_label: reportData.ai_label || 'Arıza',
            ai_confidence: reportData.ai_confidence || 90
          }]);
        if (imgError) console.error(imgError);
      }

      return report;
    } else {
      // LocalStorage Kaydı
      const reports = JSON.parse(localStorage.getItem('civicfix_reports'));
      const nearbyCount = getNearbyReportsCount(reportData.latitude, reportData.longitude, reports);
      const priorityScore = calculatePriorityScore(reportData.priority, 0, nearbyCount);

      const newReport = {
        id: "rep-" + Math.floor(Math.random() * 10000),
        ...reportData,
        sla_deadline: slaDeadline,
        priority_score: priorityScore,
        upvote_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      reports.unshift(newReport);
      localStorage.setItem('civicfix_reports', JSON.stringify(reports));

      // Vatandaşın toplam ihbar adedini güncelle
      if (reportData.citizen_id) {
        const profiles = JSON.parse(localStorage.getItem('civicfix_profiles')) || [];
        const profIndex = profiles.findIndex(p => p.id === reportData.citizen_id);
        if (profIndex !== -1) {
          profiles[profIndex].reports_count = (profiles[profIndex].reports_count || 0) + 1;
          localStorage.setItem('civicfix_profiles', JSON.stringify(profiles));
        }
      }

      // Görsel Kaydı
      if (imageFile) {
        const images = JSON.parse(localStorage.getItem('civicfix_images'));
        const newImg = {
          id: "img-" + Math.floor(Math.random() * 10000),
          report_id: newReport.id,
          image_url: imageFile, // base64 / blob
          ai_label: reportData.ai_label || 'Arıza Nesnesi',
          ai_confidence: reportData.ai_confidence || 85
        };
        images.push(newImg);
        localStorage.setItem('civicfix_images', JSON.stringify(images));
      }

      // Realtime tetikleme yap
      triggerRealtimeUpdate('REPORT_CREATED', newReport);
      return newReport;
    }
  },

  // 3. İhbar Durumunu Güncelle (Kanban Sürükle Bırak)
  async updateReportStatus(reportId, newStatus) {
    if (isRealSupabase) {
      const { data, error } = await supabase
        .from('reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reportId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const reports = JSON.parse(localStorage.getItem('civicfix_reports'));
      const index = reports.findIndex(r => r.id === reportId);
      if (index !== -1) {
        reports[index].status = newStatus;
        reports[index].updated_at = new Date().toISOString();
        localStorage.setItem('civicfix_reports', JSON.stringify(reports));
        
        const updatedReport = reports[index];
        
        // Güven skoru güncellemeleri (Trigger simülasyonu - LocalStorage için)
        if (newStatus === 'Çözüldü' && updatedReport.citizen_id) {
          const profiles = JSON.parse(localStorage.getItem('civicfix_profiles')) || [];
          const profIndex = profiles.findIndex(p => p.id === updatedReport.citizen_id);
          if (profIndex !== -1) {
            profiles[profIndex].trust_score = (profiles[profIndex].trust_score || 100) + 5;
            profiles[profIndex].verified_count = (profiles[profIndex].verified_count || 0) + 1;
            
            const score = profiles[profIndex].trust_score;
            if (score >= 150) profiles[profIndex].badge = '🏅 Elit Vatandaş';
            else if (score >= 120) profiles[profIndex].badge = '🥈 Aktif Vatandaş';
            else if (score >= 90) profiles[profIndex].badge = '🥉 Güvenilir Vatandaş';
            else profiles[profIndex].badge = 'Yeni Vatandaş';

            localStorage.setItem('civicfix_profiles', JSON.stringify(profiles));
          }
        }
        
        // Bildirim Ekle (Vatandaş İçin)
        this.addNotification({
          user_id: updatedReport.citizen_id || "citizen-user",
          report_id: reportId,
          title: `İhbarınızın Durumu Güncellendi (#${reportId.replace('rep-', '')})`,
          message: `Arıza bildiriminiz teknik ekibimiz tarafından '${newStatus}' aşamasına taşındı.`,
        });

        // Realtime tetikleme yap
        triggerRealtimeUpdate('REPORT_STATUS_UPDATED', updatedReport);
        return updatedReport;
      }
      throw new Error("İhbar bulunamadı");
    }
  },

  // 4. İhbar Yorumlarını Al
  async getComments(reportId) {
    if (isRealSupabase) {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      const comments = JSON.parse(localStorage.getItem('civicfix_comments'));
      return comments.filter(c => c.report_id === reportId);
    }
  },

  // 5. Yorum Ekle
  async addComment(reportId, message, userName = "Belediye Ekibi", isInternal = false, userId = null) {
    if (isRealSupabase) {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          report_id: reportId,
          user_id: userId, // NULL desteği mevcut (misafirler için)
          message,
          is_internal: isInternal
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const newComment = {
        id: "com-" + Math.floor(Math.random() * 10000),
        report_id: reportId,
        user_name: userName,
        message,
        is_internal: isInternal,
        created_at: new Date().toISOString()
      };
      const comments = JSON.parse(localStorage.getItem('civicfix_comments'));
      comments.push(newComment);
      localStorage.setItem('civicfix_comments', JSON.stringify(comments));

      triggerRealtimeUpdate('COMMENT_ADDED', newComment);
      return newComment;
    }
  },

  // 6. Teknik Ekip Ata
  async assignTeam(reportId, assignedTeam, notes = '') {
    if (isRealSupabase) {
      const { data, error } = await supabase
        .from('assignments')
        .upsert([{
          report_id: reportId,
          assigned_team: assignedTeam,
          notes: notes
        }], { onConflict: 'report_id' })
        .select()
        .single();
      if (error) {
        console.error("Supabase assignment error:", error);
        throw error;
      }
      
      // İhbar durumunu 'Atandı' yap
      await this.updateReportStatus(reportId, 'Atandı');
      
      return data;
    } else {
      const newAssignment = {
        id: "asn-" + Math.floor(Math.random() * 10000),
        report_id: reportId,
        assigned_team: assignedTeam,
        notes,
        assigned_at: new Date().toISOString()
      };
      const assignments = JSON.parse(localStorage.getItem('civicfix_assignments'));
      const index = assignments.findIndex(a => a.report_id === reportId);
      if (index !== -1) {
        assignments[index] = { ...assignments[index], assigned_team: assignedTeam, notes };
      } else {
        assignments.push(newAssignment);
      }
      localStorage.setItem('civicfix_assignments', JSON.stringify(assignments));

      // İhbar durumunu 'Atandı' yap
      await this.updateReportStatus(reportId, 'Atandı');
      
      triggerRealtimeUpdate('REPORT_ASSIGNED', newAssignment);
      return newAssignment;
    }
  },

  // 7. Bildirim Ekle
  addNotification(notificationData) {
    const notifications = JSON.parse(localStorage.getItem('civicfix_notifications')) || [];
    const newNotification = {
      id: "notif-" + Math.floor(Math.random() * 10000),
      ...notificationData,
      is_read: false,
      created_at: new Date().toISOString()
    };
    notifications.unshift(newNotification);
    localStorage.setItem('civicfix_notifications', JSON.stringify(notifications));

    // Realtime tetikleme yap
    triggerRealtimeUpdate('NOTIFICATION_RECEIVED', newNotification);
    return newNotification;
  },

  // 8. Bildirimleri Al
  getNotifications() {
    return JSON.parse(localStorage.getItem('civicfix_notifications')) || [];
  },

  // 9. Bildirimleri Okundu İşaretle
  markNotificationsAsRead() {
    const notifications = JSON.parse(localStorage.getItem('civicfix_notifications')) || [];
    notifications.forEach(n => n.is_read = true);
    localStorage.setItem('civicfix_notifications', JSON.stringify(notifications));
    return notifications;
  },

  // 10. Topluluk Doğrulama (Upvote / Ben de görüyorum)
  async upvoteReport(reportId, userId) {
    if (isRealSupabase) {
      // 1. upvotes tablosuna ekle
      const { error: upError } = await supabase
        .from('upvotes')
        .insert([{ report_id: reportId, user_id: userId }]);
      
      if (upError) {
        if (upError.code === '23505') { // Unique constraint hatası (Zaten upvote edilmiş)
          throw new Error("Bu ihbarı zaten doğruladınız.");
        }
        throw upError;
      }

      // 2. İhbarı çekip yeni öncelik skorunu hesaplayalım
      const { data: report, error: repError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();
      if (repError) throw repError;

      // 3. Yakındaki aktif ihbar sayısı
      const { data: allReports } = await supabase.from('reports').select('id, latitude, longitude, status');
      const nearbyCount = getNearbyReportsCount(report.latitude, report.longitude, allReports);
      
      const newUpvoteCount = (report.upvote_count || 0) + 1;
      const newPriorityScore = calculatePriorityScore(report.priority, newUpvoteCount, nearbyCount);

      // 4. İhbar tablosunu güncelle
      try {
        const { data: updatedReport, error: updateError } = await supabase
          .from('reports')
          .update({ 
            upvote_count: newUpvoteCount, 
            priority_score: newPriorityScore,
            updated_at: new Date().toISOString() 
          })
          .eq('id', reportId)
          .select()
          .single();
        if (updateError) throw updateError;
        return updatedReport;
      } catch (err) {
        const errMsg = err.message || '';
        const errCode = err.code || '';
        if (
          errCode === 'PGRST111' || errCode === 'PGRST204' || errCode === '42703' ||
          errMsg.includes('priority_score') || errMsg.includes('upvote_count') ||
          errMsg.includes('schema cache') || errMsg.includes('column')
        ) {
          console.warn("Retrying upvote update without advanced columns:", errMsg);
          const { data: updatedReport, error: retryError } = await supabase
            .from('reports')
            .update({ 
              updated_at: new Date().toISOString() 
            })
            .eq('id', reportId)
            .select()
            .single();
          if (retryError) throw retryError;
          return {
            ...updatedReport,
            upvote_count: newUpvoteCount,
            priority_score: newPriorityScore
          };
        } else {
          throw err;
        }
      }
    } else {
      const reports = JSON.parse(localStorage.getItem('civicfix_reports')) || [];
      const reportIndex = reports.findIndex(r => r.id === reportId);
      if (reportIndex === -1) throw new Error("İhbar bulunamadı.");

      const upvotes = JSON.parse(localStorage.getItem('civicfix_upvotes')) || [];
      const alreadyUpvoted = upvotes.some(u => u.report_id === reportId && u.user_id === userId);
      if (alreadyUpvoted) throw new Error("Bu ihbarı zaten doğruladınız.");

      upvotes.push({ id: "up-" + Math.floor(Math.random() * 10000), report_id: reportId, user_id: userId });
      localStorage.setItem('civicfix_upvotes', JSON.stringify(upvotes));

      const report = reports[reportIndex];
      report.upvote_count = (report.upvote_count || 0) + 1;
      const nearbyCount = getNearbyReportsCount(report.latitude, report.longitude, reports);
      report.priority_score = calculatePriorityScore(report.priority, report.upvote_count, nearbyCount);
      report.updated_at = new Date().toISOString();

      localStorage.setItem('civicfix_reports', JSON.stringify(reports));
      
      triggerRealtimeUpdate('REPORT_STATUS_UPDATED', report);
      return report;
    }
  },

  // 11. İhbar Çözümleme (Sonraki Resmi ile Kapatma)
  async resolveReport(reportId, resolvedImageUrl) {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .update({
            status: 'Çözüldü',
            resolved_image_url: resolvedImageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', reportId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        const errMsg = err.message || '';
        const errCode = err.code || '';
        if (
          errCode === 'PGRST111' || errCode === 'PGRST204' || errCode === '42703' ||
          errMsg.includes('resolved_image_url') || errMsg.includes('schema cache') || errMsg.includes('column')
        ) {
          console.warn("Retrying resolve report update without resolved_image_url:", errMsg);
          const { data, error: retryError } = await supabase
            .from('reports')
            .update({
              status: 'Çözüldü',
              updated_at: new Date().toISOString()
            })
            .eq('id', reportId)
            .select()
            .single();
          if (retryError) throw retryError;
          return {
            ...data,
            resolved_image_url: resolvedImageUrl
          };
        } else {
          throw err;
        }
      }
    } else {
      const reports = JSON.parse(localStorage.getItem('civicfix_reports')) || [];
      const index = reports.findIndex(r => r.id === reportId);
      if (index === -1) throw new Error("İhbar bulunamadı");

      const report = reports[index];
      report.status = 'Çözüldü';
      report.resolved_image_url = resolvedImageUrl;
      report.updated_at = new Date().toISOString();
      localStorage.setItem('civicfix_reports', JSON.stringify(reports));

      // LocalStorage tetikleyici simülasyonu (Güven Skoru +5)
      if (report.citizen_id) {
        const profiles = JSON.parse(localStorage.getItem('civicfix_profiles')) || [];
        const profIndex = profiles.findIndex(p => p.id === report.citizen_id);
        if (profIndex !== -1) {
          profiles[profIndex].trust_score = (profiles[profIndex].trust_score || 100) + 5;
          profiles[profIndex].verified_count = (profiles[profIndex].verified_count || 0) + 1;
          
          const score = profiles[profIndex].trust_score;
          if (score >= 150) profiles[profIndex].badge = '🏅 Elit Vatandaş';
          else if (score >= 120) profiles[profIndex].badge = '🥈 Aktif Vatandaş';
          else if (score >= 90) profiles[profIndex].badge = '🥉 Güvenilir Vatandaş';
          else profiles[profIndex].badge = 'Yeni Vatandaş';

          localStorage.setItem('civicfix_profiles', JSON.stringify(profiles));
        }
      }

      this.addComment(reportId, "İhbar belediye ekiplerimiz tarafından çözüldü. Çözüm görseli eklendi.", "Belediye Ekibi", false);
      triggerRealtimeUpdate('REPORT_STATUS_UPDATED', report);
      return report;
    }
  },

  // 12. Vatandaş Profil Bilgilerini Getir
  async getProfile(userId) {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) throw error;
        if (data && data.role === 'field_team') {
          data.role = 'worker';
        }
        return data;
      } catch (err) {
        console.warn("Profil çekilemedi, varsayılan profil dönülüyor:", err.message);
        return {
          id: userId,
          full_name: "Kullanıcı",
          role: "citizen",
          trust_score: 100,
          badge: "Yeni Vatandaş"
        };
      }
    } else {
      const profiles = JSON.parse(localStorage.getItem('civicfix_profiles')) || [];
      return profiles.find(p => p.id === userId) || null;
    }
  },

  // 13. Saha Çalışanlarını Getir
  async getWorkers() {
    if (isRealSupabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['worker', 'field_team'])
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const profiles = JSON.parse(localStorage.getItem('civicfix_profiles')) || [];
      return profiles.filter(p => p.role === 'worker' || p.role === 'field_team');
    }
  },

  // 14. Çalışan Birimini Güncelle
  async updateWorkerDepartment(workerId, department) {
    if (isRealSupabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ department: department })
        .eq('id', workerId)
        .select()
        .single();
      if (error) {
        if (error.code === '42703') {
          throw new Error("Lütfen veritabanında 'department' kolonunun oluşturulduğundan emin olun. SQL: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Genel';");
        }
        throw error;
      }
      return data;
    } else {
      const profiles = JSON.parse(localStorage.getItem('civicfix_profiles')) || [];
      const index = profiles.findIndex(p => p.id === workerId);
      if (index !== -1) {
        profiles[index].department = department;
        localStorage.setItem('civicfix_profiles', JSON.stringify(profiles));
        return profiles[index];
      }
      throw new Error("Çalışan bulunamadı");
    }
  }
};
