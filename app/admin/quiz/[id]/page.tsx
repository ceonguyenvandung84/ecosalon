"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Sparkles, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { QuizDetailItem, QuestionItem } from "@/lib/types";

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (4 lựa chọn)" },
  { value: "TRUE_FALSE", label: "Đúng / Sai" },
  { value: "FILL_IN", label: "Điền vào chỗ trống" },
  { value: "MATCHING", label: "Nối cặp" },
  { value: "ORDERING", label: "Sắp xếp thứ tự" },
];

const emptyQuestion = (type = "MULTIPLE_CHOICE") => ({
  type,
  text: "",
  options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : null,
  correctAnswer: type === "TRUE_FALSE" ? "TRUE" : "",
  matchedPairs: type === "MATCHING" ? [{ left: "", right: "" }, { left: "", right: "" }] : null,
  correctOrder: type === "ORDERING" ? ["", "", ""] : null,
  explanation: "",
  points: "1",
});

export default function QuizBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<QuizDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ questionCount: "5", types: ["MULTIPLE_CHOICE", "TRUE_FALSE"] });
  const [qDialog, setQDialog] = useState<{ open: boolean; question: Partial<QuestionItem> | null; index: number | null }>({ open: false, question: null, index: null });

  useEffect(() => {
    fetch(`/api/admin/quiz/${id}`)
      .then((r) => r.json())
      .then((d) => { setQuiz(d.quiz); setLoading(false); })
      .catch(() => { toast.error("Không tải được quiz"); setLoading(false); });
  }, [id]);

  const addQuestion = (type: string) => {
    setQDialog({ open: true, question: emptyQuestion(type), index: null });
  };

  const editQuestion = (q: Partial<QuestionItem>, index: number) => {
    const question = {
      ...q,
      options: q.options ? [...q.options] : null,
      matchedPairs: q.matchedPairs ? [...q.matchedPairs] : null,
      correctOrder: q.correctOrder ? [...q.correctOrder] : null,
      points: String(q.points || 1),
      correctAnswer: q.correctAnswer ?? "",
    };
    setQDialog({ open: true, question, index });
  };

  const saveQuestion = async () => {
    const q = qDialog.question;
    if (!q) { toast.error("Chưa chọn câu hỏi"); return; }
    if (!q.text?.trim()) { toast.error("Vui lòng nhập câu hỏi"); return; }

    setSaving(true);
    try {
      const payload = {
        type: q.type,
        text: q.text,
        options: q.options || null,
        correctAnswer: q.correctAnswer || null,
        matchedPairs: q.matchedPairs || null,
        correctOrder: q.correctOrder || null,
        explanation: q.explanation || null,
        order: qDialog.index ?? quiz?.questions?.length ?? 0,
        points: Number(q.points) || 1,
      };

      if (qDialog.index !== null) {
        const res = await fetch(`/api/admin/quiz/${id}/questions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, questionId: q.id }),
        });
        const d = await res.json();
        if (!res.ok) { toast.error(d?.error || "Lỗi"); return; }
      } else {
        const res = await fetch(`/api/admin/quiz/${id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!res.ok) { toast.error(d?.error || "Lỗi"); return; }
      }

      toast.success(qDialog.index !== null ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi");
      setQDialog({ ...qDialog, open: false });
      const r = await fetch(`/api/admin/quiz/${id}`).then((r) => r.json());
      setQuiz(r.quiz);
    } catch { toast.error("Lỗi server"); }
    finally { setSaving(false); }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    const res = await fetch(`/api/admin/quiz/${id}/questions?questionId=${questionId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      const r = await fetch(`/api/admin/quiz/${id}`).then((r) => r.json());
      setQuiz(r.quiz);
    } else toast.error("Xóa thất bại");
  };

  const generateAI = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/quiz/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionCount: Number(genForm.questionCount), types: genForm.types }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error || "Lỗi AI"); return; }
      toast.success(`Đã tạo ${d.count} câu hỏi bằng AI`);
      const r = await fetch(`/api/admin/quiz/${id}`).then((r) => r.json());
      setQuiz(r.quiz);
    } catch { toast.error("Lỗi server"); }
    finally { setGenerating(false); }
  };

  const updateQuiz = async (field: string, value: unknown) => {
    const res = await fetch(`/api/admin/quiz/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      setQuiz((prev) => ({ ...(prev as QuizDetailItem), [field]: value }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!quiz) return <div className="p-8 text-center">Không tìm thấy quiz</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild><Link href="/admin/quiz"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1">
          <h1 className="font-sans text-2xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">{quiz.lesson?.title} — {quiz.lesson?.course?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Xuất bản</span>
          <Switch checked={quiz.isPublished} onCheckedChange={(v) => updateQuiz("isPublished", v)} />
        </div>
      </div>

      {/* Quiz Settings */}
      <div className="mb-6 grid grid-cols-4 gap-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">% đạt</Label>
          <Input type="number" min="1" max="100" value={quiz.passPercent} onChange={(e) => updateQuiz("passPercent", Number(e.target.value))} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Thời gian (phút)</Label>
          <Input type="number" min="0" value={quiz.timeLimit ?? ""} onChange={(e) => updateQuiz("timeLimit", e.target.value ? Number(e.target.value) : null)} placeholder="0" className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Số lần làm tối đa</Label>
          <Input type="number" min="0" value={quiz.attemptLimit} onChange={(e) => updateQuiz("attemptLimit", Number(e.target.value))} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Câu hỏi</Label>
          <div className="flex h-8 items-center px-3 text-sm font-medium">{quiz.questions?.length ?? 0} câu</div>
        </div>
      </div>

      {/* AI Generation */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <Sparkles className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">Tạo câu hỏi bằng AI</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="number" min="1" max="20" value={genForm.questionCount} onChange={(e) => setGenForm({ ...genForm, questionCount: e.target.value })} className="w-20 h-8 text-sm" placeholder="Số câu" />
            <div className="flex gap-1 flex-wrap">
              {QUESTION_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => {
                  const types = genForm.types.includes(t.value)
                    ? genForm.types.filter((x) => x !== t.value)
                    : [...genForm.types, t.value];
                  setGenForm({ ...genForm, types });
                }} className={`px-2 py-1 text-xs rounded border ${genForm.types.includes(t.value) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={generateAI} disabled={generating || genForm.types.length === 0} size="sm">
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Tạo bằng AI
        </Button>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {quiz.questions?.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed text-muted-foreground">
            <p>Chưa có câu hỏi nào. Thêm câu hỏi hoặc dùng AI để tạo.</p>
          </div>
        ) : (
          quiz.questions?.map((q, i) => (
            <div key={q.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{QUESTION_TYPES.find((t) => t.value === q.type)?.label ?? q.type}</Badge>
                  <span className="text-xs text-muted-foreground">{q.points} điểm</span>
                </div>
                <p className="font-medium text-sm">{q.text}</p>
                {q.type === "MULTIPLE_CHOICE" && q.options && (
                  <div className="mt-2 space-y-1">
                    {q.options.map((opt: string, oi: number) => (
                      <div key={oi} className={`text-xs px-2 py-1 rounded ${q.correctAnswer === String.fromCharCode(65 + oi) ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-secondary/50"}`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
                {q.type === "TRUE_FALSE" && (
                  <p className="mt-1 text-xs text-muted-foreground">Đáp án: {q.correctAnswer === "TRUE" ? "Đúng" : "Sai"}</p>
                )}
                {q.type === "FILL_IN" && (
                  <p className="mt-1 text-xs text-muted-foreground">Đáp án: {q.correctAnswer}</p>
                )}
                {q.explanation && <p className="mt-2 text-xs text-muted-foreground italic">Giải thích: {q.explanation}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => editQuestion(q, i)}><Pencil className="h-4 w-4" /></Button>
                   <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteQuestion(q.id!)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Question Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {QUESTION_TYPES.map((t) => (
          <Button key={t.value} variant="outline" size="sm" onClick={() => addQuestion(t.value)}>
            <Plus className="mr-1 h-3 w-3" /> {t.label}
          </Button>
        ))}
      </div>

      {/* Question Edit Dialog */}
      <Dialog open={qDialog.open} onOpenChange={(v) => setQDialog({ ...qDialog, open: v })}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader><DialogTitle>{qDialog.index !== null ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loại câu hỏi</Label>
              <Select value={qDialog.question?.type} onValueChange={(v) => setQDialog({ ...qDialog, question: { ...qDialog.question, type: v, correctAnswer: v === "TRUE_FALSE" ? "TRUE" : "", options: v === "MULTIPLE_CHOICE" ? ["", "", "", ""] : null, matchedPairs: v === "MATCHING" ? [{ left: "", right: "" }, { left: "", right: "" }] : null, correctOrder: v === "ORDERING" ? ["", "", ""] : null } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Câu hỏi *</Label>
              <Textarea value={qDialog.question?.text ?? ""} onChange={(e) => setQDialog({ ...qDialog, question: { ...qDialog.question, text: e.target.value } })} rows={3} placeholder="Nhập câu hỏi..." />
            </div>

            {qDialog.question?.type === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <Label>Các lựa chọn</Label>
                {["A", "B", "C", "D"].map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-sm font-medium">{opt}.</span>
                    <Input
                      value={qDialog.question?.options?.[i] ?? ""}
                      onChange={(e) => {
                        const options = [...(qDialog.question?.options ?? ["", "", "", ""])];
                        options[i] = e.target.value;
                        setQDialog({ ...qDialog, question: { ...qDialog.question, options } });
                      }}
                      placeholder={`Đáp án ${opt}`}
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label className="text-xs">Đáp án đúng *</Label>
                  <Select value={qDialog.question?.correctAnswer} onValueChange={(v) => setQDialog({ ...qDialog, question: { ...qDialog.question, correctAnswer: v } })}>
                    <SelectTrigger><SelectValue placeholder="Chọn đáp án đúng" /></SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].filter((_, i) => qDialog.question?.options?.[i]).map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {qDialog.question?.type === "TRUE_FALSE" && (
              <div className="space-y-2">
                <Label>Đáp án đúng</Label>
                <Select value={qDialog.question?.correctAnswer ?? "TRUE"} onValueChange={(v) => setQDialog({ ...qDialog, question: { ...qDialog.question, correctAnswer: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRUE">Đúng (True)</SelectItem>
                    <SelectItem value="FALSE">Sai (False)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {qDialog.question?.type === "FILL_IN" && (
              <div className="space-y-2">
                <Label>Đáp án đúng</Label>
                <Input value={qDialog.question?.correctAnswer ?? ""} onChange={(e) => setQDialog({ ...qDialog, question: { ...qDialog.question, correctAnswer: e.target.value } })} placeholder="Từ/cụm từ đúng (so khớp chính xác)" />
              </div>
            )}

            {qDialog.question?.type === "MATCHING" && (
              <div className="space-y-3">
                <Label>Các cặp ghép</Label>
                {(qDialog.question?.matchedPairs ?? [{ left: "", right: "" }, { left: "", right: "" }]).map((pair: { left: string; right: string }, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={pair.left} onChange={(e) => {
                      const pairs = [...(qDialog.question?.matchedPairs ?? [])];
                      pairs[i] = { ...pairs[i]!, left: e.target.value };
                      setQDialog({ ...qDialog, question: { ...qDialog.question, matchedPairs: pairs } });
                    }} placeholder={`Mục trái ${i + 1}`} className="flex-1" />
                    <span className="text-muted-foreground">=</span>
                    <Input value={pair.right} onChange={(e) => {
                      const pairs = [...(qDialog.question?.matchedPairs ?? [])];
                      pairs[i] = { ...pairs[i]!, right: e.target.value };
                      setQDialog({ ...qDialog, question: { ...qDialog.question, matchedPairs: pairs } });
                    }} placeholder={`Mục phải ${i + 1}`} className="flex-1" />
                    <Button size="sm" variant="ghost" onClick={() => {
                      const pairs = (qDialog.question?.matchedPairs ?? []).filter((_: unknown, j: number) => j !== i);
                      setQDialog({ ...qDialog, question: { ...qDialog.question, matchedPairs: pairs } });
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => {
                  const pairs = [...(qDialog.question?.matchedPairs ?? []), { left: "", right: "" }];
                  setQDialog({ ...qDialog, question: { ...qDialog.question, matchedPairs: pairs } });
                }}><Plus className="mr-1 h-3 w-3" /> Thêm cặp</Button>
              </div>
            )}

            {qDialog.question?.type === "ORDERING" && (
              <div className="space-y-3">
                <Label>Thứ tự đúng (từ trên xuống)</Label>
                {(qDialog.question?.correctOrder ?? ["", "", ""]).map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-sm text-muted-foreground">{i + 1}.</span>
                    <Input value={item} onChange={(e) => {
                      const order = [...(qDialog.question?.correctOrder ?? [])];
                      order[i] = e.target.value;
                      setQDialog({ ...qDialog, question: { ...qDialog.question, correctOrder: order } });
                    }} placeholder={`Mục thứ ${i + 1}`} />
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => {
                  const order = [...(qDialog.question?.correctOrder ?? []), ""];
                  setQDialog({ ...qDialog, question: { ...qDialog.question, correctOrder: order } });
                }}><Plus className="mr-1 h-3 w-3" /> Thêm mục</Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Giải thích (để hiển thị sau khi nộp)</Label>
              <Textarea value={qDialog.question?.explanation ?? ""} onChange={(e) => setQDialog({ ...qDialog, question: { ...qDialog.question, explanation: e.target.value } })} rows={2} placeholder="Giải thích đáp án đúng..." />
            </div>

            <div className="space-y-2">
              <Label>Điểm số</Label>
              <Input type="number" min="1" max="10" value={qDialog.question?.points ?? "1"} onChange={(e) => setQDialog({ ...qDialog, question: { ...qDialog.question, points: e.target.value } })} className="w-24" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQDialog({ ...qDialog, open: false })}>Hủy</Button>
            <Button onClick={saveQuestion} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu câu hỏi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}