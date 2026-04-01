import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface PlaceResult {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

export async function searchLocation(query: string): Promise<PlaceResult[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for this location and return a list of matching places with their names, full addresses (formatted as "City, State, Country" if possible), and coordinates (latitude and longitude). Format the response as a JSON array of objects with 'name', 'address', 'lat', and 'lng' properties. Query: ${query}`,
      config: {
        tools: [{ googleMaps: {} }],
        // Note: responseMimeType and responseSchema are NOT allowed with googleMaps tool
      }
    });

    const text = response.text;
    if (text) {
      // Find JSON block in text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          return data.map((item: any) => ({
            name: item.name || 'Local',
            address: item.address || '',
            location: {
              lat: Number(item.lat) || 0,
              lng: Number(item.lng) || 0
            }
          }));
        } catch (e) {
          console.error("Failed to parse JSON from Gemini response:", e);
          return [];
        }
      }
    }
    return [];
  } catch (error) {
    console.error("Error searching location with Gemini:", error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Identify the NEIGHBORHOOD (BAIRRO), CITY (CIDADE), and STATE (ESTADO) at coordinates ${lat}, ${lng}. 
      Return the information in the format "Neighborhood, City". 
      If the neighborhood is not identified or unavailable, return "City, State". 
      Return ONLY this string, no extra text.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      // Clean up the response if it's too long or has extra text
      const result = text.trim().split('\n')[0];
      // If the result still looks like coordinates (contains only numbers, dots, commas and spaces)
      if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(result)) {
        return "Ipiranga, São Paulo"; // Fallback with a generic location if needed
      }
      return result;
    }
    return "São Paulo, SP";
  } catch (error) {
    console.error("Error reverse geocoding with Gemini:", error);
    return "São Paulo, SP";
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

export async function generateRiskAssessment(lat: number, lng: number): Promise<RiskAssessment> {
  const prompt = `Você é um sistema avançado de avaliação de risco de desastres, utilizando metodologias do GFDRR CCDR-tools e PreventionWeb.
O usuário está localizado nas coordenadas: Latitude ${lat}, Longitude ${lng}.
Avalie os riscos locais num raio de 20km desta localização.
Use a Pesquisa do Google para encontrar avisos meteorológicos em tempo real, observações de satélite (como umidade do solo, saúde da vegetação, calor urbano, riscos de inundação) e informações históricas de desastres naturais para este local específico.

Retorne um objeto JSON com a seguinte estrutura:
- locationName: O nome da cidade/região e país.
- currentWarnings: Quaisquer avisos ou alertas ativos (ex: chuva forte, onda de calor). Se não houver, forneça um status geral.
- climateRisks: Riscos climáticos de longo prazo (ex: aumento do nível do mar, desertificação, aumento da intensidade das tempestades).
- naturalDisasters: Desastres naturais históricos que afetam esta área (ex: inundações, terremotos, deslizamentos).
- satelliteData: Observações de satélite recentes ou típicas para esta área (ex: "NDVI mostra vegetação saudável", "Alta umidade do solo detectada", "Efeito de ilha de calor urbano presente").
- overallRiskScore: Uma pontuação de 0 a 100 representando o nível geral de risco (0 = muito seguro, 100 = risco extremo).

Certifique-se de que a resposta esteja em Português (pt-BR).`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          locationName: { type: Type.STRING },
          currentWarnings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
              },
              required: ["type", "description", "severity"],
            },
          },
          climateRisks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                risk: { type: Type.STRING },
                description: { type: Type.STRING },
                probability: { type: Type.STRING, enum: ["low", "medium", "high"] },
                impact: { type: Type.STRING, enum: ["low", "medium", "high"] },
              },
              required: ["risk", "description", "probability", "impact"],
            },
          },
          naturalDisasters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                event: { type: Type.STRING },
                description: { type: Type.STRING },
                historicalFrequency: { type: Type.STRING },
              },
              required: ["event", "description", "historicalFrequency"],
            },
          },
          satelliteData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                observation: { type: Type.STRING },
                details: { type: Type.STRING },
              },
              required: ["observation", "details"],
            },
          },
          overallRiskScore: { type: Type.NUMBER },
        },
        required: [
          "locationName",
          "currentWarnings",
          "climateRisks",
          "naturalDisasters",
          "satelliteData",
          "overallRiskScore",
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate risk assessment.");
  }

  return JSON.parse(text) as RiskAssessment;
}
