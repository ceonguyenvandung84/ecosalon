"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import type { CourseQuestionItem, CourseAnswerItem } from "@/lib/types";

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<CourseQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, CourseAnswerItem[]>>({});
  const [replyText, setReplyText] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/course-questions")
      .then((r) => r.json())
      .then((d) => setItems(d?.questions ?? []))
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, setLoading]);

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
      toast.success("Đã trả lời");
      setReplyText("");
      const res2 = await fetch(`/api/courses/questions/${questionId}/answers`);
      const d2 = await res2.json();
      setAnswers((prev) => ({ ...prev, [questionId]: d2?.question?.answers ?? [] }));
    } catch { toast.error("Lỗi server"); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Câu hỏi & Đáp</h1><p className="text-muted-foreground">{items.length} câu hỏi từ tất cả khóa học</p></div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground rounded-xl border border-dashed">
            <MessageSquare className="mb-3 h-10 w-10" />
            <p>Chưa có câu hỏi nào</p>
          </div>
        ) : (
          items.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button onClick={() => toggleExpand(q.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-secondary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{q.title}</span>
                    {(q._count?.answers ?? 0) > 0 && <Badge variant="secondary" className="text-xs">{q._count?.answers} trả lời</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.user?.fullName || "Ẩn danh"} &middot;{" "}
                    <Link href={`/admin/khoa-hoc/${q.course.id}`} className="hover:underline">{q.course.title}</Link>
                  </p>
                </div>
                <Link href={`/khoa-hoc/${q.course.slug}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              </button>

              {expandedId === q.id && (
                <div className="border-t border-border px-4 py-3 space-y-3">
                  <p className="text-sm">{q.content}</p>
                  {answers[q.id]?.map((a) => (
                    <div key={a.id} className="ml-4 rounded-lg bg-secondary/30 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{a.user?.fullName}</span>
                        {(a.user?.role === "INSTRUCTOR" || a.user?.role === "ADMIN") && (
                          <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">Quản trị</span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{a.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Viết câu trả lời với danh nghĩa quản trị..."
                      rows={2}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={() => postReply(q.id)} disabled={!replyText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
