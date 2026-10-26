"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Evaluation {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

interface InterviewSimulatorProps {
  resumeSessionId?: string;
}

function readTranscript(messages: unknown): Message[] {
  if (!Array.isArray(messages)) return [];

  return messages.flatMap((message, index) => {
    if (!message || typeof message !== "object") return [];
    const record = message as Record<string, unknown>;
    const role = record.role === "user" || record.role === "assistant" ? record.role : null;
    const content = typeof record.content === "string" ? record.content : "";
    const id = typeof record.id === "string" && record.id.length > 0 && record.id.length <= 128
      ? record.id
      : `restored-${index}`;
    if (!role || !content.trim()) return [];
    return [{ id, role, content }];
  });
}

export function InterviewSimulator({ resumeSessionId }: InterviewSimulatorProps) {
  const [roleTitle, setRoleTitle] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId ?? null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isResuming, setIsResuming] = useState(Boolean(resumeSessionId));
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!resumeSessionId) return;

    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch(`/api/interview?sessionId=${encodeURIComponent(resumeSessionId ?? "")}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Could not resume this interview.");
        }
        if (cancelled) return;

        setRoleTitle(typeof data?.roleTitle === "string" ? data.roleTitle : "");
        setSessionId(typeof data?.id === "string" ? data.id : resumeSessionId ?? null);
        setMessages(readTranscript(data?.messages));
        setIsStarted(true);
        setResumed(true);
      } catch (error) {
        if (!cancelled) {
          setResumeError(error instanceof Error ? error.message : "Could not resume this interview.");
        }
      } finally {
        if (!cancelled) setIsResuming(false);
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [resumeSessionId]);

  const handleStartInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) return;
    setIsStarted(true);
  };

  const handleEndInterview = async () => {
    if (isLoading || isEvaluating) return;

    setIsEvaluating(true);

    try {
      // 1. Mülakatı Kaydet
      if (sessionId) {
        await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            messages,
            isFinished: true,
          }),
        });
      }

      // 2. Değerlendirme Al
      const evalRes = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages,
          roleTitle,
        }),
      });

      if (evalRes.ok) {
        const evalData = await evalRes.json();
        setEvaluation(evalData);
      }
    } catch (err) {
      console.error("Failed to evaluate interview:", err);
    } finally {
      setIsEvaluating(false);
      setIsCompleted(true);
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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to get response");
      }
      if (!res.body) {
        throw new Error("Failed to get response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let chunk = decoder.decode(value, { stream: true });

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
      const message = err instanceof Error ? err.message : "Failed to get response from AI.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: message }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 border rounded-xl bg-card shadow-sm space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b pb-4">
        <h2 className="text-lg sm:text-xl font-bold">AI Online Interview Simulator</h2>
        {isStarted && !isCompleted && (
          <button
            onClick={handleEndInterview}
            disabled={isLoading || isEvaluating || messages.length === 0}
            className="w-full sm:w-auto min-h-10 py-2 px-3 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {isEvaluating ? "Analyzing Performance..." : "End Interview"}
          </button>
        )}
      </div>

      {isResuming ? (
        <div className="py-10 text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading your interview...</p>
        </div>
      ) : !isStarted ? (
        <form onSubmit={handleStartInterview} className="space-y-4">
          {resumeError && (
            <p className="text-xs text-destructive">{resumeError}</p>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Position for Interview</label>
            <input
              type="text"
              placeholder="e.g., React Developer, Data Scientist..."
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="w-full min-h-11 p-2.5 text-base sm:text-sm border rounded-md bg-background"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-11 py-2.5 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
          >
            Start Interview
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="h-[min(52dvh,420px)] min-h-[260px] sm:h-[350px] overflow-y-auto border p-3 sm:p-4 rounded-md space-y-4 bg-muted/20">
            {resumed && (
              <p className="text-xs text-muted-foreground text-center">
                Continuing your {roleTitle} interview.
              </p>
            )}
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center italic">
                {resumed
                  ? "No earlier messages were saved for this session. Type below to pick the conversation back up."
                  : `The interviewer for "${roleTitle}" is ready. Type "Hello" below to begin.`}
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
                    className={`p-3 rounded-lg text-sm leading-relaxed max-w-[90%] sm:max-w-[85%] break-words whitespace-pre-wrap ${
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

          {isEvaluating ? (
            <div className="p-6 border rounded-lg bg-card text-center space-y-3 shadow-sm">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm font-medium text-foreground">
                Analyzing your interview performance...
              </p>
              <p className="text-xs text-muted-foreground">
                Evaluating technical responses, communication clarity, and overall fit.
              </p>
            </div>
          ) : isCompleted && evaluation ? (
            <div className="p-5 border rounded-lg bg-card space-y-4 shadow-sm">
              <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:justify-between min-[420px]:items-center border-b pb-3">
                <h3 className="text-base font-bold text-primary">
                  Interview Performance Report
                </h3>
                <span className="self-start text-xs px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-semibold whitespace-nowrap">
                  Overall Score: {evaluation.overallScore}/100
                </span>
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 text-xs">
                <div className="p-3 border rounded bg-muted/30">
                  <span className="text-muted-foreground">Technical Score:</span>
                  <p className="text-sm font-semibold">{evaluation.technicalScore}/100</p>
                </div>
                <div className="p-3 border rounded bg-muted/30">
                  <span className="text-muted-foreground">Communication Score:</span>
                  <p className="text-sm font-semibold">{evaluation.communicationScore}/100</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <strong className="text-green-600">Key Strengths:</strong>
                  <ul className="list-disc pl-4 mt-1 text-muted-foreground space-y-0.5">
                    {evaluation.strengths?.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong className="text-amber-600">Areas for Improvement:</strong>
                  <ul className="list-disc pl-4 mt-1 text-muted-foreground space-y-0.5">
                    {evaluation.improvements?.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t">
                  <strong className="text-foreground">Detailed Feedback:</strong>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="p-4 border rounded-md bg-muted text-center space-y-2">
              <p className="text-sm font-semibold text-green-600">
                Interview Completed & Saved!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex flex-col min-[420px]:flex-row gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 min-w-0 min-h-11 p-2.5 text-base sm:text-sm border rounded-md bg-background"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="min-h-11 shrink-0 py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
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
