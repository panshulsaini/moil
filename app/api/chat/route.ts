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

The user might ask about the specific mine they are currently viewing, OR they might ask about ANY of the 8 MOIL mines in the region. 
You have access to both the live telemetry of the currently viewed mine, AND a snapshot of all 8 mines.

Context Provided:
${JSON.stringify(telemetryContext, null, 2)}

Instructions:
1. Always base your answers on the Context Provided above.
2. If the user asks about a specific mine (e.g., "How is Dongri Buzurg?"), look it up in 'all_8_mines_current_status' and answer accurately.
3. Be concise, highly professional, and action-oriented. Use bullet points for readability.
4. If risk levels are high (e.g. CRITICAL risk, high moisture), strongly recommend corrective actions like deploying dewatering pumps.
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
