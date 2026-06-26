"use client";

import React, { useState } from "react";
import { Send, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, QAResponse } from "@/lib/api";

interface QAChatProps {
  contractId: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: QAResponse["citations"];
}

const SUGGESTED_QUESTIONS = [
  "What is the termination notice period?",
  "Are there any uncapped indemnity clauses?",
  "What is the governing law?",
  "What are the payment terms?",
  "Is there an auto-renewal clause?",
  "What are the confidentiality obligations?",
];

export function QAChat({ contractId }: QAChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const askQuestion = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.askQuestion(contractId, question);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.answer,
        citations: response.citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.detail || "Failed to get answer"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                Ask questions about this contract
              </p>
              <p className="text-sm text-slate-500 mt-1">
                AI-powered answers grounded in the document
              </p>
            </div>

            {/* Suggested Questions */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => askQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full
                    bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-400
                    hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-400
                    border border-slate-200 dark:border-slate-700
                    transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm animate-[scale-in_0.2s_ease-out]
                ${msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-md"
                  : "bg-slate-100 dark:bg-surface-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/30">
                  <p className="text-xs opacity-70 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Sources: {msg.citations.map((c) =>
                      c.page_number ? `Page ${c.page_number}` : c.section_header
                    ).filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-surface-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion(input)}
            placeholder="Ask about this contract..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700
              bg-white dark:bg-surface-800 text-slate-900 dark:text-white
              px-4 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
              transition-all duration-200"
          />
          <Button
            onClick={() => askQuestion(input)}
            disabled={!input.trim() || isLoading}
            size="md"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
