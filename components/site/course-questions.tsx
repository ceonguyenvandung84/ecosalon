"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, MessageSquare, Plus, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface UserSummary {
  id: string;
  fullName: string;
  role?: "USER" | "INSTRUCTOR" | "ADMIN";
}

interface CourseQuestion {
  id: string;
  title: string;
  content: string;
  isResolved: boolean;
  createdAt: string;
  user?: UserSummary;
  _count?: { answers: number };
}

interface CourseAnswer {
  id: string;
  content: string;
  createdAt: string;
  user?: UserSummary;
}

export function QuestionsSection({ courseSlug, isEnrolled }: { courseSlug: string; isEnrolled?: boolean }) {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, CourseAnswer[]>>({});
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/questions`);
      const d = await res.json();
      setQuestions(d?.questions ?? []);
    } catch { setQuestions([]); }
    finally { setLoading(false); }
  }, [courseSlug]);

  useEffect(() => { if (courseSlug) load(); }, [courseSlug, load, setLoading, setQuestions]);

  const askQuestion = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Vui lòng nhập tiêu đề và nội dung"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error || "Lỗi"); return; }
      toast.success("Đã gửi câu hỏi");
      setTitle(""); setContent(""); setShowForm(false);
      load();
    } catch { toast.error("Lỗi server"); }
    finally { setSaving(false); }
  };

  const toggleExpand = async (qId: string) => {
    if (expandedId === qId) { setExpandedId(null); return; }
    setExpandedId(qId);
    if (!answers[qId]) {
      try {
        const res = await fetch(`/api/courses/questions/${qId}/answers`);
        const d = await res.json();
        setAnswers((prev) => ({ ...prev, [qId]: d?.question?.answers ?? [] }));
      } catch { setAnswers((prev) => ({ ...prev, [qId]: [] })); }
    }
  };

  const postReply = async (questionId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`/api/courses/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error || "Lỗi"); return; }
      setReplyText("");
      setReplyingTo(null);
      const res2 = await fetch(`/api/courses/questions/${questionId}/answers`);
      const d2 = await res2.json();
      setAnswers((prev) => ({ ...prev, [questionId]: d2?.question?.answers ?? [] }));
    } catch { toast.error("Lỗi server"); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{questions.length} câu hỏi</p>
        {session?.user && isEnrolled && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> Đặt câu hỏi
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề câu hỏi..." />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Nội dung câu hỏi..." />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button size="sm" onClick={askQuestion} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Gửi câu hỏi
            </Button>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-muted-foreground rounded-xl border border-dashed">
          <MessageSquare className="mb-2 h-8 w-8" />
          <p className="text-sm">Chưa có câu hỏi nào.</p>
          {!isEnrolled && <p className="text-xs mt-1">Tham gia khóa học để đặt câu hỏi.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button onClick={() => toggleExpand(q.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-secondary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{q.title}</span>
                    {q.isResolved && <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Đã giải đáp</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.user?.fullName || "Ẩn danh"} &middot; {formatDate(q.createdAt)} &middot; {q._count?.answers ?? 0} câu trả lời
                  </p>
                </div>
                {expandedId === q.id ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
              </button>

              {expandedId === q.id && (
                <div className="border-t border-border px-4 py-3 space-y-3">
                  <p className="text-sm">{q.content}</p>
                  {answers[q.id]?.map((a) => (
                    <div key={a.id} className="ml-4 rounded-lg bg-secondary/30 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{a.user?.fullName}</span>
                        {a.user?.role === "INSTRUCTOR" || a.user?.role === "ADMIN" ? (
                          <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">Giảng viên</span>
                        ) : null}
                        <span>&middot; {formatDate(a.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{a.content}</p>
                    </div>
                  ))}
                  {session?.user && isEnrolled && (
                    <div className="flex gap-2">
                      <Input value={replyingTo === q.id ? replyText : ""} onChange={(e) => { setReplyingTo(q.id); setReplyText(e.target.value); }} placeholder="Viết câu trả lời..." className="text-sm" />
                      <Button size="sm" onClick={() => postReply(q.id)} disabled={!replyText.trim()}><Send className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}