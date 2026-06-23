import React, { useState } from 'react';
import { Shield, Hammer, User, ArrowRight, Lock, Mail, UserPlus, LogIn, Phone } from 'lucide-react';
import { supabase, isRealSupabase } from '../../services/dbService';

const MOCK_CREDENTIALS = [];

export default function LoginPortal({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const roles = [
    {
      id: 'admin',
      title: 'Belediye Yöneticisi (Admin)',
      description: 'Sistem metriklerini izleyin, arızaları analiz edin ve saha ekiplerini koordine edin.',
      icon: Shield,
      color: 'from-blue-600 to-indigo-650 text-blue-650 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50',
    },
    {
      id: 'worker',
      title: 'Saha Görevlisi (İşçi)',
      description: 'Size atanan görevleri görüntüleyin, durumlarını güncelleyin ve çözümleri fotoğraflarla kapatın.',
      icon: Hammer,
      color: 'from-amber-500 to-orange-650 text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50',
    },
    {
      id: 'citizen',
      title: 'Sivil Vatandaş',
      description: 'Arıza bildiriminde bulunun, bölgenizdeki diğer sorunları oylayın ve SLA sürelerini izleyin.',
      icon: User,
      color: 'from-emerald-500 to-teal-650 text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50',
    },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    try {
      if (isRealSupabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        // Profiles tablosundan rolü ve ismi çekelim
        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profError) throw profError;

        const userRole = profile.role === 'field_team' ? 'worker' : profile.role;
        onLogin(userRole, profile.full_name, profile.id);
      } else {
        // Çevrimdışı / Mock Giriş Kontrolü
        const lowerEmail = email.toLowerCase().trim();
        // 1. Sabit mock kullanıcıları kontrol et
        let matchedUser = MOCK_CREDENTIALS.find(
          u => u.email === lowerEmail && u.password === password
        );
        
        // 2. LocalStorage'daki mock kullanıcıları kontrol et
        if (!matchedUser) {
          const localUsers = JSON.parse(localStorage.getItem('civicfix_mock_users') || '[]');
          matchedUser = localUsers.find(
            u => u.email === lowerEmail && u.password === password
          );
        }

        if (matchedUser) {
          onLogin(matchedUser.role, matchedUser.fullName, matchedUser.id || 'citizen-user');
        } else {
          throw new Error('E-posta veya şifre hatalı. (Çevrimdışı test hesapları aşağıda belirtilmiştir)');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setErrorMessage('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const ADMIN_SIGNUP_CODE = 'belediye123';
    const WORKER_SIGNUP_CODE = 'saha123';
    
    if (selectedRole === 'admin' && adminCode !== ADMIN_SIGNUP_CODE) {
      setErrorMessage('Geçersiz Admin Yetkilendirme Kodu.');
      return;
    }
    if (selectedRole === 'worker' && adminCode !== WORKER_SIGNUP_CODE) {
      setErrorMessage('Geçersiz Saha Görevlisi Yetkilendirme Kodu.');
      return;
    }

    setLoading(true);
    try {
      if (isRealSupabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: selectedRole === 'worker' ? 'field_team' : selectedRole,
              phone_number: phoneNumber
            }
          }
        });
        if (error) throw error;
        
        alert('Kayıt başarılı! Şimdi e-posta adresinizle giriş yapabilirsiniz.');
        setMode('login');
      } else {
        // Çevrimdışı / Mock Kayıt
        const lowerEmail = email.toLowerCase().trim();
        const localUsers = JSON.parse(localStorage.getItem('civicfix_mock_users') || '[]');
        
        // E-posta çakışması kontrolü
        const exists = MOCK_CREDENTIALS.some(u => u.email === lowerEmail) || 
                       localUsers.some(u => u.email === lowerEmail);
        
        if (exists) {
          throw new Error('Bu e-posta adresiyle kayıtlı bir hesap zaten var.');
        }

        const newUser = {
          email: lowerEmail,
          password,
          fullName,
          role: selectedRole,
          phoneNumber
        };

        localUsers.push(newUser);
        localStorage.setItem('civicfix_mock_users', JSON.stringify(localUsers));
        
        alert('Çevrimdışı kayıt başarılı! E-posta ve şifrenizle giriş yapabilirsiniz.');
        setMode('login');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Kayıt olurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      
      {/* Background blobs for premium glassmorphism feel */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-2xl relative z-10 space-y-7">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg mb-1">
            <span className="text-xl font-black">📍</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            CivicFix Akıllı Kent Sistemleri
          </h2>
          <p className="text-3xs text-slate-400">
            {mode === 'login' && 'E-posta ve şifrenizle hesabınıza giriş yapın'}
            {mode === 'signup' && 'Yeni bir hesap oluşturup sisteme katılın'}
          </p>
        </div>

        {/* Sekme Seçimi */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <button
            onClick={() => { setMode('login'); setErrorMessage(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-3xs transition-all ${
              mode === 'login' ? 'bg-white dark:bg-slate-800 shadow text-brand-600 dark:text-white' : 'text-slate-500'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Giriş Yap
          </button>
          <button
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-3xs transition-all ${
              mode === 'signup' ? 'bg-white dark:bg-slate-800 shadow text-brand-600 dark:text-white' : 'text-slate-500'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Kayıt Ol
          </button>
        </div>

        {/* Hata Mesajı */}
        {errorMessage ? (
          <div className="p-3 bg-red-50/20 border border-red-200 rounded-xl text-red-600 dark:text-red-400 text-4xs font-bold">
            ⚠️ {errorMessage}
          </div>
        ) : null}

        {/* 1. GİRİŞ YAP FORMU */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-4xs font-bold text-slate-450 uppercase">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e-posta@belediye.bel.tr..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2.5 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-4xs font-bold text-slate-450 uppercase">Hesap Şifresi</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2.5 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-650 text-white font-bold text-2xs py-2.5 rounded-xl shadow-lg hover:scale-[1.01] transition-all"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Hesaba Giriş Yap'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* 2. KAYIT OL FORMU */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-4xs font-bold text-slate-450 uppercase">Ad Soyad (Zorunlu)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Adınız ve Soyadınız..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-4xs font-bold text-slate-450 uppercase">Telefon Numarası</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="0555 555 5555"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-4xs font-bold text-slate-450 uppercase">Sistem Rolünüz</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-2xs font-semibold text-slate-750 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="citizen">👤 Sivil Vatandaş (Arıza Bildirimi)</option>
                <option value="worker">👷 Saha Görevlisi / İşçi</option>
                <option value="admin">📊 Belediye Yöneticisi (Admin)</option>
              </select>
            </div>

            {(selectedRole === 'admin' || selectedRole === 'worker') && (
              <div className="space-y-1">
                <label className="block text-4xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                  {selectedRole === 'admin' ? 'Admin Yetkilendirme Kodu' : 'İşçi Yetkilendirme Kodu'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-amber-500" />
                  <input
                    type="password"
                    required
                    placeholder={selectedRole === 'admin' ? 'Belediye admin davet kodunu girin...' : 'Saha görevlisi davet kodunu girin...'}
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 dark:border-amber-950 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-4xs font-bold text-slate-450 uppercase">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e-posta@adresiniz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-4xs font-bold text-slate-450 uppercase">Hesap Şifresi</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="En az 6 karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-2xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-650 text-white font-bold text-2xs py-2.5 rounded-xl shadow-lg hover:scale-[1.01] transition-all"
            >
              {loading ? 'Kayıt Yapılıyor...' : 'Sisteme Kayıt Ol'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}



      </div>
    </div>
  );
}
