import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbService } from '../services/dbService';
import { aiService } from '../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapComponent from '../components/MapComponent';

const { width } = Dimensions.get('window');

const DEFAULT_REPORT_IMAGE = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=60";

function MobileSLACountdown({ deadline, status }: { deadline: string | null, status: string }) {
  const [timeStr, setTimeStr] = useState('');
  const [isViolated, setIsViolated] = useState(false);

  useEffect(() => {
    if (status === 'Çözüldü') {
      setTimeStr('Çözüldü');
      return;
    }
    if (!deadline) {
      setTimeStr('-');
      return;
    }

    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeStr('Süresi Geçti (SLA İhlali)');
        setIsViolated(true);
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        setTimeStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        setIsViolated(false);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline, status]);

  if (status === 'Çözüldü') {
    return <Text style={{ fontSize: 9, color: '#16a34a', fontWeight: 'bold' }}>✅ Zamanında Çözüldü</Text>;
  }
  if (!deadline) return null;

  return (
    <Text style={{ 
      fontSize: 9, 
      color: isViolated ? '#ef4444' : '#475569', 
      fontWeight: 'bold', 
      marginTop: 4 
    }}>
      {isViolated ? '⚠️ SLA İhlali (Gecikme)' : `⏱️ Kalan Süre: ${timeStr}`}
    </Text>
  );
}

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [role, setRole] = useState<'citizen' | 'worker' | 'admin'>('citizen');
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'notifications'>('create');
  const [subTab, setSubTab] = useState<'community' | 'personal'>('community');
  
  // Form State
  const [description, setDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(39.8972);
  const [longitude, setLongitude] = useState(32.7794);
  const [address, setAddress] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // AI State
  const [aiResult, setAiResult] = useState({ category: 'Yol Bakım', priority: 'Normal', confidence: 0 });
  const [duplicateReport, setDuplicateReport] = useState<any>(null);

  // Harita ve Filtreleme State'leri
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [distanceLimit, setDistanceLimit] = useState<string>('All');
  const [userGps, setUserGps] = useState<[number, number]>([39.8972, 32.7794]);
  
  // Listeler ve Profil
  const [reports, setReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ trust_score: 100, badge: 'Yeni Vatandaş' });
  const [myLocalReps, setMyLocalReps] = useState<string[]>([]);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRole, setAuthRole] = useState<'citizen' | 'worker' | 'admin'>('citizen');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authAdminCode, setAuthAdminCode] = useState('');

  // 1. Verileri Çek
  const loadData = async (userId?: string) => {
    const reps = await dbService.getReports();
    const notifs = await dbService.getNotifications();
    setReports(reps);
    setNotifications(notifs);

    try {
      const activeId = userId || profile?.id || 'citizen-user';
      const prof = await dbService.getProfile(activeId);
      if (prof) {
        setProfile(prof);
      }
    } catch (err) {
      console.warn("Failed to load profile details:", err);
    }
  };

  const handleAuthSubmit = async () => {
    setAuthError('');
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    if (authMode === 'signup' && !authFullName.trim()) {
      setAuthError('Lütfen adınızı ve soyadınızı girin.');
      return;
    }

    if (authMode === 'signup') {
      if (authRole === 'admin') {
        const ADMIN_SIGNUP_CODE = 'belediye123';
        if (authAdminCode !== ADMIN_SIGNUP_CODE) {
          setAuthError('Geçersiz Admin Yetkilendirme Kodu.');
          return;
        }
      } else if (authRole === 'worker') {
        const WORKER_SIGNUP_CODE = 'saha123';
        if (authAdminCode !== WORKER_SIGNUP_CODE) {
          setAuthError('Geçersiz Saha Görevlisi Yetkilendirme Kodu.');
          return;
        }
      }
    }

    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const profileData = await dbService.signIn(authEmail, authPassword);
        setIsAuthenticated(true);
        setRole(profileData.role);
        setLoginName(profileData.full_name || profileData.fullName);
        setProfile(profileData);
        if (typeof window !== 'undefined') {
          await AsyncStorage.setItem('civicfix_session', JSON.stringify(profileData));
        }
        await loadData(profileData.id);
        Alert.alert("Giriş Başarılı", `Hoş geldiniz, ${profileData.full_name || profileData.fullName}`);
      } else {
        await dbService.signUp(authEmail, authPassword, authFullName, authRole, authPhone);
        Alert.alert("Başarılı 🎉", "Kayıt işlemi başarılı! Şimdi e-posta ve şifrenizle giriş yapabilirsiniz.");
        setAuthMode('login');
        setAuthPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Bir hata oluştu.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setRole('citizen');
    setLoginName('');
    if (typeof window !== 'undefined') {
      await AsyncStorage.removeItem('civicfix_session');
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (typeof window === 'undefined') return;
      try {
        const savedSession = await AsyncStorage.getItem('civicfix_session');
        if (savedSession) {
          const sess = JSON.parse(savedSession);
          setIsAuthenticated(true);
          setRole(sess.role);
          setLoginName(sess.full_name || sess.fullName);
          setProfile(sess);
          loadData(sess.id);
        } else {
          loadData();
        }
      } catch (err) {
        console.error("Session restore error:", err);
        loadData();
      }
    };
    checkSession();

    // Supabase Realtime Aboneliği (Gerçek Zamanlı Bildirim ve Durum Kesmesi)
    if (dbService.isRealSupabase && dbService.supabase) {
      const channel = dbService.supabase
        .channel('db-realtime-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'reports' },
          (payload: any) => {
            loadData(); // Verileri yeniden yükle
            
            const newReport = payload.new;
            const oldReport = payload.old;
            
            // Yalnızca durum (status) değiştiyse bildirim göster
            if (newReport && (!oldReport || newReport.status !== oldReport.status)) {
              Alert.alert(
                "İhbar Durumu Güncellendi 🔔",
                `"${newReport.title}" başlıklı ihbarınızın durumu '${newReport.status}' olarak güncellendi.`
              );
              
              // Yerel bildirim listesine ekle
              dbService.addNotification(
                `Durum Güncellemesi`,
                `"${newReport.title}" ihbarınız '${newReport.status}' aşamasına taşındı.`
              ).then(() => {
                loadData();
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload: any) => {
            loadData(); // Bildirimleri yenile
            
            const newNotif = payload.new;
            if (newNotif) {
              Alert.alert(
                newNotif.title || "Yeni Bildirim",
                newNotif.message || "Ekiplerimizden yeni bir bildirim aldınız."
              );
            }
          }
        )
        .subscribe();

      return () => {
        dbService.supabase?.removeChannel(channel);
      };
    }
  }, []);

  // GPS konumunu otomatik çekme (Takip sekmesi veya ana ekran açıldığında)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserGps([lat, lng]);
          setLatitude(lat);
          setLongitude(lng);
        },
        (err) => console.warn("Mobile auto-GPS error:", err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [activeTab]);

  // Cihazın yerel belleğinden oluşturulan ihbarları yükle
  useEffect(() => {
    const loadLocalReps = async () => {
      try {
        if (typeof window !== 'undefined') {
          const val = localStorage.getItem('civicfix_my_reports');
          if (val) setMyLocalReps(JSON.parse(val));
        } else {
          const val = await AsyncStorage.getItem('civicfix_my_reports');
          if (val) setMyLocalReps(JSON.parse(val));
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadLocalReps();
  }, [reports]);

  // 2. Açıklama Değiştikçe AI Analizi
  useEffect(() => {
    if (!description.trim()) {
      setAiResult({ category: 'Yol Bakım', priority: 'Normal', confidence: 0 });
      setDuplicateReport(null);
      return;
    }

    const res = aiService.analyzeDescription(description);
    setAiResult(res);

    // Mükerrer Kayıt Arama (50 metre)
    aiService.checkDuplicate(latitude, longitude, res.category, reports)
      .then(dup => {
        setDuplicateReport(dup);
      });

  }, [description, latitude, longitude]);
  // 3. Preset Fotoğraf Seçildiğinde (Kaldırıldı)

  // Cihazdan Fotoğraf Yükleme (React Native Web File Picker ve Sıkıştırma)
  const handleUploadPhoto = () => {
    if (typeof document === 'undefined') {
      Alert.alert("Desteklenmiyor", "Bu özellik şu anki platformda desteklenmiyor.");
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const img = new window.Image();
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

            // Sıkıştırılmış Base64 JPEG oluştur (kalite 0.7)
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
            setSelectedPhoto(compressedUrl);
            Alert.alert("Başarılı 📸", "Görsel başarıyla yüklendi ve optimize edildi!");
          };
          img.onerror = () => {
            Alert.alert("Hata", "Görsel yüklenirken bir hata oluştu.");
          };
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Cihazdan Kamerayı Açma (React Native Web için capture özniteliği ile)
  const handleLaunchCamera = () => {
    if (typeof document === 'undefined') {
      Alert.alert("Desteklenmiyor", "Bu özellik şu anki platformda desteklenmiyor.");
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const img = new window.Image();
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

            // Sıkıştırılmış Base64 JPEG oluştur
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
            setSelectedPhoto(compressedUrl);
            Alert.alert("Başarılı 📸", "Görsel kameradan başarıyla alındı ve optimize edildi!");
          };
          img.onerror = () => {
            Alert.alert("Hata", "Görsel yüklenirken bir hata oluştu.");
          };
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // GPS Konumu Al
  const handleGetGPSLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          Alert.alert(
            "Konum Alındı 📍", 
            `GPS konumunuz başarıyla yüklendi: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
          );
        },
        (error) => {
          console.warn(error);
          Alert.alert(
            "Konum Hatası", 
            "GPS konumu alınamadı. Lütfen tarayıcı/cihaz konum izinlerini kontrol edin veya koordinatları elinizle girin."
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      Alert.alert("Desteklenmiyor", "Cihazınızda GPS konumu desteklenmiyor.");
    }
  };

  // 4. İhbar Kaydet
  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Hata", "Lütfen bir açıklama yazın.");
      return;
    }

    const reportData = {
      title: `${aiResult.category} Bildirimi`,
      description,
      category: aiResult.category,
      priority: aiResult.priority,
      latitude,
      longitude,
      address: address.trim() || `Vatandaş Konumu (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      citizen_id: profile?.id || 'citizen-user',
      status: "Yeni"
    };

    try {
      const report = await dbService.createReport(reportData, selectedPhoto);
      Alert.alert("Başarılı", "İhbarınız başarıyla belediye ekiplerine iletildi.");
      
      if (report && report.id) {
        try {
          if (typeof window !== 'undefined') {
            const myReps = JSON.parse(localStorage.getItem('civicfix_my_reports') || '[]');
            myReps.push(report.id);
            localStorage.setItem('civicfix_my_reports', JSON.stringify(myReps));
          } else {
            const val = await AsyncStorage.getItem('civicfix_my_reports');
            const myReps = val ? JSON.parse(val) : [];
            myReps.push(report.id);
            await AsyncStorage.setItem('civicfix_my_reports', JSON.stringify(myReps));
          }
        } catch (e) {
          console.warn("Saving local report ID failed:", e);
        }
      }

      // Form Temizle
      setDescription('');
      setSelectedPhoto(null);
      setAddress('');
      setDuplicateReport(null);
      await loadData();
      setActiveTab('list'); // Takip sekmesine geç
      setSubTab('personal'); // Kendi ihbarlarını aç
    } catch (err) {
      Alert.alert("Hata", "İhbar gönderilirken bir hata oluştu.");
    }
  };
  // 5. Upvote (Ben de Görüyorum)
  const handleUpvote = async (reportId: string) => {
    try {
      await dbService.upvoteReport(reportId, profile?.id || 'citizen-user');
      Alert.alert("Başarılı 👍", "Topluluk doğrulaması iletildi. Öncelik skoru güncellendi.");
      await loadData();
    } catch (err: any) {
      Alert.alert("Bilgi", err.message || "Bu ihbarı zaten doğruladınız.");
    }
  };

  // Zaman Çizelgesi Render
  const renderTimeline = (status: string) => {
    const steps = ['Yeni', 'İnceleniyor', 'Atandı', 'Sahada', 'Çözüldü'];
    const currentIdx = steps.indexOf(status);

    return (
      <View style={styles.timelineContainer}>
        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          return (
            <React.Fragment key={step}>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, isDone && styles.timelineDotDone]}>
                  {isDone && <Text style={styles.timelineCheck}>✓</Text>}
                </View>
                <Text style={styles.timelineLabel}>{step}</Text>
              </View>
              {idx < steps.length - 1 && (
                <View style={[styles.timelineLine, idx < currentIdx && styles.timelineLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // Mesafe hesaplama (Haversine formülü)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  // Tab filtreleme
  const filteredReports = reports
    .filter(r => subTab === 'personal' ? (
      r.citizen_id === profile?.id || 
      r.citizen_id === 'citizen-user' || 
      r.citizen_name === 'Yurttaş Can' ||
      myLocalReps.includes(r.id)
    ) : true)
    .filter(r => categoryFilter === 'All' ? true : r.category === categoryFilter)
    .filter(r => {
      if (distanceLimit === 'All') return true;
      const limit = parseFloat(distanceLimit);
      return getDistance(userGps[0], userGps[1], r.latitude, r.longitude) <= limit;
    });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <ScrollView contentContainerStyle={styles.loginScroll}>
          <View style={styles.loginCard}>
            <View style={styles.loginLogoContainer}>
              <Text style={styles.loginLogo}>📍</Text>
              <Text style={styles.loginTitle}>CivicFix Mobil</Text>
              <Text style={styles.loginSubtitle}>Akıllı Kent İhbar Sistemi</Text>
            </View>

            {/* Tab Selector */}
            <View style={styles.loginTabs}>
              <TouchableOpacity 
                style={[styles.loginTab, authMode === 'login' && styles.loginTabActive]}
                onPress={() => { setAuthMode('login'); setAuthError(''); }}
              >
                <Text style={[styles.loginTabText, authMode === 'login' && styles.loginTabTextActive]}>Giriş Yap</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.loginTab, authMode === 'signup' && styles.loginTabActive]}
                onPress={() => { setAuthMode('signup'); setAuthError(''); }}
              >
                <Text style={[styles.loginTabText, authMode === 'signup' && styles.loginTabTextActive]}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>

            {authError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {authError}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            {authMode === 'signup' && (
              <>
                <Text style={styles.inputLabel}>AD SOYAD (Zorunlu)</Text>
                <TextInput
                  placeholder="Adınız ve Soyadınız"
                  placeholderTextColor="#94a3b8"
                  value={authFullName}
                  onChangeText={setAuthFullName}
                  style={styles.loginTextInput}
                />

                <Text style={styles.inputLabel}>TELEFON NUMARASI</Text>
                <TextInput
                  placeholder="0555 555 5555"
                  placeholderTextColor="#94a3b8"
                  value={authPhone}
                  onChangeText={setAuthPhone}
                  keyboardType="phone-pad"
                  style={styles.loginTextInput}
                />

                <Text style={styles.inputLabel}>SİSTEM ROLÜNÜZ</Text>
                <View style={styles.rolePickerContainer}>
                  <TouchableOpacity 
                    style={[styles.rolePickerItem, authRole === 'citizen' && styles.rolePickerItemActive]}
                    onPress={() => setAuthRole('citizen')}
                  >
                    <Text style={[styles.rolePickerItemText, authRole === 'citizen' && styles.rolePickerItemTextActive]}>👤 Vatandaş</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.rolePickerItem, authRole === 'worker' && styles.rolePickerItemActive]}
                    onPress={() => setAuthRole('worker')}
                  >
                    <Text style={[styles.rolePickerItemText, authRole === 'worker' && styles.rolePickerItemTextActive]}>👷 Saha</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.rolePickerItem, authRole === 'admin' && styles.rolePickerItemActive]}
                    onPress={() => setAuthRole('admin')}
                  >
                    <Text style={[styles.rolePickerItemText, authRole === 'admin' && styles.rolePickerItemTextActive]}>📊 Admin</Text>
                  </TouchableOpacity>
                </View>

                {(authRole === 'admin' || authRole === 'worker') && (
                  <>
                    <Text style={[styles.inputLabel, { color: '#d97706' }]}>
                      {authRole === 'admin' ? 'ADMIN YETKİLENDİRME KODU' : 'İŞÇİ YETKİLENDİRME KODU'}
                    </Text>
                    <TextInput
                      placeholder={authRole === 'admin' ? 'Belediye admin davet kodunu girin...' : 'Saha görevlisi davet kodunu girin...'}
                      placeholderTextColor="#fcd34d"
                      value={authAdminCode}
                      onChangeText={setAuthAdminCode}
                      secureTextEntry
                      style={[styles.loginTextInput, { borderColor: '#fcd34d', color: '#b45309' }]}
                    />
                  </>
                )}
              </>
            )}

            <Text style={styles.inputLabel}>E-POSTA ADRESİ</Text>
            <TextInput
              placeholder="e-posta@adresiniz.com"
              placeholderTextColor="#94a3b8"
              value={authEmail}
              onChangeText={setAuthEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.loginTextInput}
            />

            <Text style={styles.inputLabel}>ŞİFRE</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              style={styles.loginTextInput}
            />

            <TouchableOpacity 
              onPress={handleAuthSubmit}
              disabled={authLoading}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>
                {authLoading ? 'İşlem Yapılıyor...' : authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            </TouchableOpacity>

            {/* Offline Test Credentials Info */}
            {authMode === 'login' && !dbService.isRealSupabase && (
              <View style={styles.mockInfoContainer}>
                <Text style={styles.mockInfoTitle}>⚡ Çevrimdışı Test Hesapları:</Text>
                <View style={styles.mockInfoRow}>
                  <View style={styles.mockInfoCol}>
                    <Text style={styles.mockInfoRoleText}>Admin</Text>
                    <Text style={styles.mockInfoValText}>admin@civicfix.com</Text>
                    <Text style={styles.mockInfoValText}>admin123</Text>
                  </View>
                  <View style={styles.mockInfoCol}>
                    <Text style={styles.mockInfoRoleText}>Saha</Text>
                    <Text style={styles.mockInfoValText}>worker@civicfix.com</Text>
                    <Text style={styles.mockInfoValText}>worker123</Text>
                  </View>
                  <View style={styles.mockInfoCol}>
                    <Text style={styles.mockInfoRoleText}>Vatandaş</Text>
                    <Text style={styles.mockInfoValText}>citizen@civicfix.com</Text>
                    <Text style={styles.mockInfoValText}>citizen123</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Üst Logo, Başlık ve Rozet */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>📍</Text>
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>CivicFix Mobil</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Hoş geldiniz, {loginName || 'Kullanıcı'}</Text>
          </View>
        </View>

        {/* Vatandaş Güven Skoru veya Çıkış */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {role === 'citizen' && (
            <View style={styles.profileBadgeContainer}>
              <Text style={styles.profileBadgeText}>{profile.badge || 'Yeni Vatandaş'}</Text>
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>⭐ {profile.trust_score || 100}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text style={styles.logoutBtnText}>Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Kaydırılabilir İçerik */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* ==================================================== */}
        {/* ROL 1: VATANDAŞ EKRANI                               */}
        {/* ==================================================== */}
        {role === 'citizen' && (
          <>
            {/* TAB 1: İHBAR OLUŞTURMA */}
            {activeTab === 'create' && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Yeni İhbar Oluştur</Text>
                {/* Fotoğraf Seçim Alanı */}
                <Text style={styles.label}>Arıza Fotoğrafı Ekle:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                  <TouchableOpacity 
                    style={styles.uploadImageBtn}
                    onPress={handleUploadPhoto}
                  >
                    <Text style={styles.uploadImageBtnIcon}>📸</Text>
                    <Text style={styles.uploadImageBtnText}>Cihazdan Seç</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.uploadImageBtn}
                    onPress={handleLaunchCamera}
                  >
                    <Text style={styles.uploadImageBtnIcon}>📷</Text>
                    <Text style={styles.uploadImageBtnText}>Kamerayı Aç</Text>
                  </TouchableOpacity>
                </View>

                {/* Seçilen Fotoğraf Önizleme */}
                {selectedPhoto && (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selectedPhoto }} style={styles.previewImage} />
                    <View style={styles.aiGlow}>
                      <Text style={styles.aiGlowText}>✨ Yapay Zekâ Sınıflandırması: %92 {aiResult.category}</Text>
                    </View>
                  </View>
                )}

                {/* Açıklama Girişi */}
                <Text style={styles.label}>Arıza Detayları:</Text>
                <TextInput
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Sorunu kısaca açıklayın (örn. çukur var, su akıyor, sokak lambası yanmıyor)..."
                  value={description}
                  onChangeText={setDescription}
                />

                {/* AI Realtime Sınıflandırma Kutusu */}
                {description.length > 0 && (
                  <View style={styles.aiBox}>
                    <Text style={styles.aiBoxTitle}>🧠 Yapay Zekâ Çözümlemesi:</Text>
                    <View style={styles.aiTags}>
                      <Text style={styles.aiTag}>Kategori: {aiResult.category}</Text>
                      <Text style={styles.aiTag}>Öncelik: {aiResult.priority}</Text>
                    </View>
                  </View>
                )}

                {/* Mükerrer Bildirim Risk Uyarısı */}
                {duplicateReport && (
                  <View style={styles.duplicateBox}>
                    <Text style={styles.duplicateTitle}>⚠ Mükerrer İhbar Algılandı</Text>
                    <Text style={styles.duplicateText}>
                      {duplicateReport.distance} metre yakınında aynı kategoride açık bir kayıt bulunuyor. Ekipler zaten durumdan haberdar!
                    </Text>
                  </View>
                )}

                {/* Konum Belirleme */}
                <Text style={styles.label}>Arıza Açık Adresi (Zorunlu):</Text>
                <TextInput
                  style={[styles.textInput, { marginBottom: 10 }]}
                  placeholder="Sokak, mahalle, bina no ve kapı no gibi açık adres tarifi yazın..."
                  value={address}
                  onChangeText={setAddress}
                />

                <Text style={styles.label}>Koordinatlar (GPS):</Text>
                <View style={styles.coordsBox}>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>ENLEM (LATITUDE)</Text>
                      <TextInput
                        style={styles.coordsInput}
                        value={String(latitude)}
                        onChangeText={(val) => setLatitude(parseFloat(val) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>BOYLAM (LONGITUDE)</Text>
                      <TextInput
                        style={styles.coordsInput}
                        value={String(longitude)}
                        onChangeText={(val) => setLongitude(parseFloat(val) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.gpsButton, { backgroundColor: '#4f46e5', borderColor: '#4f46e5' }]}
                    onPress={handleGetGPSLocation}
                  >
                    <Text style={[styles.gpsButtonText, { color: '#ffffff', textAlign: 'center' }]}>📍 GPS Konumumu Al</Text>
                  </TouchableOpacity>
                </View>
                {/* Gönder Butonu */}
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>İhbarı Ekiplere Gönder 🚀</Text>
                </TouchableOpacity>

              </View>
            )}

            {/* TAB 2: İHBARLARIM VEYA ÇEVRE İHBARLARI (TAKİP) */}
            {activeTab === 'list' && (
              <View style={styles.listContainer}>
                
                {/* Alt Sekmeler */}
                <View style={styles.subTabBar}>
                  <TouchableOpacity 
                    style={[styles.subTabItem, subTab === 'community' && styles.subTabItemActive]}
                    onPress={() => setSubTab('community')}
                  >
                    <Text style={[styles.subTabText, subTab === 'community' && styles.subTabTextActive]}>👥 Çevre İhbarları</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.subTabItem, subTab === 'personal' && styles.subTabItemActive]}
                    onPress={() => setSubTab('personal')}
                  >
                    <Text style={[styles.subTabText, subTab === 'personal' && styles.subTabTextActive]}>👤 Benim Bildirdiklerim</Text>
                  </TouchableOpacity>
                </View>

                {/* Filtre Kontrolleri */}
                <View style={styles.filterContainer}>
                  <Text style={styles.filterLabel}>Kategori Filtrele:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterCategoriesScroll}>
                    {['All', 'Yol Bakım', 'Su ve Kanalizasyon', 'Aydınlatma', 'Atık Yönetimi', 'Trafik ve Tabela', 'Çevre ve Parklar'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.filterCategoryBtn,
                          categoryFilter === cat && styles.filterCategoryBtnActive
                        ]}
                        onPress={() => setCategoryFilter(cat)}
                      >
                        <Text style={[
                          styles.filterCategoryText,
                          categoryFilter === cat && styles.filterCategoryTextActive
                        ]}>
                          {cat === 'All' ? 'Tümü' : cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.filterLabel}>Mesafe Filtrele (Uzaklık Limiti):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterCategoriesScroll}>
                    {[
                      { value: 'All', label: 'Tümü' },
                      { value: '1.5', label: '1.5 km' },
                      { value: '5.0', label: '5 km' },
                      { value: '15.0', label: '15 km' },
                      { value: '50.0', label: '50 km' }
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.filterCategoryBtn,
                          distanceLimit === item.value && styles.filterCategoryBtnActive
                        ]}
                        onPress={() => setDistanceLimit(item.value)}
                      >
                        <Text style={[
                          styles.filterCategoryText,
                          distanceLimit === item.value && styles.filterCategoryTextActive
                        ]}>
                          📍 {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Harita */}
                <View style={styles.mapWrapper}>
                  <MapComponent 
                    userGps={userGps}
                    reports={filteredReports}
                    distanceLimit={distanceLimit}
                  />
                </View>

                <Text style={styles.sectionTitle}>
                  {subTab === 'community' ? 'Çevredeki Diğer İhbarlar' : 'İhbarlarım ve Süreç Takibi'}
                </Text>

                {filteredReports.length === 0 ? (
                  <Text style={styles.emptyText}>Gösterilecek ihbar bulunmuyor.</Text>
                ) : (
                  filteredReports.map((rep) => (
                    <View key={rep.id} style={styles.reportCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardId}>#{rep.id.replace('rep-', '')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={styles.cardCategory}>{rep.category}</Text>
                          {rep.priority_score && (
                            <Text style={styles.priorityPill}>🔥 {rep.priority_score}</Text>
                          )}
                        </View>
                      </View>

                      {/* Arıza Görseli (Sadece Çözüldü olmayanlar için) */}
                      {rep.status !== 'Çözüldü' && rep.report_images?.[0]?.image_url && (
                        <TouchableOpacity 
                          style={styles.cardImageContainer}
                          onPress={() => setLightboxImage(rep.report_images[0].image_url)}
                          activeOpacity={0.9}
                        >
                          <Image 
                            source={{ uri: rep.report_images[0].image_url }} 
                            style={styles.cardImage} 
                            resizeMode="cover"
                          />
                          <View style={styles.zoomIndicator}>
                            <Text style={styles.zoomIndicatorText}>🔎 Büyüt</Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      <Text style={styles.cardTitle}>{rep.title}</Text>
                      <Text style={styles.cardDesc}>{rep.description}</Text>
                      
                      {/* SLA Countdown */}
                      <MobileSLACountdown deadline={rep.sla_deadline} status={rep.status} />

                      {/* Before / After Photo Comparison */}
                      {rep.status === 'Çözüldü' && (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.comparisonLabel}>ÖNCESİ (İHBAR)</Text>
                            <TouchableOpacity 
                              activeOpacity={0.9} 
                              onPress={() => setLightboxImage(rep.report_images?.[0]?.image_url || DEFAULT_REPORT_IMAGE)}
                            >
                              <Image 
                                source={{ uri: rep.report_images?.[0]?.image_url || DEFAULT_REPORT_IMAGE }} 
                                style={styles.comparisonImg} 
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          </View>
                          {rep.resolved_image_url && (
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.comparisonLabel, { color: '#10b981' }]}>SONRASI (ÇÖZÜM)</Text>
                              <TouchableOpacity 
                                activeOpacity={0.9} 
                                onPress={() => setLightboxImage(rep.resolved_image_url)}
                              >
                                <Image 
                                  source={{ uri: rep.resolved_image_url }} 
                                  style={styles.comparisonImg} 
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Zaman Çizelgesi */}
                      {renderTimeline(rep.status)}

                      {/* Ben de Görüyorum (Upvote) Butonu */}
                      {rep.status !== 'Çözüldü' && (
                        <TouchableOpacity 
                          style={styles.upvoteButton} 
                          onPress={() => handleUpvote(rep.id)}
                        >
                          <Text style={styles.upvoteButtonText}>👍 Ben de Aynı Sorunu Görüyorum ({rep.upvote_count || 0})</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 3: BİLDİRİMLER */}
            {activeTab === 'notifications' && (
              <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Sistem Bildirimleri</Text>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyText}>Henüz yeni bildiriminiz yok.</Text>
                ) : (
                  notifications.map((notif) => (
                    <View key={notif.id} style={styles.notifCard}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifBody}>{notif.message}</Text>
                      <Text style={styles.notifTime}>{new Date(notif.created_at).toLocaleTimeString()}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* ROL 2: SAHA ÇALIŞANI (İŞÇİ) EKRANI                    */}
        {/* ==================================================== */}
        {role === 'worker' && (() => {
          const workerReps = reports.filter(r => {
            const statusMatch = r.status === 'Atandı' || r.status === 'Sahada';
            if (!statusMatch) return false;
            
            if (profile && profile.department && profile.department !== 'Genel') {
              const dept = profile.department.toLowerCase();
              const team = r.assignments?.assigned_team?.toLowerCase() || '';
              
              if (dept.includes('yol') && team.includes('yol')) return true;
              if (dept.includes('su') && team.includes('su')) return true;
              if (dept.includes('aydınlatma') && team.includes('aydınlatma')) return true;
              if (dept.includes('atık') && team.includes('atık')) return true;
              if (dept.includes('trafik') && team.includes('trafik')) return true;
              if (dept.includes('çevre') && (team.includes('çevre') || team.includes('park') || team.includes('bahçe'))) return true;
              if (dept.includes('park') && (team.includes('çevre') || team.includes('park') || team.includes('bahçe'))) return true;
              
              return false;
            }
            return true;
          });

          return (
            <View style={styles.workerContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>👷 Atanan Saha Görevleriniz</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                  onPress={() => loadData()}
                >
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#475569' }}>🔄 Yenile</Text>
                </TouchableOpacity>
              </View>

              {workerReps.length === 0 ? (
                <Text style={styles.emptyText}>Üzerinize atanan aktif bir görev bulunmuyor.</Text>
              ) : (
                workerReps.map((rep) => (
                  <View key={rep.id} style={styles.reportCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardId}>#{rep.id.replace('rep-', '')}</Text>
                      <Text style={[styles.cardCategory, { 
                        backgroundColor: rep.status === 'Atandı' ? '#fef3c7' : '#f3e8ff', 
                        color: rep.status === 'Atandı' ? '#d97706' : '#7c3aed' 
                      }]}>
                        {rep.status}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle}>{rep.title}</Text>
                    <Text style={styles.cardDesc}>{rep.description}</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>📍 Konum: {rep.address}</Text>

                  {/* SLA Deadline */}
                  <MobileSLACountdown deadline={rep.sla_deadline} status={rep.status} />

                  {/* Saha İşlemleri */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity 
                      style={[styles.workerActionButton, { backgroundColor: '#f3e8ff', borderColor: '#c084fc' }]}
                      onPress={async () => {
                        await dbService.addComment(rep.id, "Saha ekibi intikal etti, arıza üzerinde çalışılıyor.", "Saha Görevlisi", false);
                        // Status güncelleme
                        if (dbService.isRealSupabase && dbService.supabase) {
                          await dbService.supabase.from('reports').update({ status: 'Sahada' }).eq('id', rep.id);
                        } else {
                          const localReps = JSON.parse(localStorage.getItem('civicfix_reports') || '[]');
                          const idx = localReps.findIndex((r: any) => r.id === rep.id);
                          if (idx !== -1) {
                            localReps[idx].status = 'Sahada';
                            localStorage.setItem('civicfix_reports', JSON.stringify(localReps));
                          }
                        }
                        Alert.alert("Başarılı", "Çalışma durumu 'Sahada' olarak güncellendi.");
                        await loadData();
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#7c3aed' }}>👷 Sahaya İntikal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.workerActionButton, { backgroundColor: '#d1fae5', borderColor: '#34d399' }]}
                      onPress={async () => {
                        if (typeof document !== 'undefined') {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event: any) => {
                                const img = new window.Image();
                                img.src = event.target.result;
                                img.onload = async () => {
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
                                  try {
                                    await dbService.resolveReport(rep.id, compressedUrl);
                                    Alert.alert("Başarılı ✅", "Görev çözüldü olarak kapatıldı! Vatandaş puan kazandı.");
                                    await loadData();
                                  } catch (err: any) {
                                    Alert.alert("Hata", err.message || "Görev kapatılamadı.");
                                  }
                                };
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        } else {
                          const fixedPhoto = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500";
                          try {
                            await dbService.resolveReport(rep.id, fixedPhoto);
                            Alert.alert("Başarılı ✅", "Görev çözüldü olarak kapatıldı! Vatandaş puan kazandı.");
                            await loadData();
                          } catch (err: any) {
                            Alert.alert("Hata", err.message || "Görev kapatılamadı.");
                          }
                        }
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#059669' }}>✅ Görevi Kapat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            </View>
          );
        })()}

        {/* ==================================================== */}
        {/* ROL 3: YÖNETİCİ (ADMIN) EKRANI                       */}
        {/* ==================================================== */}
        {role === 'admin' && (
          <View style={styles.adminContainer}>
            <Text style={styles.sectionTitle}>📊 Yönetim İstatistikleri</Text>

            {/* Metrik Kartları */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={[styles.statCard, { flex: 1 }]}>
                <Text style={styles.statLabel}>Aktif İhbar</Text>
                <Text style={styles.statVal}>{reports.filter(r => r.status !== 'Çözüldü').length}</Text>
              </View>
              <View style={[styles.statCard, { flex: 1, backgroundColor: '#d1fae5' }]}>
                <Text style={[styles.statLabel, { color: '#065f46' }]}>Çözülen</Text>
                <Text style={[styles.statVal, { color: '#047857' }]}>{reports.filter(r => r.status === 'Çözüldü').length}</Text>
              </View>
            </View>

            <View style={[styles.statCard, { marginBottom: 15 }]}>
              <Text style={styles.statLabel}>SLA Başarı Oranı</Text>
              <Text style={[styles.statVal, { fontSize: 24 }]}>
                %{reports.filter(r => r.sla_deadline).length > 0 
                  ? Math.round((reports.filter(r => r.status === 'Çözüldü').length / reports.filter(r => r.sla_deadline).length) * 100)
                  : 100
                }
              </Text>
            </View>

            <Text style={[styles.label, { marginBottom: 8 }]}>Sistemdeki Tüm Bildirimler</Text>
            {reports.map((rep) => (
              <View key={rep.id} style={styles.reportCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardId}>#{rep.id.replace('rep-', '')}</Text>
                  <Text style={styles.cardCategory}>{rep.category}</Text>
                </View>
                <Text style={styles.cardTitle}>{rep.title}</Text>
                <Text style={styles.cardDesc}>Durum: {rep.status} | Öncelik Skoru: {rep.priority_score || 50}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Alt Navigasyon Barı (Sadece Vatandaş modunda görünür) */}
      {role === 'citizen' && (
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'create' && styles.navItemActive]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={styles.navIcon}>📷</Text>
            <Text style={[styles.navText, activeTab === 'create' && styles.navTextActive]}>İhbar Bildir</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'list' && styles.navItemActive]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={styles.navIcon}>📋</Text>
            <Text style={[styles.navText, activeTab === 'list' && styles.navTextActive]}>Takip Et</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'notifications' && styles.navItemActive]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={styles.navIcon}>🔔</Text>
            <Text style={[styles.navText, activeTab === 'notifications' && styles.navTextActive]}>Bildirimler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lightbox Modal */}
      <Modal
        visible={lightboxImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxImage(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLightboxImage(null)}
        >
          <View style={styles.modalContent}>
            {lightboxImage && (
              <Image 
                source={{ uri: lightboxImage }} 
                style={styles.modalImage} 
                resizeMode="contain" 
              />
            )}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setLightboxImage(null)}
            >
              <Text style={styles.modalCloseButtonText}>Kapat ×</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4338ca',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  profileBadgeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  profileBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4338ca',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  scorePill: {
    marginTop: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#fde68a',
  },
  scorePillText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#b45309',
  },
  roleSwitcherBar: {
    flexDirection: 'row',
    backgroundColor: '#cbd5e1',
    padding: 2.5,
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  roleTabActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  roleTabText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
  },
  roleTabTextActive: {
    color: '#4338ca',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 15,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderBottomWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  presetCard: {
    width: 65,
    height: 65,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetCardSelected: {
    borderColor: '#4338ca',
  },
  presetImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  presetText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 1,
    width: '105%',
    textAlign: 'center',
    bottom: 0,
    position: 'absolute',
  },
  previewContainer: {
    height: 120,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  aiGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(67, 56, 202, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  aiGlowText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
  },
  aiBox: {
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  aiBoxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#312e81',
  },
  aiTags: {
    flexDirection: 'row',
    marginTop: 5,
  },
  aiTag: {
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
    color: '#4338ca',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  duplicateBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  duplicateTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  duplicateText: {
    fontSize: 9,
    color: '#7f1d1d',
    marginTop: 3,
  },
  coordsBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  coordsText: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 3,
  },
  gpsButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  gpsButtonText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
  },
  submitButton: {
    backgroundColor: '#4338ca',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    width: '100%',
  },
  emptyText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 60,
    fontStyle: 'italic',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 15,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabItemActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  subTabText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
  },
  subTabTextActive: {
    color: '#4338ca',
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardId: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4338ca',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityPill: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#e11d48',
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  cardDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 14,
  },
  comparisonLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 3,
  },
  comparisonImg: {
    height: 85,
    width: '100%',
    borderRadius: 8,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 5,
  },
  timelineStep: {
    alignItems: 'center',
    zIndex: 1,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: '#4338ca',
  },
  timelineCheck: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  timelineLabel: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 4,
    fontWeight: 'bold',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: -6,
  },
  timelineLineDone: {
    backgroundColor: '#4338ca',
  },
  upvoteButton: {
    marginTop: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  upvoteButtonText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4338ca',
  },
  notifCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notifTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  notifBody: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 12,
  },
  notifTime: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },
  navBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navItemActive: {
    backgroundColor: '#f8fafc',
  },
  navIcon: {
    fontSize: 18,
  },
  navText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  navTextActive: {
    color: '#4338ca',
    fontWeight: 'bold',
  },
  workerContainer: {
    width: '100%',
  },
  adminContainer: {
    width: '100%',
  },
  workerActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loginScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLogo: {
    fontSize: 40,
    marginBottom: 10,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  loginTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  loginTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  loginTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loginTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  loginTabTextActive: {
    color: '#4338ca',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 10,
    color: '#b91c1c',
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 10,
  },
  loginTextInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 10,
  },
  rolePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 6,
  },
  rolePickerItem: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  rolePickerItemActive: {
    borderColor: '#4338ca',
    backgroundColor: '#e0e7ff',
  },
  rolePickerItemText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  rolePickerItemTextActive: {
    color: '#4338ca',
  },
  submitBtn: {
    backgroundColor: '#4338ca',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mockInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 20,
    paddingTop: 14,
  },
  mockInfoTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  mockInfoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mockInfoCol: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mockInfoRoleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4338ca',
    marginBottom: 2,
  },
  mockInfoValText: {
    fontSize: 8,
    color: '#64748b',
  },
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  logoutBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  uploadImageBtn: {
    width: 65,
    height: 65,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageBtnIcon: {
    fontSize: 18,
  },
  uploadImageBtnText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#4338ca',
    marginTop: 2,
    textAlign: 'center',
  },
  coordsInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6,
  },
  filterCategoriesScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterCategoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  filterCategoryBtnActive: {
    backgroundColor: '#4338ca',
  },
  filterCategoryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  filterCategoryTextActive: {
    color: '#ffffff',
  },
  nearbyToggleBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  nearbyToggleBtnActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#c7d2fe',
  },
  nearbyToggleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  nearbyToggleTextActive: {
    color: '#4338ca',
  },
  mapWrapper: {
    height: 200,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardImageContainer: {
    height: 140,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoomIndicatorText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
