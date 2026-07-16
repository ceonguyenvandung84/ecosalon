import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import type { QuestionType } from "@/lib/enums";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

function buildQuizPrompt(lessonTitle: string, lessonContent: string, questionCount: number, types: string[]) {
  const typeDescriptions: Record<string, string> = {
    MULTIPLE_CHOICE: "Câu hỏi trắc nghiệm với 4 lựa chọn (A, B, C, D)",
    TRUE_FALSE: "Câu hỏi đúng/sai",
    FILL_IN: "Câu hỏi điền vào chỗ trống",
    MATCHING: "Câu hỏi nối cặp giữa 2 danh sách",
    ORDERING: "Câu hỏi sắp xếp thứ tự đúng",
  };

  const typeList = types.map((t) => `- ${typeDescriptions[t] || t}`).join("\n");

  return `Bạn là giáo viên chuyên nghiệp. Dựa trên nội dung bài học sau, hãy tạo ${questionCount} câu hỏi quiz đa dạng.

BÀI HỌC: ${lessonTitle}
NỘI DUNG: ${lessonContent.substring(0, 3000)}

YÊU CẦU:
- Tạo đúng ${questionCount} câu hỏi
- Các loại câu hỏi bao gồm:\n${typeList}
- Mỗi câu hỏi phải có đáp án đúng rõ ràng
- Câu hỏi phải kiểm tra HIỂU và VẬN DỤNG, không chỉ nhớ thuần túy

Định dạng trả lời (JSON array):
[
  {
    "type": "MULTIPLE_CHOICE",
    "text": "Câu hỏi?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctAnswer": "A",
    "explanation": "Giải thích đáp án"
  },
  {
    "type": "TRUE_FALSE",
    "text": "Mệnh đề đúng/sai",
    "correctAnswer": "TRUE",
    "explanation": "Giải thích"
  },
  {
    "type": "FILL_IN",
    "text": "Câu với ___ là từ cần điền",
    "correctAnswer": "từ cần điền",
    "explanation": "Giải thích"
  },
  {
    "type": "MATCHING",
    "text": "Nối các cặp đúng",
    "matchedPairs": [
      { "left": "Mục 1", "right": "Định nghĩa 1" },
      { "left": "Mục 2", "right": "Định nghĩa 2" }
    ],
    "explanation": "Cách nối đúng"
  },
  {
    "type": "ORDERING",
    "text": "Sắp xếp thứ tự đúng",
    "correctOrder": ["Bước 1", "Bước 2", "Bước 3"],
    "explanation": "Thứ tự đúng"
  }
]`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NVIDIA API key chưa được cấu hình" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { questionCount = 5, types = ["MULTIPLE_CHOICE", "TRUE_FALSE"] } = body;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            course: { select: { title: true } },
          },
        },
      },
    });

    if (!quiz) return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });

    const lessonContent = `Khóa học: ${quiz.lesson.course.title}\nBài học: ${quiz.lesson.title}`;
    const prompt = buildQuizPrompt(quiz.lesson.title, lessonContent, questionCount, types);

    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-ai/deepseek-v3-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[NVIDIA API error]", response.status, errorText);
      return NextResponse.json({ error: "Lỗi AI API" }, { status: 502 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({ error: "Không nhận được phản hồi từ AI" }, { status: 502 });
    }

    let parsedQuestions: Record<string, unknown>[] = [];
    try {
      const jsonMatch = rawContent.match(/```json\n?([\s\S]*?)\n?```/) || rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawContent;
      const parsed = JSON.parse(jsonStr);
      parsedQuestions = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || [];
    } catch {
      return NextResponse.json({ error: "Không parse được dữ liệu AI" }, { status: 502 });
    }

    const created = [];
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i] as Record<string, unknown>;
      const question = await prisma.question.create({
        data: {
          quizId,
          type: (q.type as QuestionType) || "MULTIPLE_CHOICE",
          text: q.text as string,
          options: q.options ? JSON.stringify(q.options) : undefined,
          correctAnswer: q.correctAnswer ? (q.correctAnswer as string) : undefined,
          matchedPairs: q.matchedPairs ? JSON.stringify(q.matchedPairs) : undefined,
          correctOrder: q.correctOrder ? JSON.stringify(q.correctOrder) : undefined,
          explanation: q.explanation ? (q.explanation as string) : undefined,
          order: i,
          points: 1,
        },
      });
      created.push(question);
    }

    return NextResponse.json({ questions: created, count: created.length });
  } catch (err) {
    console.error("[POST /api/quiz/[id]/generate]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}