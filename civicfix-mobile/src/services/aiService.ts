// CivicFix - Mobile Yapay Zekâ ve Mesafe Analiz Servisi

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Metre cinsinden dünya yarıçapı
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

  return R * c;
};

export const aiService = {
  // Metin Analizi (Kategori ve Öncelik Tespiti)
  analyzeDescription(text: string) {
    const textLower = text.toLowerCase();
    
    const categories = [
      {
        name: "Yol Bakım",
        keywords: ["çukur", "asfalt", "yol", "kaldırım", "çökme", "tümsek", "yarık"]
      },
      {
        name: "Su ve Kanalizasyon",
        keywords: ["su", "leak", "kaçak", "kanalizasyon", "logar", "patlak", "fışkırıyor"]
      },
      {
        name: "Aydınlatma",
        keywords: ["lamba", "ışık", "karanlık", "aydınlatma", "yanmıyor", "sönük"]
      },
      {
        name: "Atık Yönetimi",
        keywords: ["çöp", "konteyner", "koku", "atık", "pislik", "taşmış"]
      },
      {
        name: "Trafik ve Tabela",
        keywords: ["tabela", "levha", "trafik", "sinyalizasyon", "kavşak", "tabela devrilmiş"]
      },
      {
        name: "Çevre ve Parklar",
        keywords: ["park", "bahçe", "ekipman", "oyuncak", "kırık", "salıncak", "bank"]
      }
    ];

    const emergencyKeywords = ["acil", "tehlike", "can güvenliği", "patlama", "göçük"];
    const highKeywords = ["büyük çukur", "fışkırıyor", "devrilmiş", "zarar"];

    let detectedCategory = "Yol Bakım";
    let maxMatches = 0;

    categories.forEach(cat => {
      let matches = 0;
      cat.keywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          matches++;
        }
      });
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedCategory = cat.name;
      }
    });

    let detectedPriority = "Normal";
    const hasEmergency = emergencyKeywords.some(kw => textLower.includes(kw));
    const hasHigh = highKeywords.some(kw => textLower.includes(kw));

    if (hasEmergency) {
      detectedPriority = "Acil";
    } else if (hasHigh) {
      detectedPriority = "Yüksek";
    } else if (textLower.includes("az") || textLower.includes("küçük")) {
      detectedPriority = "Düşük";
    }

    const confidence = maxMatches > 0 
      ? Math.min(80 + (maxMatches * 4), 98) 
      : 70;

    return {
      category: detectedCategory,
      priority: detectedPriority,
      confidence: confidence
    };
  },

  // Fotoğraf Nesne Analizi Simülasyonu
  analyzePhoto(imageSrc: string) {
    const defaultLabels = [
      { label: "Asfalt Çukuru (Pothole)", category: "Yol Bakım", confidence: 94 },
      { label: "Kırık Park Ekipmanı", category: "Çevre ve Parklar", confidence: 88 },
      { label: "Su Kaçağı / Boru Sızıntısı", category: "Su ve Kanalizasyon", confidence: 91 },
      { label: "Sönük Sokak Lambası", category: "Aydınlatma", confidence: 89 },
      { label: "Çöp Konteyneri Taşması", category: "Atık Yönetimi", confidence: 92 },
      { label: "Trafik Tabelası Hasarı", category: "Trafik ve Tabela", confidence: 95 }
    ];

    let matchedLabel = defaultLabels[0];
    const srcLower = imageSrc.toLowerCase();

    if (srcLower.includes('pothole') || srcLower.includes('cukur')) {
      matchedLabel = defaultLabels[0];
    } else if (srcLower.includes('park') || srcLower.includes('swing') || srcLower.includes('salincak')) {
      matchedLabel = defaultLabels[1];
    } else if (srcLower.includes('water') || srcLower.includes('leak') || srcLower.includes('su')) {
      matchedLabel = defaultLabels[2];
    } else if (srcLower.includes('lamp') || srcLower.includes('isik') || srcLower.includes('lamba')) {
      matchedLabel = defaultLabels[3];
    } else if (srcLower.includes('garbage') || srcLower.includes('cop')) {
      matchedLabel = defaultLabels[4];
    } else if (srcLower.includes('sign') || srcLower.includes('tabela')) {
      matchedLabel = defaultLabels[5];
    }

    return {
      label: matchedLabel.label,
      category: matchedLabel.category,
      confidence: matchedLabel.confidence
    };
  },

  // 50 Metre Mükerrer Kontrolü
  async checkDuplicate(lat: number, lng: number, category: string, reports: any[]) {
    const openReports = reports.filter(r => r.status !== 'Çözüldü' && r.category === category);
    let closestDuplicate: any = null;
    let minDistance = 50;

    openReports.forEach(rep => {
      const distance = calculateDistance(lat, lng, rep.latitude, rep.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        closestDuplicate = {
          ...rep,
          distance: Math.round(distance)
        };
      }
    });

    return closestDuplicate;
  }
};
