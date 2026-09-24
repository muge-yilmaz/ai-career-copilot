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

export function InterviewSimulator() {
  const [roleTitle, setRoleTitle] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      if (!res.ok || !res.body) {
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
            disabled={isLoading || isEvaluating || messages.length === 0}
            className="py-1.5 px-3 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {isEvaluating ? "Analyzing Performance..." : "End Interview"}
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
          <div className="h-[350px] overflow-y-auto border p-4 rounded-md space-y-4 bg-muted/20">
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
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-primary">
                  Interview Performance Report
                </h3>
                <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                  Overall Score: {evaluation.overallScore}/100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
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