"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Mic, Loader2, Minus } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "What is In Situ?",
    "What is Remote Sensing?",
    "List instruments",
    "Show latest alerts",
    "How to use the map?",
  ];

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      if (transcript) {
        document.forms[0]?.requestSubmit();
      }
    };
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAnswer = (prompt: string): string => {
    const q = prompt.toLowerCase().replace(/\W+/g, " ").trim();

    if (q.includes("in situ")) {
      return "In Situ refers to direct on-site measurements from instruments located in the water, such as buoys, tide gauges, and underwater sensors.";
    }
    if (q.includes("remote sensing")) {
      return "Remote Sensing involves observing the ocean from a distance using satellites, radars, and aircraft; it provides data on surface temperature, chlorophyll concentration, waves, and more.";
    }
    if (q.includes("instrument") || q.includes("instruments")) {
      return "Sample instruments include buoys, tide gauges, weather stations, coastal radar, satellites, and acoustic sensors.";
    }
    if (q.includes("how to use") && q.includes("map")) {
      return "You can zoom with your mouse wheel, click stations for details, use filters to refine instruments, and the details open below the map.";
    }
    if (q.includes("map")) {
      return "The interactive map shows real-time ocean data; you can zoom, click stations, and filter instruments.";
    }
    if (q.includes("advisory") || q.includes("alerts")) {
      return "The Advisories & Alerts section shows the latest ocean notices and warnings; it updates automatically.";
    }
    if (q.includes("show latest alerts")) {
      // Attempt to scroll to advisories section
      const el = document.getElementById("advisories-alerts");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return "Here are the latest alerts and advisories.";
      }
      return "Please scroll down to the ‘Advisories & Alerts’ section to see the latest notices.";
    }

    return "I’m the Ocean Assistant. Try asking: “What is In Situ?”, “What is Remote Sensing?”, “List instruments”, or “Show latest alerts”.";
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Show typing indicator
    const loadingId = crypto.randomUUID();
    setTypingId(loadingId);

    // Simulate "typing"
    setTimeout(() => {
      const response = generateAnswer(trimmed);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== loadingId),
        { id: crypto.randomUUID(), role: "bot", content: response },
      ]);
      setTypingId(null);
    }, 800);
  };

  const handleMicToggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const containerMaxWidth = useMemo(() => "max-w-sm", []);
  const containerMaxWidthMd = useMemo(() => "sm:max-w-md", []);
  const panelHeightSm = useMemo(() => "sm:h-[28rem]", []);
  const panelMaxHeight = useMemo(() => "max-h-[34rem]", []);

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Button
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
          aria-label="Open Ocean Assistant"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          className={`
            fixed bottom-20 right-4 z-50
            w-[90vw] ${containerMaxWidth} ${containerMaxWidthMd}
            h-[70vh] ${panelMaxHeight} ${panelHeightSm}
            rounded-xl border border-border bg-card text-card-foreground
            shadow-2xl flex flex-col overflow-hidden
          `}
        >
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95 p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base sm:text-lg">Ocean Assistant</h2>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">beta</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {messages.length === 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setInput(prompt);
                      setTimeout(() => document.forms[0]?.requestSubmit(), 10);
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-3 py-2
                    ${m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"}
                  `}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {typingId && (
              <div className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-2xl px-3 py-2 max-w-[85%]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Row */}
          <form
            onSubmit={handleSend}
            className="shrink-0 p-3 border-t bg-background/60 backdrop-blur supports-[backdrop-blur]:bg-background/60"
          >
            <div className="flex items-center gap-2">
              {/* Mic Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleMicToggle}
                disabled={!recognitionRef.current}
                aria-label="Voice input"
                title={
                  !recognitionRef.current
                    ? "Voice input unsupported"
                    : listening
                    ? "Stop listening"
                    : "Start listening"
                }
                className={`${
                  listening ? "bg-primary/20 ring-1 ring-primary/30" : ""
                }`}
              >
                <Mic className="h-4 w-4" />
              </Button>

              {/* Input Field */}
              <input
                type="text"
                placeholder="Ask about categories, instruments, maps, alerts..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Type your question"
              />

              {/* Send Button */}
              <Button type="submit" size="icon" aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};