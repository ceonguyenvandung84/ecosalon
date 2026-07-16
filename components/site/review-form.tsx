"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewFormProps {
  courseId?: string;
  productId?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ courseId, productId, onSuccess }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!session) { toast.error("Vui lòng đăng nhập để đánh giá"); return; }
    if (rating < 1) { toast.error("Vui lòng chọn số sao"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, courseId, productId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã gửi đánh giá");
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch {
      toast.error("Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <h3 className="mb-3 font-semibold">Đánh giá của bạn</h3>
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="transition">
            <Star className={cn("h-5 w-5", (hover || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn..." rows={3} className="mb-3" />
      <Button onClick={submit} disabled={submitting || rating < 1} size="sm">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gửi đánh giá
      </Button>
    </div>
  );
}