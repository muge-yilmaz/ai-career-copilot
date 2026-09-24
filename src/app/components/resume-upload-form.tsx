"use client";

import { useState } from "react";
import { ResumeAnalysisResult } from "./resume-analysis-result";
import {useRouter} from "next/navigation";

export function ResumeUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Please select a CV file." });
      return;
    }

    setLoading(true);
    setMessage(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetJobTitle", targetJobTitle);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred while uploading the file.");
      }

      setMessage({ type: "success", text: "CV successfully uploaded and text extracted!" });
     
      // Oluşturulan analizin ID'sine göre kullanıcıyı detay sayfasına yönlendiriyoruz
    if (data.data?.id) {
        router.push(`/dashboard/resume/${data.data.id}`);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 border rounded-xl bg-card shadow-sm">
      <h2 className="text-xl font-bold text-center">CV Upload & Analyze</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium">Target Position (Optional)</label>
        <input
          type="text"
          placeholder="e.g., Senior Frontend Developer"
          value={targetJobTitle}
          onChange={(e) => setTargetJobTitle(e.target.value)}
          className="w-full p-2 text-sm border rounded-md bg-background"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">CV File (PDF or DOCX)</label>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full p-2 text-sm border rounded-md bg-background file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground"
        />
      </div>

      {message && (
        <div
          className={`p-3 text-xs rounded-md ${message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
            }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "AI Analyzing..." : "Upload CV & Analyze"}
      </button>
    </form>

    {/* Gemini Analiz Sonucu Varsa Ekrana Basıyoruz */}
    {analysisResult && <ResumeAnalysisResult data={analysisResult} />}
    </div>
  );
}