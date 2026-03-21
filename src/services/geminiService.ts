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
      contents: `Search for this location and return a list of matching places with their names, full addresses, and coordinates (latitude and longitude). Format the response as a JSON array of objects with 'name', 'address', 'lat', and 'lng' properties. Query: ${query}`,
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
        const data = JSON.parse(jsonMatch[0]);
        return data.map((item: any) => ({
          name: item.name,
          address: item.address,
          location: {
            lat: item.lat,
            lng: item.lng
          }
        }));
      }
    }
    return [];
  } catch (error) {
    console.error("Error searching location with Gemini:", error);
    return [];
  }
}
