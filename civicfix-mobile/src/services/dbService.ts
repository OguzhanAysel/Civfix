// CivicFix - Mobile Database and Supabase Client Service

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase Configuration Fallback
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isRealSupabase = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

export const supabase = isRealSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Gelişmiş Özellikler Yardımcı Fonksiyonları (SLA & Öncelik Skor Motoru)
const getSLADeadline = (category: string) => {
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

const getNearbyReportsCount = (lat: number, lng: number, allReports: any[]) => {
  if (!lat || !lng || !allReports) return 0;
  return allReports.filter(r => 
    r.status !== 'Çözüldü' &&
    Math.abs(r.latitude - lat) < 0.005 &&
    Math.abs(r.longitude - lng) < 0.005
  ).length;
};

const calculatePriorityScore = (priority: string, upvoteCount: number = 0, nearbyCount: number = 0) => {
  let base = 30; // Varsayılan 'Normal'
  if (priority === 'Düşük') base = 10;
  else if (priority === 'Normal') base = 30;
  else if (priority === 'Yüksek') base = 60;
  else if (priority === 'Acil') base = 90;
  
  const score = base + (upvoteCount * 5) + (nearbyCount * 10);
  return Math.min(100, Math.max(0, score));
};

// Mock database storage using class-based memory state and AsyncStorage for notifications
class LocalMobileDB {
  private reports: any[] = [];
  private notifications: any[] = [];
  private trustScore: number = 100;
  private badge: string = "Yeni Vatandaş";
  private reportsCount: number = 0;
  private verifiedCount: number = 0;
  private upvotes: any[] = [];

  constructor() {
    this.reports = [
      {
        id: "rep-101",
        title: "Mühendislik Fakültesi Önü Çukur",
        description: "Yolun tam ortasında derin bir çukur oluşmuş. Araçlar geçerken zarar görüyor.",
        category: "Yol Bakım",
        priority: "Yüksek",
        status: "Yeni",
        latitude: 39.8972,
        longitude: 32.7794,
        address: "Üniversite Bulvarı, Mühendislik Fakültesi Önü",
        citizen_name: "Yurttaş Can",
        upvote_count: 3,
        priority_score: 75,
        sla_deadline: new Date(Date.now() + 12 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 3600000).toISOString()
      }
    ];
    this.loadNotifications();
    this.loadProfile();
    this.loadUpvotes();
  }

  async loadNotifications() {
    if (typeof window === 'undefined') return;
    try {
      const stored = await AsyncStorage.getItem('civicfix_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      } else {
        this.notifications = [
          {
            id: "notif-1",
            title: "Sisteme Hoş Geldiniz",
            message: "CivicFix ile akıllı kent ihbarlarınızı anında yetkililere iletebilirsiniz.",
            is_read: false,
            created_at: new Date().toISOString()
          }
        ];
        await this.saveNotifications();
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  }

  async saveNotifications() {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem('civicfix_notifications', JSON.stringify(this.notifications));
    } catch (e) {
      console.error("Failed to save notifications:", e);
    }
  }

  async loadProfile() {
    if (typeof window === 'undefined') return;
    try {
      const stored = await AsyncStorage.getItem('civicfix_profile');
      if (stored) {
        const p = JSON.parse(stored);
        this.trustScore = p.trust_score ?? 100;
        this.badge = p.badge ?? "Yeni Vatandaş";
        this.reportsCount = p.reports_count ?? 0;
        this.verifiedCount = p.verified_count ?? 0;
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  }

  async saveProfile() {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem('civicfix_profile', JSON.stringify({
        trust_score: this.trustScore,
        badge: this.badge,
        reports_count: this.reportsCount,
        verified_count: this.verifiedCount
      }));
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  }

  async loadUpvotes() {
    if (typeof window === 'undefined') return;
    try {
      const stored = await AsyncStorage.getItem('civicfix_upvotes');
      if (stored) {
        this.upvotes = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load upvotes:", e);
    }
  }

  async saveUpvotes() {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem('civicfix_upvotes', JSON.stringify(this.upvotes));
    } catch (e) {
      console.error("Failed to save upvotes:", e);
    }
  }

  getReports() {
    return this.reports;
  }

  async addReport(report: any) {
    const slaDeadline = getSLADeadline(report.category);
    const nearbyCount = getNearbyReportsCount(report.latitude, report.longitude, this.reports);
    const priorityScore = calculatePriorityScore(report.priority, 0, nearbyCount);

    const newReport = {
      id: "rep-" + Math.floor(Math.random() * 10000),
      ...report,
      sla_deadline: slaDeadline,
      priority_score: priorityScore,
      upvote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.reports.unshift(newReport);
    
    this.reportsCount += 1;
    await this.saveProfile();
    
    return newReport;
  }

  async upvoteReport(reportId: string, userId: string) {
    const alreadyUpvoted = this.upvotes.some(u => u.report_id === reportId && u.user_id === userId);
    if (alreadyUpvoted) {
      throw new Error("Bu ihbarı zaten doğruladınız.");
    }

    this.upvotes.push({ report_id: reportId, user_id: userId });
    await this.saveUpvotes();

    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      const report = this.reports[reportIndex];
      report.upvote_count = (report.upvote_count || 0) + 1;
      const nearbyCount = getNearbyReportsCount(report.latitude, report.longitude, this.reports);
      report.priority_score = calculatePriorityScore(report.priority, report.upvote_count, nearbyCount);
      report.updated_at = new Date().toISOString();
      return report;
    }
    return null;
  }

  getProfile() {
    return {
      id: "citizen-user",
      full_name: "Misafir Vatandaş",
      role: "citizen",
      trust_score: this.trustScore,
      badge: this.badge,
      reports_count: this.reportsCount,
      verified_count: this.verifiedCount
    };
  }

  async updateLocalProfileScore(amount: number) {
    this.trustScore = Math.max(0, this.trustScore + amount);
    if (amount > 0) {
      this.verifiedCount += 1;
    }
    
    if (this.trustScore >= 150) this.badge = '🏅 Elit Vatandaş';
    else if (this.trustScore >= 120) this.badge = '🥈 Aktif Vatandaş';
    else if (this.trustScore >= 90) this.badge = '🥉 Güvenilir Vatandaş';
    else this.badge = 'Yeni Vatandaş';

    await this.saveProfile();
  }

  getNotifications() {
    return this.notifications;
  }

  async addNotification(title: string, message: string) {
    const newNotif = {
      id: "notif-" + Math.floor(Math.random() * 10000),
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
    await this.saveNotifications();
    return newNotif;
  }

  async markNotificationsRead() {
    this.notifications.forEach(n => n.is_read = true);
    await this.saveNotifications();
  }
}

const localDB = new LocalMobileDB();

export const dbService = {
  isRealSupabase,
  supabase,

  async signIn(email: string, password: string) {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profError) throw profError;
      if (profile && profile.role === 'field_team') {
        profile.role = 'worker';
      }
      return profile;
    } else {
      const lowerEmail = email.toLowerCase().trim();
      const mockUsers: any[] = [];

      let matched = mockUsers.find(u => u.email === lowerEmail && u.password === password);
      if (!matched) {
        if (typeof window !== 'undefined') {
          try {
            const stored = await AsyncStorage.getItem('civicfix_mock_users');
            if (stored) {
              const localUsers = JSON.parse(stored);
              const found = localUsers.find((u: any) => u.email === lowerEmail && u.password === password);
              if (found) {
                matched = {
                  id: 'mock-' + found.email,
                  email: found.email,
                  password: found.password,
                  role: found.role,
                  full_name: found.fullName
                };
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (matched) {
        return matched;
      }
      throw new Error('E-posta veya şifre hatalı. (Test: admin@civicfix.com / admin123)');
    }
  },

  async signUp(email: string, password: string, fullName: string, role: string, phoneNumber: string = '') {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role === 'worker' ? 'field_team' : role,
            phone_number: phoneNumber
          }
        }
      });
      if (error) throw error;
      return data;
    } else {
      const lowerEmail = email.toLowerCase().trim();
      const mockUsers: any[] = [];
      
      let exists = mockUsers.some(u => u.email === lowerEmail);
      let localUsers: any[] = [];
      
      if (typeof window !== 'undefined') {
        try {
          const stored = await AsyncStorage.getItem('civicfix_mock_users');
          if (stored) {
            localUsers = JSON.parse(stored);
            if (localUsers.some((u: any) => u.email === lowerEmail)) {
              exists = true;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (exists) {
        throw new Error('Bu e-posta adresiyle kayıtlı bir hesap zaten var.');
      }

      const newUser = {
        email: lowerEmail,
        password,
        fullName,
        role,
        phoneNumber
      };

      localUsers.push(newUser);
      if (typeof window !== 'undefined') {
        await AsyncStorage.setItem('civicfix_mock_users', JSON.stringify(localUsers));
      }

      return newUser;
    }
  },

  async getReports() {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('reports')
        .select('*, report_images(*), assignments(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    return localDB.getReports();
  },

  async createReport(reportData: any, imageUrl: string | null) {
    const slaDeadline = getSLADeadline(reportData.category);

    if (isRealSupabase && supabase) {
      // Öncelik skoru hesabı için tüm ihbarları al
      let nearbyCount = 0;
      try {
        const { data: allReports } = await supabase.from('reports').select('id, latitude, longitude, status');
        nearbyCount = getNearbyReportsCount(reportData.latitude, reportData.longitude, allReports || []);
      } catch (err) {
        console.error("Öncelik hesaplama hatası:", err);
      }
      const priorityScore = calculatePriorityScore(reportData.priority, 0, nearbyCount);

      // Supabase 'reports' tablosunda 'citizen_name' kolonu bulunmadığı için çıkartıyoruz
      const { citizen_name, ...supabaseData } = reportData;
      const reportPayload: any = {
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
      let error = null;
      try {
        const { data, error: insertError } = await supabase
          .from('reports')
          .insert([reportPayload])
          .select()
          .single();
        report = data;
        error = insertError;
        if (error) throw error;
      } catch (err: any) {
        const errMsg = err.message || '';
        const errCode = err.code || '';
        
        // 1. Durum: Eksik kolon veya şema önbellek uyuşmazlığı
        if (
          errCode === 'PGRST111' || errCode === 'PGRST204' || errCode === '42703' ||
          errMsg.includes('priority_score') || errMsg.includes('sla_deadline') || 
          errMsg.includes('upvote_count') || errMsg.includes('resolved_image_url') ||
          errMsg.includes('schema cache') || errMsg.includes('column')
        ) {
          console.warn("Retrying report insert without advanced schema columns on mobile:", errMsg);
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
          } catch (retryErr: any) {
            const retryMsg = retryErr.message || '';
            const retryCode = retryErr.code || '';
            if (retryCode === '23503' || retryMsg.includes('foreign key') || retryMsg.includes('citizen_id')) {
              console.warn("Retrying report insert without citizen_id on mobile due to foreign key constraint:", retryMsg);
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
          console.warn("Retrying report insert without citizen_id on mobile due to foreign key constraint:", errMsg);
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

      if (imageUrl && report) {
        const { error: imgError } = await supabase
          .from('report_images')
          .insert([{
            report_id: report.id,
            image_url: imageUrl,
            ai_label: reportData.category,
            ai_confidence: 90
          }]);
        if (imgError) {
          console.error("Supabase image insert error:", imgError);
        }
      }
      return report;
    }
    
    const reportObj = {
      ...reportData,
      report_images: imageUrl ? [{ image_url: imageUrl, ai_label: reportData.category, ai_confidence: 90 }] : []
    };
    return await localDB.addReport(reportObj);
  },

  async getNotifications() {
    await localDB.loadNotifications(); // Her çağırdığımızda güncel veriyi AsyncStorage'dan yükle
    return localDB.getNotifications();
  },

  async markNotificationsRead() {
    await localDB.markNotificationsRead();
  },

  async addNotification(title: string, message: string) {
    return await localDB.addNotification(title, message);
  },

  async upvoteReport(reportId: string, userId: string) {
    if (isRealSupabase && supabase) {
      // 1. upvotes tablosuna ekle
      const { error: upError } = await supabase
        .from('upvotes')
        .insert([{ report_id: reportId, user_id: userId }]);
      
      if (upError) {
        if (upError.code === '23505') { // Zaten upvote edilmiş
          throw new Error("Bu ihbarı zaten doğruladınız.");
        }
        throw upError;
      }

      // 2. İhbar bilgilerini çekip öncelik skorunu güncelleyelim
      const { data: report, error: repError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();
      if (repError) throw repError;

      const { data: allReports } = await supabase.from('reports').select('id, latitude, longitude, status');
      const nearbyCount = getNearbyReportsCount(report.latitude, report.longitude, allReports || []);
      const newUpvoteCount = (report.upvote_count || 0) + 1;
      const newPriorityScore = calculatePriorityScore(report.priority, newUpvoteCount, nearbyCount);

      // 3. İhbar tablosunu güncelle
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
      } catch (err: any) {
        const errMsg = err.message || '';
        const errCode = err.code || '';
        if (
          errCode === 'PGRST111' || errCode === 'PGRST204' || errCode === '42703' ||
          errMsg.includes('priority_score') || errMsg.includes('upvote_count') ||
          errMsg.includes('schema cache') || errMsg.includes('column')
        ) {
          console.warn("Retrying upvote update without advanced columns on mobile:", errMsg);
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
    }
    return await localDB.upvoteReport(reportId, userId);
  },

  async addComment(reportId: string, message: string, userName: string = "Belediye Ekibi", isInternal: boolean = false, userId: string | null = null) {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          report_id: reportId,
          user_id: userId,
          message,
          is_internal: isInternal
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      if (typeof window !== 'undefined') {
        try {
          const stored = await AsyncStorage.getItem('civicfix_comments');
          const comments = stored ? JSON.parse(stored) : [];
          const newComment = {
            id: "com-" + Math.floor(Math.random() * 10000),
            report_id: reportId,
            user_name: userName,
            message,
            is_internal: isInternal,
            created_at: new Date().toISOString()
          };
          comments.push(newComment);
          await AsyncStorage.setItem('civicfix_comments', JSON.stringify(comments));
          return newComment;
        } catch (e) {
          console.error(e);
        }
      }
      return null;
    }
  },

  async resolveReport(reportId: string, resolvedImageUrl: string) {
    if (isRealSupabase && supabase) {
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
      } catch (err: any) {
        const errMsg = err.message || '';
        const errCode = err.code || '';
        if (
          errCode === 'PGRST111' || errCode === 'PGRST204' || errCode === '42703' ||
          errMsg.includes('resolved_image_url') || errMsg.includes('schema cache') || errMsg.includes('column')
        ) {
          console.warn("Retrying resolve report update without resolved_image_url on mobile:", errMsg);
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
      if (typeof window !== 'undefined') {
        try {
          const stored = await AsyncStorage.getItem('civicfix_reports');
          const reports = stored ? JSON.parse(stored) : [];
          const idx = reports.findIndex((r: any) => r.id === reportId);
          if (idx !== -1) {
            reports[idx].status = 'Çözüldü';
            reports[idx].resolved_image_url = resolvedImageUrl;
            reports[idx].updated_at = new Date().toISOString();
            await AsyncStorage.setItem('civicfix_reports', JSON.stringify(reports));

            await localDB.updateLocalProfileScore(5);
          }
        } catch (e) {
          console.error(e);
        }
      }
      return null;
    }
  },

  async getProfile(userId: string) {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        // Profil bulunamadıysa (misafir modundaysa vb.) yerel profili dön ama userId UUID'sini koru
        console.warn("Profil çekilemedi, yerel profile dönülüyor:", error.message);
        const localProf = localDB.getProfile();
        return {
          ...localProf,
          id: userId
        };
      }
      if (data && data.role === 'field_team') {
        data.role = 'worker';
      }
      return data;
    }
    return localDB.getProfile();
  },

  async updateLocalProfileScore(amount: number) {
    await localDB.updateLocalProfileScore(amount);
  },

  async getWorkers() {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['worker', 'field_team'])
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      if (typeof window !== 'undefined') {
        try {
          const stored = await AsyncStorage.getItem('civicfix_mock_users');
          if (stored) {
            const localUsers = JSON.parse(stored);
            return localUsers
              .filter((u: any) => u.role === 'worker' || u.role === 'field_team')
              .map((u: any, idx: number) => ({
                id: u.email ? 'mock-' + u.email : 'mock-worker-' + idx,
                full_name: u.fullName || u.full_name || u.email,
                role: 'worker',
                phone_number: u.phoneNumber || u.phone_number || '',
                department: u.department || 'Genel'
              }));
          }
        } catch (e) {
          console.error(e);
        }
      }
      return [
        { id: "worker-user", full_name: "Saha Ustası Ahmet", role: "worker", department: "Yol Bakım", phone_number: "0555 123 45 67" }
      ];
    }
  },

  async updateWorkerDepartment(workerId: string, department: string) {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ department })
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
      if (typeof window !== 'undefined') {
        try {
          const stored = await AsyncStorage.getItem('civicfix_mock_users');
          if (stored) {
            const localUsers = JSON.parse(stored);
            const index = localUsers.findIndex((u: any) => u.email === workerId || ('mock-' + u.email) === workerId || u.id === workerId);
            if (index !== -1) {
              localUsers[index].department = department;
              await AsyncStorage.setItem('civicfix_mock_users', JSON.stringify(localUsers));
              return localUsers[index];
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      return { id: workerId, department };
    }
  }
};
