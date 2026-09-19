interface AnalysisData {
  matchScore: number;
  feedback: string;
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
  jobTitle: string;
}

export function ResumeAnalysisResult({ data }: { data: AnalysisData }) {
  // Skor rengini belirleme
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500/20 bg-green-500/10";
    if (score >= 60) return "text-amber-500 border-amber-500/20 bg-amber-500/10";
    return "text-destructive border-destructive/20 bg-destructive/10";
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto p-6 border rounded-xl bg-card shadow-sm mt-6">
      {/* Başlık ve Eşleşme Skoru */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold">CV Analysis Result</h2>
          <p className="text-xs text-muted-foreground">Target Position: {data.jobTitle}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border text-center ${getScoreColor(data.matchScore)}`}>
          <span className="text-2xl font-black">{data.matchScore}%</span>
          <p className="text-[10px] uppercase font-bold tracking-wider">Match</p>
        </div>
      </div>

      {/* Genel AI Değerlendirmesi */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">General Evaluation</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{data.feedback}</p>
      </div>

      {/* Güçlü ve Eksik Yönler Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Güçlü Yönler */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
          <h4 className="text-xs font-bold text-green-600 flex items-center gap-1">
            ✓ Strengths
          </h4>
          <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
            {data.strengths.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Eksik Beceriler */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
          <h4 className="text-xs font-bold text-amber-600 flex items-center gap-1">
            ⚠ Missing Skills
          </h4>
          <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
            {data.missingSkills.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* İyileştirme Önerileri */}
      <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
        <h4 className="text-xs font-bold text-primary">💡 Improvement Suggestions</h4>
        <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
          {data.suggestions.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}