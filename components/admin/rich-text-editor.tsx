"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Toggle
      pressed={active}
      onPressedChange={onClick}
      title={title}
      size="sm"
      className={cn("h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground", active && "bg-primary text-primary-foreground")}
    >
      {children}
    </Toggle>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const addLink = () => {
    const url = window.prompt("Nhập URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Nhập URL ảnh:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-muted/50">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Đậm">
        <span className="text-xs font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Nghiêng">
        <span className="text-xs italic">I</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Gạch chân">
        <span className="text-xs underline">U</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Gạch ngang">
        <span className="text-xs line-through">S</span>
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Tiêu đề 2">
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Tiêu đề 3">
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Danh sách">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Danh sách số">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" strokeWidth="1.5" /><path d="M4 10h2" strokeWidth="1.5" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeWidth="1.5" /></svg>
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Trích dẫn">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" fill="currentColor" strokeWidth="0" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor" strokeWidth="0" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Thêm liên kết">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Thêm ảnh">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Căn trái">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Căn giữa">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></svg>
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Làm lại">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder: placeholder || "Nhập nội dung..." }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
        .tiptap h3 { font-size: 1.25rem; font-weight: bold; margin-top: 0.75rem; margin-bottom: 0.5rem; }
        .tiptap p { margin-bottom: 0.5rem; }
        .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin-bottom: 0.5rem; }
        .tiptap blockquote { border-left: 3px solid #ccc; padding-left: 1rem; margin-left: 0; color: #666; }
        .tiptap pre { background: #f4f4f4; padding: 0.5rem; border-radius: 0.25rem; overflow-x: auto; }
        .tiptap code { background: #f4f4f4; padding: 0.125rem 0.25rem; border-radius: 0.125rem; }
        .tiptap img { max-width: 100%; height: auto; }
        .tiptap a { color: #3b82f6; text-decoration: underline; }
      `}</style>
    </div>
  );
}