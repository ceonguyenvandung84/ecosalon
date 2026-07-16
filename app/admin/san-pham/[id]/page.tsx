"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
import type { ProductForm, ProductDetailItem, CategoryAdminItem, BrandAdminItem } from "@/lib/types";

function ImageUpload({ onUploaded }: { onUploaded: (path: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }
    setUploading(true);
    try {
      const res = await fetch("/api/upload/presigned", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const d = await res.json().catch(() => ({}));
      if (!d?.uploadUrl) { toast.error("Không thể tải lên"); return; }
      const put = await fetch(d.uploadUrl, {
        method: "PUT", headers: { "Content-Type": file.type }, body: file,
      });
      if (!put.ok) { toast.error("Tải lên thất bại"); return; }
      onUploaded(d.cloud_storage_path);
      toast.success("Đã tải ảnh lên");
    } catch { toast.error("Đã có lỗi xảy ra"); }
    finally { setUploading(false); }
  };

  return (
    <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted hover:bg-secondary/50">
      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6 text-muted-foreground" />}
      <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={uploading} />
    </label>
  );
}

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductDetailItem | null>(null);
  const [cats, setCats] = useState<CategoryAdminItem[]>([]);
  const [brands, setBrands] = useState<BrandAdminItem[]>([]);
  const [form, setForm] = useState<ProductForm>({} as ProductForm);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()).then((d) => {
        const found = (d?.products ?? []).find((p: ProductDetailItem) => p.id === productId);
        if (found) setProduct(found);
      }),
      fetch("/api/categories?type=PRODUCT").then((r) => r.json()).then((d) => setCats(d?.categories ?? [])),
      fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(d?.brands ?? [])),
    ]).finally(() => setLoading(false));
  }, [productId, setLoading, setProduct, setCats, setBrands]);

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title ?? "",
        shortDesc: product.shortDesc ?? "",
        description: product.description ?? "",
        images: product.images ?? [],
        price: String(product.price ?? 0),
        discountPercent: String(product.discountPercent ?? 0),
        stock: String(product.stock ?? 0),
        sku: product.sku ?? "",
        categoryId: product.categoryId ?? "",
        brandId: product.brandId ?? "",
        isPublished: product.isPublished ?? true,
        isFeatured: product.isFeatured ?? false,
        metaTitle: product.metaTitle ?? "",
        metaDescription: product.metaDescription ?? "",
        ogImage: product.ogImage ?? "",
      });
      setSpecs([]);
    }
  }, [product, setForm]);

  const addSpec = () => setSpecs([...specs, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: "key" | "value", val: string) => {
    const next = [...specs];
    next[i]![field] = val;
    setSpecs(next);
  };

  const save = async () => {
    if (!form.title || !form.categoryId) { toast.error("Nhập tên và danh mục"); return; }
    setSaving(true);
    try {
      const specObj: Record<string, string> = {};
      specs.forEach((s) => { if (s.key.trim()) specObj[s.key.trim()] = s.value.trim(); });

      const payload = {
        ...form,
        price: form.price || "0",
        stock: form.stock || "0",
        discountPercent: form.discountPercent || "0",
        images: form.images ?? [],
        specifications: Object.keys(specObj).length > 0 ? specObj : null,
      };

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { toast.success("Đã cập nhật sản phẩm"); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Cập nhật thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); }
    finally { setSaving(false); }
  };

  const removeImage = (idx: number) => {
    setForm({ ...form, images: (form.images ?? []).filter((_: string, i: number) => i !== idx) });
  };

  const addImage = (path: string) => {
    setForm({ ...form, images: [...(form.images ?? []), path] });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!product) return <div className="p-6 text-center text-muted-foreground">Không tìm thấy sản phẩm</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/san-pham")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-2xl font-bold line-clamp-1">{product.title}</h1>
            <Badge variant={product.isPublished ? "default" : "secondary"}>{product.isPublished ? "Hiển thị" : "Ẩn"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Đã bán: {product.soldCount} · Kho: {product.stock}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên sản phẩm *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mô tả ngắn</Label>
                <Input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Thông số kỹ thuật</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Tên thông số"
                    value={s.key}
                    onChange={(e) => updateSpec(i, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Giá trị"
                    value={s.value}
                    onChange={(e) => updateSpec(i, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeSpec(i)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSpec} className="gap-1">
                <Plus className="h-4 w-4" /> Thêm thông số
              </Button>
              <p className="text-xs text-muted-foreground">Thông số sẽ hiển thị trên trang chi tiết sản phẩm.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Giá & Kho</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Giá (VND)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Giảm %</Label>
                <Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tồn kho</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Hình ảnh</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {(form.images ?? []).map((img: string, i: number) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image src={img} alt={`Ảnh ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 20vw" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={() => removeImage(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <ImageUpload onUploaded={addImage} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Click vào ô + để thêm ảnh (tối đa 5MB/ảnh).</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Phân loại</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Danh mục *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    {(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thương hiệu</Label>
                <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    {(brands ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mã SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="VD: SP001" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5"><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder="Tiêu đề SEO" /></div>
              <div className="space-y-1.5"><Label>Meta Description</Label><Textarea rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="Mô tả SEO" /></div>
              <div className="space-y-1.5"><Label>OG Image URL</Label><Input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} placeholder="Để trống để dùng ảnh đầu tiên" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Trạng thái</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                <Label>Hiển thị</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                <Label>Nổi bật</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
