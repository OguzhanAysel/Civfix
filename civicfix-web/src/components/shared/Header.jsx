import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Map, Layout, BarChart2, ShieldCheck, User, Users } from 'lucide-react';
import { dbService } from '../../services/dbService';

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  darkMode, 
  setDarkMode, 
  notifications, 
  setNotifications,
  role,
  loginName,
  onLogout
}) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = () => {
    dbService.markNotificationsAsRead();
    setNotifications(dbService.getNotifications());
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Sol Taraf: Logo ve İsim */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-350 bg-clip-text text-transparent">
              CivicFix
            </span>
            <span className="ml-2.5 rounded-full bg-brand-100 dark:bg-brand-900/80 px-2 py-0.5 text-2xs font-semibold text-brand-600 dark:text-brand-300">
              {role === 'admin' ? 'Yönetim' : role === 'worker' ? 'Saha Ekibi' : 'Vatandaş'}
            </span>
          </div>
        </div>

        {/* Orta Kısım: Sayfa Navigasyonu (Sadece Admin için) */}
        {role === 'admin' ? (
          <nav className="hidden md:flex items-center gap-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-1.2 border border-slate-200/40 dark:border-slate-800/30">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                currentTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              Gösterge Paneli
            </button>
            <button
              onClick={() => setCurrentTab('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                currentTab === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layout className="h-4 w-4" />
              Kanban Pano
            </button>
            <button
              onClick={() => setCurrentTab('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                currentTab === 'map'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Map className="h-4 w-4" />
              CBS Haritası
            </button>
            <button
              onClick={() => setCurrentTab('teams')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                currentTab === 'teams'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              Saha Ekipleri
            </button>
          </nav>
        ) : (
          <div className="hidden md:block text-xs font-extrabold text-slate-500 dark:text-slate-400">
            {role === 'worker' ? '🛠️ SAHA GÖREV YÖNETİM ALANI' : '🏠 KENT SAKİNİ HİZMET PORTALI'}
          </div>
        )}

        {/* Sağ Taraf: Tema, Bildirimler ve Rol Bilgileri */}
        <div className="flex items-center gap-3">

          {/* Karanlık/Aydınlık Tema Butonu */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-900 border border-transparent transition-colors"
            title="Temayı Değiştir"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Bildirim Paneli */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown) handleMarkAsRead();
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-900 border border-transparent transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emergency-600 text-4xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Bildirim Kartı */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 ring-1 ring-black/5 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-3 py-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Sistem Bildirimleri</span>
                  <button 
                    onClick={() => {
                      setNotifications([]);
                      localStorage.setItem('civicfix_notifications', JSON.stringify([]));
                    }}
                    className="text-4xs text-slate-400 hover:text-emergency-500 dark:hover:text-emergency-400 font-semibold uppercase tracking-wider"
                  >
                    Temizle
                  </button>
                </div>
                
                <div className="max-h-72 overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">Yeni bildirim bulunmuyor</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`flex flex-col gap-0.8 px-3.5 py-2.5 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !notif.is_read ? 'bg-slate-50/40 dark:bg-slate-950/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            {notif.title}
                          </span>
                          <span className="text-5xs text-slate-400 shrink-0">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-2xs text-slate-500 dark:text-slate-400 leading-normal">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kullanıcı Bilgisi ve Çıkış Yap */}
          {role && (
            <div className="flex items-center gap-3 border-l border-slate-200/80 dark:border-slate-800/80 pl-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-350 font-black border border-slate-200/30 dark:border-slate-800/30 text-xs">
                {loginName ? loginName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CF'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                  {loginName}
                </span>
                <span className="text-[9px] text-slate-400 mt-1 leading-none uppercase font-bold tracking-wider">
                  {role === 'admin' ? 'Yönetici' : role === 'worker' ? 'Saha Görevlisi' : 'Vatandaş'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-600 bg-red-50 dark:bg-red-950/20 px-2.5 py-1.5 rounded-lg border border-red-200/40 dark:border-red-900/30 transition-all hover:scale-[1.01]"
              >
                Çıkış
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
