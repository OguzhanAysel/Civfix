import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MapProps {
  userGps: [number, number];
  reports: any[];
  distanceLimit: string;
}

export default function MapComponent({ userGps, reports, distanceLimit }: MapProps) {
  // Build dynamic HTML with Leaflet and embedded variables
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; background-color: #f8fafc; }
        .custom-citizen-icon { }
        .custom-report-icon { }
        /* Reset Leaflet popups default styles slightly for matching theme */
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.8);
          padding: 2px;
        }
        .leaflet-popup-tip {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${userGps[0]}, ${userGps[1]}], 14);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Add User GPS Marker
        var userIcon = L.divIcon({
          html: \`
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
              <span style="position: absolute; display: inline-flex; height: 100%; width: 100%; border-radius: 9999px; background-color: #3b82f6; opacity: 0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 9999px; background-color: #2563eb; color: white; font-weight: bold; font-size: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid white;">
                🔵
              </div>
            </div>
            <style>
              @keyframes ping {
                75%, 100% { transform: scale(2.2); opacity: 0; }
              }
            </style>
          \`,
          className: 'custom-citizen-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        L.marker([${userGps[0]}, ${userGps[1]}], { icon: userIcon }).addTo(map).bindPopup('<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 10px; font-weight: bold; color: #1e3a8a; text-align: center;">Mevcut Konumunuz</div>');

        // Add Search Circle
        if ('${distanceLimit}' !== 'All') {
          var radiusVal = parseFloat('${distanceLimit}') * 1000;
          L.circle([${userGps[0]}, ${userGps[1]}], {
            radius: radiusVal,
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            color: '#3b82f6',
            weight: 1.5,
            dashArray: '3, 4'
          }).addTo(map);
        }

        // Add Report Pins
        var reps = ${JSON.stringify(reports)};
        reps.forEach(function(rep) {
          if (!rep.latitude || !rep.longitude) return;
          var colorClass = 'background-color: #f59e0b;'; // warning
          if (rep.status === 'Çözüldü') {
            colorClass = 'background-color: #10b981;'; // success
          } else if (rep.priority === 'Acil') {
            colorClass = 'background-color: #e11d48;'; // danger
          } else if (rep.priority === 'Yüksek') {
            colorClass = 'background-color: #f97316;'; // orange
          }

          var repIcon = L.divIcon({
            html: \`
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
                <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 9999px; \` + colorClass + \` color: white; font-weight: bold; font-size: 8px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15);">
                  📍
                </div>
              </div>
            \`,
            className: 'custom-report-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          var imgHtml = '';
          if (rep.report_images && rep.report_images.length > 0 && rep.report_images[0].image_url) {
            imgHtml = '<img src="' + rep.report_images[0].image_url + '" style="height: 80px; width: 100%; object-fit: cover; border-radius: 6px; margin: 6px 0;" />';
          }

          var popupContent = '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 10px; width: 160px; color: #1e293b; line-height: 1.4;">' +
            '<span style="font-size: 7px; text-transform: uppercase; font-weight: 800; color: #4338ca; background-color: #e0e7ff; padding: 2px 5px; border-radius: 4px; display: inline-block;">' + rep.category + '</span>' +
            '<h4 style="margin: 6px 0 2px 0; font-size: 10px; font-weight: bold; color: #0f172a;">' + rep.title + '</h4>' +
            imgHtml +
            '<p style="margin: 0; color: #64748b; font-size: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">' + rep.description + '</p>' +
            '<div style="margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px; font-size: 8px; font-weight: bold; color: #0f172a; display: flex; justify-content: space-between;">' +
              '<span>Durum: ' + rep.status + '</span>' +
            '</div>' +
          '</div>';

          L.marker([rep.latitude, rep.longitude], { icon: repIcon })
            .addTo(map)
            .bindPopup(popupContent);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <iframe
        srcDoc={htmlContent}
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
        title="Leaflet Map"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
});
