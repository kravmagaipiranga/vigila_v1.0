export interface PlaceResult {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

// Helper functions for caching
const getCache = <T>(key: string, maxAgeMs: number): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data as T;
  } catch (e) {
    return null;
  }
};

const setCache = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    // Ignore quota errors
  }
};

export async function searchLocation(query: string): Promise<PlaceResult[]> {
  const cacheKey = `search_${query.toLowerCase().trim()}`;
  const cached = getCache<PlaceResult[]>(cacheKey, 7 * 24 * 60 * 60 * 1000); // 7 days
  if (cached) return cached;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
    const data = await response.json();
    
    const results = data.map((item: any) => ({
      name: item.name || 'Local',
      address: item.display_name || '',
      location: {
        lat: Number(item.lat) || 0,
        lng: Number(item.lon) || 0
      }
    }));

    if (results.length > 0) {
      setCache(cacheKey, results);
    }
    return results;
  } catch (error) {
    console.error("Error searching location with Nominatim:", error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `geocode_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = getCache<string>(cacheKey, 7 * 24 * 60 * 60 * 1000); // 7 days
  if (cached) return cached;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await response.json();
    
    let result = "Localização Desconhecida";
    if (data && data.address) {
      const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.city_district;
      const city = data.address.city || data.address.town || data.address.village;
      const state = data.address.state;
      
      if (neighborhood && city) {
        result = `${neighborhood}, ${city}`;
      } else if (city && state) {
        result = `${city}, ${state}`;
      } else if (data.display_name) {
        // Fallback to a shortened version of display name
        const parts = data.display_name.split(',');
        if (parts.length >= 2) {
          result = `${parts[0].trim()}, ${parts[1].trim()}`;
        } else {
          result = data.display_name;
        }
      }
    }
    
    if (result !== "Localização Desconhecida") {
      setCache(cacheKey, result);
    }
    return result;
  } catch (error) {
    console.error("Error reverse geocoding with Nominatim:", error);
    return "Localização Desconhecida";
  }
}

export interface RiskAssessment {
  locationName: string;
  currentWarnings: {
    type: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
  }[];
  climateRisks: {
    risk: string;
    description: string;
    probability: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
  }[];
  naturalDisasters: {
    event: string;
    description: string;
    historicalFrequency: string;
  }[];
  satelliteData: {
    observation: string;
    details: string;
  }[];
  overallRiskScore: number;
}

// Simulated algorithmic risk assessment to replace AI and eliminate costs
export async function generateRiskAssessment(lat: number, lng: number): Promise<RiskAssessment> {
  const cacheKey = `risk_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = getCache<RiskAssessment>(cacheKey, 24 * 60 * 60 * 1000); // 24 hours
  if (cached) return cached;

  // Simulate network delay only if not cached
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const locationName = await reverseGeocode(lat, lng);
  
  // Use coordinates to generate deterministic but varied results
  const seed = Math.abs(Math.floor(lat * lng * 10000));
  const pseudoRandom = (max: number) => (seed % max);
  
  const score = 30 + pseudoRandom(50); // Score between 30 and 80
  
  const assessment: RiskAssessment = {
    locationName,
    overallRiskScore: score,
    currentWarnings: score > 60 ? [
      {
        type: "Alerta de Chuvas Fortes",
        description: "Previsão de precipitação intensa nas próximas horas. Risco de alagamentos pontuais.",
        severity: "medium"
      }
    ] : [],
    climateRisks: [
      {
        risk: "Inundações Urbanas",
        description: "Risco moderado devido à impermeabilização do solo e histórico de chuvas intensas.",
        probability: "medium",
        impact: "high"
      },
      {
        risk: "Ondas de Calor",
        description: "Aumento da frequência de dias com temperaturas extremas durante o verão.",
        probability: "high",
        impact: "medium"
      }
    ],
    naturalDisasters: [
      {
        event: "Deslizamentos de Terra",
        description: "Áreas de encosta na região mais ampla possuem histórico de instabilidade durante o período de chuvas.",
        historicalFrequency: "Anual (em áreas específicas)"
      },
      {
        event: "Enchentes",
        description: "Transbordamento de córregos locais em eventos de precipitação extrema.",
        historicalFrequency: "Ocasional"
      }
    ],
    satelliteData: [
      {
        observation: "Ilha de Calor Urbano",
        description: "Sensores termais indicam temperaturas de superfície 3°C acima da média em áreas densamente construídas."
      },
      {
        observation: "Índice de Vegetação (NDVI)",
        description: "Cobertura vegetal abaixo do ideal, concentrada apenas em parques e praças isoladas."
      }
    ]
  };

  setCache(cacheKey, assessment);
  return assessment;
}
