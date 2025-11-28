import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = getAiClient();
  const base64Data = await blobToBase64(audioBlob);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/wav',
              data: base64Data
            }
          },
          {
            text: "Transcribe this Indian-English audio exactly as spoken. Do not correct grammatical errors. Return ONLY the raw transcript text."
          }
        ]
      }
    });

    return response.text?.trim() || "Transcription failed";
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const analyzeErrors = async (reference: string, hypothesis: string): Promise<string> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an expert linguistic analyst specializing in Indian-English accents and ASR (Automatic Speech Recognition) evaluation.
        
        Reference Text (Ground Truth): "${reference}"
        Hypothesis Text (ASR Output): "${hypothesis}"
        
        Task:
        1. Compare the texts to identify specific errors (Substitutions, Deletions, Insertions).
        2. Provide a brief analysis of potential phonological reasons for these errors based on Indian-English accent traits (e.g., retroflex T/D, v/w merging, syllable timing).
        3. If the ASR was accurate, commend the clarity.
        
        Format: Return a short, concise paragraph (max 100 words).
      `
    });

    return response.text?.trim() || "Analysis failed";
  } catch (error) {
    console.error("Analysis error:", error);
    return "Could not generate analysis.";
  }
};
