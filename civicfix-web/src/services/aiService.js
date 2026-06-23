// CivicFix - Yapay Zekâ ve Akıllı Analiz Servisi

import { dbService } from './dbService';

// Konumlar arası mesafeyi metre cinsinden hesaplayan Haversine Formülü
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Dünyanın yarıçapı (metre)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Metre cinsinden mesafe
};

export const aiService = {
  // 1. Yazılı İhbar Açıklamasını Analiz Et (Kategori ve Öncelik Tespiti)
  analyzeDescription(text) {
    const textLower = text.toLowerCase();
    
    // Kategori kelime eşlemeleri
    const categories = [
      {
        name: "Yol Bakım",
        keywords: ["çukur", "asfalt", "yol", "kaldırım", "çökme", "parke taşı", "tümsek", "yarık", "hendek"]
      },
      {
        name: "Su ve Kanalizasyon",
        keywords: ["su", "leak", "kaçak", "kanalizasyon", "logar", "patlak", "lağım", "fışkırıyor", "sel", "musluk", "şebeke"]
      },
      {
        name: "Aydınlatma",
        keywords: ["lamba", "ışık", "karanlık", "aydınlatma", "yanmıyor", "direk", "sönük", "floresan", "sokak lambası"]
      },
      {
        name: "Atık Yönetimi",
        keywords: ["çöp", "konteyner", "koku", "atık", "pislik", "taşmış", "moloz", "çöplük", "poşet"]
      },
      {
        name: "Trafik ve Tabela",
        keywords: ["tabela", "levha", "trafik", "sinyalizasyon", "kavşak", "lamba devrilmiş", "ışıklar yanmıyor", "tabela kırık"]
      },
      {
        name: "Çevre ve Parklar",
        keywords: ["park", "bahçe", "ekipman", "oyuncak", "kırık", "salıncak", "bank", "kaydırak", "yeşil alan", "ağaç devrilmiş"]
      }
    ];

    // Öncelik belirleme kelimeleri
    const emergencyKeywords = ["acil", "tehlike", "can güvenliği", "patlama", "göçük", "yaralanma", "çöküyor", "kaza", "yangın"];
    const highKeywords = ["büyük çukur", "fışkırıyor", "devrilmiş", "zarar", "kırılmış", "engel", "yoğun", "karanlık sokak"];

    let detectedCategory = "Yol Bakım"; // Varsayılan kategori
    let maxMatches = 0;
    const matchLogs = [];

    // Kategori Tespiti
    categories.forEach(cat => {
      let matches = 0;
      cat.keywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          matches++;
        }
      });
      
      if (matches > 0) {
        matchLogs.push({ category: cat.name, score: matches });
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        detectedCategory = cat.name;
      }
    });

    // Öncelik Tespiti (Varsayılan: Normal)
    let detectedPriority = "Normal";
    
    // Kelime eşleşmelerine göre öncelik arttırımı
    const hasEmergency = emergencyKeywords.some(kw => textLower.includes(kw));
    const hasHigh = highKeywords.some(kw => textLower.includes(kw));

    if (hasEmergency) {
      detectedPriority = "Acil";
    } else if (hasHigh) {
      detectedPriority = "Yüksek";
    } else if (textLower.length > 50 && maxMatches > 2) {
      detectedPriority = "Yüksek";
    } else if (textLower.includes("az") || textLower.includes("hafif") || textLower.includes("küçük")) {
      detectedPriority = "Düşük";
    }

    // AI Güven Oranı Simülasyonu
    const confidence = maxMatches > 0 
      ? Math.min(80 + (maxMatches * 4), 98) 
      : 70;

    return {
      category: detectedCategory,
      priority: detectedPriority,
      confidence: confidence,
      logs: {
        analyzedTextLength: text.length,
        matchScore: maxMatches,
        categoryScoring: matchLogs,
        timestamp: new Date().toISOString()
      }
    };
  },

  // 2. Fotoğraf Analizi (AI Nesne Tanıma Simülasyonu)
  analyzePhoto(imageSrc) {
    // Fotoğraf türlerine göre gerçekçi tahminler
    const defaultLabels = [
      { label: "Asfalt Çukuru (Pothole)", category: "Yol Bakım", confidence: 94 },
      { label: "Kırık Park Ekipmanı", category: "Çevre ve Parklar", confidence: 88 },
      { label: "Su Kaçağı / Boru Sızıntısı", category: "Su ve Kanalizasyon", confidence: 91 },
      { label: "Sönük Sokak Lambası", category: "Aydınlatma", confidence: 89 },
      { label: "Çöp Konteyneri Taşması", category: "Atık Yönetimi", confidence: 92 },
      { label: "Trafik Tabelası Hasarı", category: "Trafik ve Tabela", confidence: 95 }
    ];

    // Eğer bir base64 / blob ise veya rastgele bir görsel ise uygun sınıfı ata
    // Bu simülasyon sunumda kusursuz çalışması için tasarlanmıştır
    let matchedLabel = defaultLabels[0];
    
    // Görsel ismine göre eşleştirme (demo görseller için)
    if (typeof imageSrc === 'string') {
      const srcLower = imageSrc.toLowerCase();
      if (srcLower.includes('pothole') || srcLower.includes('cukur')) {
        matchedLabel = defaultLabels[0];
      } else if (srcLower.includes('park') || srcLower.includes('swing') || srcLower.includes('salincak')) {
        matchedLabel = defaultLabels[1];
      } else if (srcLower.includes('water') || srcLower.includes('leak') || srcLower.includes('su')) {
        matchedLabel = defaultLabels[2];
      } else if (srcLower.includes('lamp') || srcLower.includes('isik') || srcLower.includes('lamba')) {
        matchedLabel = defaultLabels[3];
      } else if (srcLower.includes('garbage') || srcLower.includes('cop') || srcLower.includes('cop')) {
        matchedLabel = defaultLabels[4];
      } else if (srcLower.includes('sign') || srcLower.includes('tabela') || srcLower.includes('levha')) {
        matchedLabel = defaultLabels[5];
      } else {
        // Rastgele seçim
        matchedLabel = defaultLabels[Math.floor(Math.random() * defaultLabels.length)];
      }
    }

    return {
      label: matchedLabel.label,
      category: matchedLabel.category,
      confidence: matchedLabel.confidence,
      detectedAt: new Date().toISOString()
    };
  },

  // 3. Mükerrer (Benzer) Kayıt Tespiti (50 Metre Kuralı)
  async checkDuplicate(lat, lng, category) {
    try {
      const reports = await dbService.getReports();
      const openReports = reports.filter(r => r.status !== 'Çözüldü' && r.category === category);

      let closestDuplicate = null;
      let minDistance = 50; // Metre sınırımız 50 metre

      openReports.forEach(rep => {
        const distance = calculateDistance(lat, lng, rep.latitude, rep.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          closestDuplicate = {
            ...rep,
            distance: Math.round(distance) // Metre cinsinden yuvarla
          };
        }
      });

      return closestDuplicate; // 50 metre içinde benzer kayıt varsa nesneyi döner, yoksa null
    } catch (err) {
      console.error("Mükerrer kontrolü hatası:", err);
      return null;
    }
  }
};
