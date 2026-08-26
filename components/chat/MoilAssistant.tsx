"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useGlobalStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOIL_MINES } from "@/lib/mock-telemetry";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function MoilAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am Moil-AI. I monitor your live telemetry and shortfall risks. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { activeMineId, seriesData } = useGlobalStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Gather context
      const currentTelemetry = seriesData[seriesData.length - 1];
      const activeMine = MOIL_MINES.find(m => m.id === activeMineId);
      
      const context = {
        active_mine_name: activeMine ? activeMine.name : "All MOIL Concessions (Regional)",
        active_mine_district: activeMine ? activeMine.district : "Maharashtra & Madhya Pradesh",
        telemetry: currentTelemetry,
        fleet_status: "Total 64 units active across regional assets, 88% overall uptime"
      };

      // We only send the last 6 messages to save context window
      const chatHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          telemetryContext: context,
          chatHistory: chatHistory
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `System Error: ${err.message}. Check if GEMINI_API_KEY is configured.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl hover:scale-105 transition-transform z-50 flex items-center justify-center border border-purple-400/30"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-[#0E1528] rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 duration-200">
          {/* Header */}
          <div className="p-3 bg-[#0B101D] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Moil-AI</h3>
                <p className="text-[10px] text-emerald-400 font-mono">Live Telemetry Linked</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-800" : "bg-purple-900/40 border border-purple-500/30"}`}>
                  {msg.role === "user" ? <User className="h-4 w-4 text-slate-300" /> : <Bot className="h-4 w-4 text-purple-300" />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-slate-800 text-slate-200 rounded-tr-none"
                      : "bg-[#131B2C] border border-slate-700/50 text-slate-300 rounded-tl-none whitespace-pre-wrap"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-purple-300" />
                </div>
                <div className="p-4 rounded-2xl bg-[#131B2C] border border-slate-700/50 rounded-tl-none flex items-center">
                  <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  <span className="ml-2 text-xs text-slate-400 font-mono">Analyzing Telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-[#0B101D]">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about mine risk, weather, or production..."
                className="flex-1 bg-slate-900 border-slate-700 focus-visible:ring-purple-500 text-sm h-10"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
