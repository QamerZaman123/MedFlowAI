"use client";

/**
 * ============================================================================
 * MedFlowAI Knowledge Copilot — Clinical RAG Assistant
 * ============================================================================
 * Redesigned with Perplexity / Linear AI copilot aesthetics:
 * - High-clarity typography with distinct User & Assistant message cards
 * - Real-time SSE token streaming indicator
 * - Interactive clinical citations with document name, section & page metadata
 * - Collapsible query history drawer and quick query suggestion pills
 * ============================================================================
 */

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import ModalOverlay from "@/components/ModalOverlay";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  FileText,
  Sparkles,
  History,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

export default function KnowledgeChat({ initialQuestion = "", compact = false }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome-msg",
      sender: "ai",
      text: "Hello! I am your MedFlowAI Clinical Knowledge Assistant. Ask me any question regarding hospital SOPs, emergency guidelines, or medication protocols. Every answer is grounded directly in official clinic documents with strict citations.",
      sources: [],
    },
  ]);
  const [inputQuery, setInputQuery] = useState(initialQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [streamError, setStreamError] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat history on mount
  const loadChatHistory = async () => {
    try {
      const res = await fetch("/api/knowledge/history", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          setChatHistory(data.history);
        }
      }
    } catch (err) {
      console.warn("Failed to load chat history:", err);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  const handleSend = async (questionToSend) => {
    const query = (questionToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setStreamError("");
    setInputQuery("");
    setIsLoading(true);

    const userMessageId = "user-" + Date.now();
    const aiMessageId = "ai-" + Date.now();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, sender: "user", text: query },
      { id: aiMessageId, sender: "ai", text: "", sources: [], isStreaming: true },
    ]);

    try {
      const response = await fetch("/api/knowledge/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok) {
        let errorText = "Unable to reach knowledge server";
        try {
          const errJson = await response.json();
          errorText = errJson.message || errorText;
        } catch (e) {}
        throw new Error(errorText);
      }

      if (!response.body) {
        throw new Error("No readable stream received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let accumulatedSources = [];
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const blockLines = block.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of blockLines) {
            if (line.startsWith("event: ")) {
              eventType = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.replace("data: ", "").trim();
            }
          }

          if (eventType === "sources" && dataStr) {
            try {
              accumulatedSources = JSON.parse(dataStr);
            } catch (e) {
              console.error("Error parsing sources SSE:", e);
            }
          } else if (dataStr) {
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                accumulatedText += parsed.token;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, text: accumulatedText, sources: accumulatedSources }
                      : msg
                  )
                );
              }
            } catch (e) {
              accumulatedText += dataStr;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, text: accumulatedText, sources: accumulatedSources }
                    : msg
                )
              );
            }
          }
        }
      }

      if (!accumulatedText) {
        throw new Error("Empty response received from knowledge assistant");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: accumulatedText,
                sources: accumulatedSources,
                isStreaming: false,
              }
            : msg
        )
      );

      loadChatHistory();
    } catch (err) {
      console.error("Knowledge stream error:", err);
      setStreamError(err.message || "Failed to complete knowledge stream");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: `⚠️ Knowledge Assistant Error: ${err.message || "Unable to retrieve information"}.`,
                isStreaming: false,
                isError: true,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex ${compact ? "h-[520px]" : "h-[calc(100vh-8.5rem)]"} gap-4`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-clinic-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Knowledge Copilot
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                  Grounded in SOPs
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">Vector search powered by Gemini & Qdrant</p>
            </div>
          </div>

          <button
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs active:scale-[0.98]"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              {chatHistory.length}
            </span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
          {streamError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in shadow-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{streamError}</span>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs shadow-xs ${
                  msg.sender === "user"
                    ? "bg-slate-800"
                    : msg.isError
                    ? "bg-rose-600"
                    : "bg-gradient-to-tr from-clinic-600 to-medical-600"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-slate-900 text-white shadow-sm rounded-tr-sm"
                    : msg.isError
                    ? "bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-sm"
                    : "bg-white border border-slate-200 shadow-sm text-slate-800 rounded-tl-sm"
                }`}
              >
                {/* AI typing indicator */}
                {!msg.text && msg.isStreaming && (
                  <span className="inline-flex items-center space-x-1 text-slate-400 py-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce [animation-delay:0.2s]">●</span>
                    <span className="animate-bounce [animation-delay:0.4s]">●</span>
                  </span>
                )}

                {/* User messages: plain text */}
                {msg.sender === "user" && msg.text && (
                  <p className="leading-relaxed text-white">{msg.text}</p>
                )}

                {/* AI messages: full markdown rendering */}
                {msg.sender === "ai" && msg.text && (
                  <div className="md-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-clinic-600" />
                      Grounded Citations ({msg.sources.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedCitation(src)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-clinic-50/70 hover:bg-clinic-100 border border-clinic-200/80 text-clinic-800 text-[11px] font-semibold transition cursor-pointer active:scale-[0.98]"
                        >
                          <FileText className="w-3 h-3 text-clinic-600" />
                          <span className="truncate max-w-[140px]">{src.documentName}</span>
                          <span className="text-clinic-600 font-mono text-[10px]">P.{src.page}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about clinical protocols, triage SOPs, medication dosages..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clinic-500/20 focus:border-clinic-500 focus:bg-white transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputQuery.trim()}
              className="px-4 py-2.5 bg-clinic-600 hover:bg-clinic-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition shadow-xs"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto text-[11px] text-slate-500 pt-1">
            <span className="flex-shrink-0 font-semibold text-slate-400">Suggested:</span>
            <button
              onClick={() => handleSend("What is the emergency triage protocol for severe dengue?")}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition font-medium text-[11px]"
            >
              Dengue triage SOP
            </button>
            <button
              onClick={() => handleSend("What are the criteria for inpatient admission?")}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition font-medium text-[11px]"
            >
              Admission criteria
            </button>
            <button
              onClick={() => handleSend("What is the infection control protocol for isolation wards?")}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition font-medium text-[11px]"
            >
              Infection control
            </button>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistorySidebar && (
        <div className="w-72 sm:w-80 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-clinic-600" />
              Query History
            </h3>
            <button
              onClick={() => setShowHistorySidebar(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2.5 space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No past chat history recorded.
              </p>
            ) : (
              chatHistory.map((item) => (
                <div
                  key={item._id}
                  onClick={() => {
                    setMessages((prev) => [
                      ...prev,
                      { id: "hist-q-" + item._id, sender: "user", text: item.question },
                      {
                        id: "hist-a-" + item._id,
                        sender: "ai",
                        text: item.answer,
                        sources: item.sources || [],
                      },
                    ]);
                  }}
                  className="p-3 rounded-xl border border-slate-100 hover:border-clinic-300 hover:bg-clinic-50/40 cursor-pointer transition text-xs space-y-1 group"
                >
                  <p className="font-semibold text-slate-800 line-clamp-1 group-hover:text-clinic-700 transition">
                    {item.question}
                  </p>
                  <p className="text-slate-500 line-clamp-2 text-[11px]">{item.answer}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100/60 mt-1">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="text-clinic-600 font-medium">{item.sources?.length || 0} citations</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Citation Detail Modal */}
      {selectedCitation && (
        <ModalOverlay className="animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-clinic-50 text-clinic-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Clinical SOP Citation</h3>
                  <p className="text-[11px] text-slate-500">Source ground truth from Qdrant vector database</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Title</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedCitation.documentName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</span>
                  <p className="font-medium text-slate-800 mt-0.5">{selectedCitation.section || "General"}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page Reference</span>
                  <p className="font-medium text-slate-800 mt-0.5">Page {selectedCitation.page || 1}</p>
                </div>
              </div>

              {selectedCitation.documentId && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document ID</span>
                  <p className="font-mono text-[11px] text-slate-500 mt-0.5 break-all">
                    {selectedCitation.documentId}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedCitation(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Close Citation
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
