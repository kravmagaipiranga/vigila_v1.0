import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Download, CheckCircle, AlertTriangle } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Offline TileLayer
const createOfflineTileLayer = () => {
  const OfflineLayer = L.TileLayer.extend({
    createTile: function (coords: any, done: any) {
      const tile = document.createElement('img');
      const url = this.getTileUrl(coords);
      tile.crossOrigin = 'Anonymous';
      tile.alt = '';

      caches.open('offline-map-tiles').then(cache => {
        cache.match(url).then(response => {
          if (response) {
            response.blob().then(blob => {
              tile.src = URL.createObjectURL(blob);
              done(null, tile);
            });
          } else {
            fetch(url).then(networkResponse => {
              cache.put(url, networkResponse.clone());
              networkResponse.blob().then(blob => {
                tile.src = URL.createObjectURL(blob);
                done(null, tile);
              });
            }).catch(err => {
              // Offline and not in cache
              done(err, tile);
            });
          }
        });
      });

      return tile;
    }
  });

  return new OfflineLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  });
};

const OfflineTileLayerComponent = () => {
  const map = useMap();
  
  useEffect(() => {
    const layer = createOfflineTileLayer();
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
};

interface OfflineMapProps {
  lat: number;
  lng: number;
  locationName: string;
}

const OfflineMap: React.FC<OfflineMapProps> = ({ lat, lng, locationName }) => {
  const [cacheStatus, setCacheStatus] = useState<'idle' | 'caching' | 'done' | 'error'>('idle');

  // Function to pre-cache surrounding tiles for offline use
  const downloadOfflineMap = async () => {
    setCacheStatus('caching');
    try {
      const cache = await caches.open('offline-map-tiles');
      const zoomLevels = [13, 14, 15, 16]; // Zoom levels to cache
      const urlsToCache: string[] = [];

      // Simple function to convert lat/lng to tile coordinates
      const lon2tile = (lon: number, zoom: number) => (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
      const lat2tile = (lat: number, zoom: number) => (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));

      // Cache a 5x5 grid around the center for each zoom level
      zoomLevels.forEach(z => {
        const centerTileX = lon2tile(lng, z);
        const centerTileY = lat2tile(lat, z);
        
        for (let x = centerTileX - 2; x <= centerTileX + 2; x++) {
          for (let y = centerTileY - 2; y <= centerTileY + 2; y++) {
            const subdomains = ['a', 'b', 'c'];
            const s = subdomains[(x + y) % 3];
            urlsToCache.push(`https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`);
          }
        }
      });

      // Fetch and cache all URLs
      await Promise.all(urlsToCache.map(async (url) => {
        const response = await cache.match(url);
        if (!response) {
          try {
            const fetchResponse = await fetch(url);
            if (fetchResponse.ok) {
              await cache.put(url, fetchResponse);
            }
          } catch (e) {
            // Ignore individual tile fetch errors
          }
        }
      }));

      setCacheStatus('done');
    } catch (error) {
      console.error("Error caching map:", error);
      setCacheStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-ardosia border border-ouro/10 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ouro/10 rounded-xl flex items-center justify-center text-ouro">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-pergaminho">Mapa da Região</h3>
            <p className="text-xs text-pergaminho/60 truncate max-w-[200px]">{locationName}</p>
          </div>
        </div>
        
        <button
          onClick={downloadOfflineMap}
          disabled={cacheStatus === 'caching' || cacheStatus === 'done'}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${
            cacheStatus === 'done' 
              ? 'bg-esmeralda/20 text-esmeralda border border-esmeralda/30'
              : cacheStatus === 'caching'
              ? 'bg-ciano/20 text-ciano border border-ciano/30'
              : 'bg-ouro text-obsidiana hover:bg-yellow-500'
          }`}
        >
          {cacheStatus === 'done' ? (
            <><CheckCircle size={14} /> Salvo</>
          ) : cacheStatus === 'caching' ? (
            <><div className="w-3 h-3 border-2 border-ciano/30 border-t-ciano rounded-full animate-spin" /> Baixando...</>
          ) : (
            <><Download size={14} /> Salvar Offline</>
          )}
        </button>
      </div>

      {cacheStatus === 'error' && (
        <div className="p-3 bg-alerta/10 border border-alerta/20 rounded-xl flex items-center gap-2 text-alerta text-xs">
          <AlertTriangle size={14} />
          <span>Erro ao salvar o mapa. Verifique sua conexão.</span>
        </div>
      )}

      <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-ouro/20 shadow-lg shadow-black/50 relative z-0">
        <MapContainer 
          center={[lat, lng]} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <OfflineTileLayerComponent />
          <Marker position={[lat, lng]}>
            <Popup>
              <div className="text-obsidiana font-bold text-sm">Sua Localização</div>
              <div className="text-obsidiana/70 text-xs">{locationName}</div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      <p className="text-[10px] text-pergaminho/40 text-center uppercase tracking-widest">
        Os mapas visualizados ou salvos ficarão disponíveis mesmo sem internet.
      </p>
    </div>
  );
};

export default OfflineMap;
