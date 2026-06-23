import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

interface MapProps {
  userGps: [number, number];
  reports: any[];
  distanceLimit: string;
}

export default function MapComponent({ userGps, reports, distanceLimit }: MapProps) {
  const handleOpenExternalMap = () => {
    const url = `https://www.openstreetmap.org/#map=14/${userGps[0]}/${userGps[1]}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.title}>Harita Görünümü</Text>
      <Text style={styles.subtitle}>
        Mobil cihazlarda haritayı tarayıcıda açabilir veya web portalını kullanabilirsiniz.
      </Text>
      <Text style={styles.info}>
        İhbar sayısı: {reports.length}
      </Text>
      <TouchableOpacity style={styles.btn} onPress={handleOpenExternalMap}>
        <Text style={styles.btnText}>📍 Haritayı Tarayıcıda Aç</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 16,
  },
  info: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4338ca',
    marginBottom: 15,
  },
  btn: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
