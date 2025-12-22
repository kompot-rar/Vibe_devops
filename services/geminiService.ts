import { GoogleGenAI, Type } from "@google/genai";
import { BlogPost } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_BLOG = `
Jesteś doświadczonym inżynierem DevOps (Senior DevOps Engineer), który pisze bloga edukacyjnego dla początkujących.
Twój styl jest przystępny, techniczny, ale zrozumiały. Używasz analogii z życia codziennego.
Twoim celem jest wygenerowanie artykułu na bloga na podstawie podanego tematu.
Odpowiedź musi być w formacie JSON.
`;

const SYSTEM_INSTRUCTION_MENTOR = `
Jesteś AI DevOps Mentorem. Pomagasz użytkownikom zrozumieć koncepcje takie jak Linux, Docker, Kubernetes, CI/CD, Terraform, Cloud (AWS/GCP/Azure).
Twoje odpowiedzi powinny być krótkie, konkretne i zachęcające do dalszej nauki. Jeśli to możliwe, podawaj przykłady komend terminala.
`;

export const generateArticle = async (topic: string): Promise<Omit<BlogPost, 'id' | 'date'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Napisz artykuł na bloga na temat: "${topic}". Artykuł powinien być skierowany do amatorów.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BLOG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            excerpt: { type: Type.STRING, description: "Krótkie streszczenie (1-2 zdania)" },
            content: { type: Type.STRING, description: "Pełna treść artykułu w formacie Markdown" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            readTime: { type: Type.STRING, description: "np. '5 min'" },
          },
          required: ["title", "excerpt", "content", "tags", "readTime"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from Gemini");
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating article:", error);
    throw error;
  }
};

export const chatWithMentor = async (message: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_MENTOR,
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text || "Przepraszam, mam problem z połączeniem.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Wystąpił błąd podczas komunikacji z mentorem.";
  }
};