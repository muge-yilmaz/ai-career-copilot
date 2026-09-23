"use client";

import React, { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function InterviewSimulator() {
  const [roleTitle, setRoleTitle] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Otomatik aşağı kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) return;
    setIsStarted(true);
  };

  // Mülakatı Bitir ve Kaydet
  const handleEndInterview = async () => {
    if (!sessionId || isLoading) return;
    setIsLoading(true);
    try {
      await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages,
          isFinished: true,
        }),
      });
      setIsCompleted(true);
    } catch (err) {
      console.error("Failed to save interview:", err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isCompleted) return;

    const userText = input;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          roleTitle,
          sessionId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to get response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let chunk = decoder.decode(value, { stream: true });

        // Backend'den gelen Session ID işaretçisini yakala
        if (chunk.includes("[SESSION_ID:")) {
          const match = chunk.match(/\[SESSION_ID:(.*?)\]/);
          if (match && match[1]) {
            setSessionId(match[1]);
            chunk = chunk.replace(/\[SESSION_ID:.*?\]/, "");
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: "Error: Failed to get response from AI." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 border rounded-xl bg-card shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold">AI Online Interview Simulator</h2>
        {isStarted && !isCompleted && (
          <button
            onClick={handleEndInterview}
            disabled={isLoading || messages.length === 0}
            className="py-1 px-3 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50"
          >
            End Interview
          </button>
        )}
      </div>

      {!isStarted ? (
        <form onSubmit={handleStartInterview} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Position for Interview</label>
            <input
              type="text"
              placeholder="e.g., React Developer, Data Scientist..."
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="w-full p-2 text-sm border rounded-md bg-background"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
          >
            Start Interview
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="h-[400px] overflow-y-auto border p-4 rounded-md space-y-4 bg-muted/20">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center italic">
                The interviewer for "{roleTitle}" is ready. Type "Hello" below to begin.
              </p>
            )}

            {messages.map((m) => {
              const isUser = m.role === "user";
              const senderName = isUser ? "You" : `Interviewer (${roleTitle})`;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-muted-foreground mb-1">
                    {senderName}
                  </span>
                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border text-card-foreground shadow-sm"
                    }`}
                  >
                    {m.content || (isLoading && !isUser ? "Thinking..." : "")}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {isCompleted ? (
            <div className="p-4 border rounded-md bg-muted text-center space-y-2">
              <p className="text-sm font-semibold text-green-600">
                Interview Completed & Saved!
              </p>
              <p className="text-xs text-muted-foreground">
                Your session has been recorded. You can view your history in the Dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 p-2 text-sm border rounded-md bg-background"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Thinking..." : "Send"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewSimulator;