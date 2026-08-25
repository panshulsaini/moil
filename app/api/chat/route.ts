import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is missing.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { message, telemetryContext, chatHistory } = await req.json();

    const systemInstruction = `
You are Moil-AI, an expert AI Assistant and Chief Data Scientist for MOIL Limited (Manganese Ore India Limited).
You are helping the Mine Operations Manager monitor real-time telemetry, predict shortfalls, and prevent equipment failure.

Current Live Telemetry Snapshot:
${JSON.stringify(telemetryContext, null, 2)}

Instructions:
1. Always base your answers on the Current Live Telemetry Snapshot provided above.
2. Be concise, highly professional, and action-oriented. Use bullet points for readability.
3. If risk levels (e.g. soil moisture > 80%, heavy rain) are high, strongly recommend corrective actions like deploying dewatering pumps.
4. If asked about production, reference the current 'extraction_tonnes' vs 'target_tonnes'.
5. Do not use Markdown headers (like # or ##) as the chat widget is small. Bold text (**like this**) is fine.
    `;

    // Convert chat history to the format expected by the SDK
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Keep it professional and deterministic
      }
    });

    return NextResponse.json({ reply: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response.', details: error.message },
      { status: 500 }
    );
  }
}
