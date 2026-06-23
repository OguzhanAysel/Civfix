import React, { useState, useEffect } from 'react';
import Header from './components/shared/Header';
import Dashboard from './components/admin/Dashboard';
import KanbanBoard from './components/admin/KanbanBoard';
import MapView from './components/admin/MapView';
import LoginPortal from './components/shared/LoginPortal';
import WorkerView from './components/admin/WorkerView';
import CitizenView from './components/citizen/CitizenView';
import { dbService } from './services/dbService';
import TeamsManagement from './components/admin/TeamsManagement';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('civicfix_role') || null);
  const [loginName, setLoginName] = useState(localStorage.getItem('civicfix_login_name') || '');
  const [userId, setUserId] = useState(localStorage.getItem('civicfix_user_id') || '');
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'kanban', 'map'
  const [darkMode, setDarkMode] = useState(false);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 1. Sayfa Yüklendiğinde Verileri Çek
  const loadData = async () => {
    try {
      const allReports = await dbService.getReports();
      setReports(allReports);
      setNotifications(dbService.getNotifications());
    } catch (err) {
      console.error("Veri yüklenirken hata oluştu:", err);
    }
  };

  useEffect(() => {
    loadData();

    // Dark Mode sınıfı yönetimi
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Supabase oturumu varsa ve userId eksikse otomatik kurtar
  useEffect(() => {
    const restoreUserId = async () => {
      if (role && (!userId || userId === 'citizen-user') && dbService.isRealSupabase && dbService.supabase) {
        try {
          const { data: { session } } = await dbService.supabase.auth.getSession();
          if (session?.user) {
            setUserId(session.user.id);
            localStorage.setItem('civicfix_user_id', session.user.id);
          }
        } catch (err) {
          console.error("Kullanıcı ID kurtarma hatası:", err);
        }
      }
    };
    restoreUserId();
  }, [role, userId]);

  // 2. Realtime Güncelleme Alıcısı (State'i senkronize tutmak için)
  useEffect(() => {
    const handleRealtimeUpdate = async () => {
      await loadData();
    };

    window.addEventListener('civicfix_realtime', handleRealtimeUpdate);
    return () => window.removeEventListener('civicfix_realtime', handleRealtimeUpdate);
  }, []);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await dbService.updateReportStatus(reportId, newStatus);
      await loadData();
    } catch (err) {
      console.error("İhbar durum güncelleme hatası:", err);
    }
  };

  const handleLogin = (selectedRole, name, id) => {
    setRole(selectedRole);
    setLoginName(name);
    setUserId(id);
    localStorage.setItem('civicfix_role', selectedRole);
    localStorage.setItem('civicfix_login_name', name);
    localStorage.setItem('civicfix_user_id', id);
    
    // Yönlendirme hedefleri
    if (selectedRole === 'admin') {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setLoginName('');
    setUserId('');
    localStorage.removeItem('civicfix_role');
    localStorage.removeItem('civicfix_login_name');
    localStorage.removeItem('civicfix_user_id');
  };

  // Eğer giriş yapılmamışsa giriş portalını göster
  if (!role) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Üst Header Menü */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        notifications={notifications}
        setNotifications={setNotifications}
        role={role}
        loginName={loginName}
        onLogout={handleLogout}
      />

      {/* Ana Çalışma Alanı */}
      <div className="flex-1 flex overflow-hidden">
        
        <main className="flex-1 overflow-y-auto">
          {role === 'admin' && (
            <>
              {currentTab === 'dashboard' && <Dashboard reports={reports} />}
              {currentTab === 'kanban' && <KanbanBoard reports={reports} setReports={setReports} loginName={loginName} />}
              {currentTab === 'map' && <MapView reports={reports} onStatusChange={handleStatusChange} />}
              {currentTab === 'teams' && <TeamsManagement />}
            </>
          )}

          {role === 'worker' && (
            <WorkerView 
              loginName={loginName} 
              userId={userId}
              reports={reports} 
              setReports={setReports} 
            />
          )}

          {role === 'citizen' && (
            <CitizenView 
              loginName={loginName} 
              userId={userId}
              reports={reports} 
              setReports={setReports} 
            />
          )}
        </main>

      </div>
    </div>
  );
}
