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

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Identify the CITY, STATE, and COUNTRY at coordinates ${lat}, ${lng}. Return the information in the format "City, State, Country". If any of these items are not identified, show only the ones that were (e.g., "State, Country" or just "Country"). Return ONLY this string, no extra text.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const text = response.text;
    if (text) {
      // Clean up the response if it's too long or has extra text
      const result = text.trim().split('\n')[0];
      // If the result still looks like coordinates (contains only numbers, dots, commas and spaces)
      if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(result)) {
        return "São Paulo, SP, Brasil"; // Fallback with a generic location if needed
      }
      return result;
    }
    return "Brasil";
  } catch (error) {
    console.error("Error reverse geocoding with Gemini:", error);
    return "Brasil";
  }
}
