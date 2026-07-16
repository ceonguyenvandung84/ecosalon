"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AvatarUpload({ value, onUploaded, name }: { value?: string | null; onUploaded: (path: string) => void; name?: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Sync preview with external value (e.g., after parent saves and updates the prop)
  useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value, setPreview]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/local", { method: "POST", body: formData });
      const d = await res.json().catch(() => ({}));
      if (!d?.url) { toast.error(d?.error ?? "Không thể tải lên"); setUploading(false); return; }
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); }
      const blobUrl = URL.createObjectURL(file);
      blobUrlRef.current = blobUrl;
      setPreview(blobUrl);
      onUploaded(d.url);
      toast.success("Đã tải ảnh lên");
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setUploading(false); }
  };

  return (
    <div className="relative h-24 w-24">
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
        {preview ? <Image src={preview} alt={name ?? "Avatar"} fill className="object-cover" sizes="128px" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">{(name ?? "?").charAt(0).toUpperCase()}</div>}
      </div>
      <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={uploading} />
      </label>
    </div>
  );
}
