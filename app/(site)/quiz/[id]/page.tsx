"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, AlertCircle, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  TRUE_FALSE: "Đúng / Sai",
  FILL_IN: "Điền vào chỗ trống",
  MATCHING: "Nối cặp",
  ORDERING: "Sắp xếp thứ tự",
};

export default function QuizPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<{
    id: string; title: string; timeLimit?: number; attemptLimit?: number; attemptUsed?: number; locked?: boolean;
    lastAttempt?: { passed: boolean; score: number };
    lesson?: { title: string };
    questions: Array<{
      id: string; type: string; text: string; points: number;
      options?: string[]; matchedPairs?: Array<{ left: string; right: string }>;
      correctOrder?: string[];
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean; score: number; passPercent: number; earnedPoints: number; totalPoints: number;
    results?: Array<{ correct: boolean; type: string; points: number; text: string; correctAnswer?: string; userAnswer?: string; explanation?: string }>;
  } | null>(null);
  const [startedAt] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/${quizId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.quiz?.locked) {
          setQuiz({ ...d.quiz, locked: true });
          setLoading(false);
          return;
        }
        setQuiz(d.quiz);
        setLoading(false);
        if (d.quiz?.timeLimit) setTimeLeft(d.quiz.timeLimit * 60);
      })
      .catch(() => { toast.error("Không tải được quiz"); setLoading(false); });
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - startedAt.getTime()) / 1000);
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: typeof answer === "string" ? answer : JSON.stringify(answer),
      }));
      const res = await fetch(`/api/quiz/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers, startedAt: startedAt.toISOString(), timeSpent }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error || "Lỗi"); return; }
      setResult(d.attempt);
    } catch { toast.error("Lỗi server"); }
    finally { setSubmitting(false); }
  }, [submitting, quizId, startedAt, answers]);

  useEffect(() => {
    if (timeLeft === 0 && !result) handleSubmit();
  }, [timeLeft, result, handleSubmit, setSubmitting, setResult]);

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  if (!quiz) return <div className="flex flex-col items-center justify-center py-20"><AlertCircle className="h-10 w-10 text-muted-foreground mb-3" /><p>Không tìm thấy quiz</p><Button variant="outline" className="mt-4" onClick={() => router.back()}>Quay lại</Button></div>;

  if (quiz.locked) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <XCircle className="h-12 w-12 text-destructive mb-3" />
      <h2 className="font-sans text-xl font-bold mb-2">Đã hết lượt làm</h2>
      <p className="text-muted-foreground text-center mb-4">Bạn đã đạt giới hạn {quiz.attemptLimit} lượt làm quiz này.</p>
      {quiz.lastAttempt && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Kết quả gần nhất: {quiz.lastAttempt.passed ? "Đạt" : "Chưa đạt"}</p>
          <p className="text-2xl font-bold">{quiz.lastAttempt.score}%</p>
        </div>
      )}
      <Button variant="outline" onClick={() => router.back()}>Quay lại bài học</Button>
    </div>
  );

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-6 text-center mb-6">
          <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${result.passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {result.passed ? <CheckCircle2 className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
          </div>
          <h2 className="font-sans text-2xl font-bold mb-1">{result.passed ? "Chúc mừng!" : "Chưa đạt"}</h2>
          <p className="text-muted-foreground mb-4">Bạn đạt {result.score}% (yêu cầu {result.passPercent}%)</p>
          <div className="mx-auto mb-4 h-3 w-64 rounded-full bg-secondary">
            <div className={`h-3 rounded-full transition-all ${result.passed ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${result.score}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">{result.earnedPoints}/{result.totalPoints} điểm</p>
        </div>

        {(quiz.attemptLimit ?? 0) === 0 || (quiz.attemptLimit ?? 0) > (quiz.attemptUsed || 0) + 1 ? (
          <Button variant="outline" className="mb-6 gap-2" onClick={() => { setResult(null); setAnswers({}); setCurrentQ(0); }}>
            <RefreshCw className="h-4 w-4" /> Làm lại
          </Button>
        ) : <p className="mb-6 text-sm text-muted-foreground text-center">Đã hết lượt làm.</p>}

        <div className="space-y-4">
          {result.results?.map((r, i) => (
            <div key={i} className={`rounded-xl border p-4 ${r.correct ? "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"}`}>
              <div className="flex items-start gap-3">
                {r.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[r.type] || r.type}</Badge>
                    <span className="text-xs text-muted-foreground">{r.points} điểm</span>
                  </div>
                  <p className="font-medium text-sm mb-2">{r.text}</p>
                  {!r.correct && r.correctAnswer ? (
                    <div className="text-sm">
                      <p className="text-red-600 dark:text-red-400">Đáp án của bạn: {r.userAnswer || "(trống)"}</p>
                      <p className="text-green-600 dark:text-green-400">Đáp án đúng: {r.correctAnswer}</p>
                    </div>
                  ) : null}
                  {r.explanation ? <p className="mt-2 text-xs text-muted-foreground italic">{r.explanation}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => router.back()}>Quay lại bài học</Button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQData = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">{quiz.lesson?.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length}</span>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${timeLeft < 60 ? "text-destructive" : ""}`}>
              <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      <Progress value={(answeredCount / Math.max(questions.length, 1)) * 100} className="mb-6 h-2" />

      {questions.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Brain className="h-10 w-10 mb-3" /><p>Quiz chưa có câu hỏi nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question Card */}
          {currentQData && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-xs">{TYPE_LABELS[currentQData.type] || currentQData.type}</Badge>
                <Badge variant="secondary" className="text-xs">{currentQData.points} điểm</Badge>
                <span className="text-xs text-muted-foreground ml-auto">Câu {currentQ + 1}/{questions.length}</span>
              </div>
              <p className="font-medium mb-4">{currentQData.text}</p>

              {/* MULTIPLE_CHOICE */}
              {currentQData.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  {currentQData.options?.map((opt: string, oi: number) => {
                    const letter = String.fromCharCode(65 + oi);
                    return (
                      <button key={oi} type="button" onClick={() => setAnswer(currentQData.id, letter)} className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${answers[currentQData.id] === letter ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-secondary"}`}>
                        <span className="font-medium mr-2">{letter}.</span> {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TRUE_FALSE */}
              {currentQData.type === "TRUE_FALSE" && (
                <div className="flex gap-3">
                  {["TRUE", "FALSE"].map((val) => (
                    <button key={val} type="button" onClick={() => setAnswer(currentQData.id, val)} className={`flex-1 px-6 py-4 rounded-lg border text-sm font-medium transition ${answers[currentQData.id] === val ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"}`}>
                      {val === "TRUE" ? "Đúng" : "Sai"}
                    </button>
                  ))}
                </div>
              )}

              {/* FILL_IN */}
              {currentQData.type === "FILL_IN" && (
                <input
                  type="text"
                  value={answers[currentQData.id] || ""}
                  onChange={(e) => setAnswer(currentQData.id, e.target.value)}
                  placeholder="Nhập câu trả lời..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm"
                  autoFocus
                />
              )}

              {/* MATCHING */}
              {currentQData.type === "MATCHING" && (
                <div className="space-y-3">
                  {(currentQData.matchedPairs as Array<{ left: string; right: string }>)?.map((pair, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm">{pair.left}</div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <select
                        value={(answers[currentQData.id]?.[i] as string) || ""}
                        onChange={(e) => {
                          const current = [...(answers[currentQData.id] || [])] as string[];
                          current[i] = e.target.value;
                          setAnswer(currentQData.id, current);
                        }}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">-- Chọn --</option>
                        {(currentQData.matchedPairs as Array<{ left: string; right: string }>)?.map((_, ri) => (
                          <option key={ri} value={ri}>Mục {ri + 1}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* ORDERING */}
              {currentQData.type === "ORDERING" && (
                <div className="space-y-2">
                  {(currentQData.correctOrder as string[])?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      <span className="text-muted-foreground font-medium">{i + 1}.</span>
                      <span className="flex-1">{item}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground italic mt-2">Hãy nhập thứ tự đúng (ví dụ: 2,1,3)</p>
                  <input
                    type="text"
                    value={answers[currentQData.id] || ""}
                    onChange={(e) => setAnswer(currentQData.id, e.target.value)}
                    placeholder="Sắp xếp các mục theo thứ tự 1,2,3..."
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((p) => p - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Câu trước
            </Button>
            {currentQ < questions.length - 1 ? (
              <Button onClick={() => setCurrentQ((p) => p + 1)}>
                Câu sau <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowConfirm(true)} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Nộp bài
              </Button>
            )}
          </div>

          {/* Question dots */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {questions.map((q, i) => (
              <button key={q.id} type="button" onClick={() => setCurrentQ(i)} className={`h-3 w-3 rounded-full transition ${answers[q.id] ? "bg-primary" : i === currentQ ? "bg-primary/50" : "bg-secondary"}`} />
            ))}
          </div>
        </div>
      )}

      {/* Confirm Submit Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConfirm(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-sans text-lg font-bold mb-2">Nộp bài?</h3>
            <p className="text-sm text-muted-foreground mb-4">Bạn đã trả lời {answeredCount}/{questions.length} câu. Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Tiếp tục làm</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}