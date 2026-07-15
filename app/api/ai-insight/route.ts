import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
  getErrorStatus as getAuthErrorStatus,
  requireAuth,
} from "@/lib/auth";

type FinancialData = {
  projectName?: string;
  kasDiterima?: number;
  pendapatanDiakui?: number;
  totalBeban?: number;
  labaBersih?: number;
  bebanKonstruksi?: number;
  bebanMarketing?: number;
  bebanGaji?: number;
  bebanOperasional?: number;
  unitTersedia?: number;
  unitTerjual?: number;
  unitSerahTerima?: number;
  piutangKPR?: number;
  totalAset?: number;
  neracaStatus?: string;
};

function rupiah(value: number | undefined) {
  return Number(value ?? 0).toLocaleString("id-ID");
}

function parseJsonResponse(text: string) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Gemini response is not valid JSON");
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;

    if (typeof status === "number") {
      return status;
    }
  }

  return undefined;
}

function isRetryableGeminiError(error: unknown) {
  const status = getErrorStatus(error);

  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    message.includes("high demand") ||
    message.includes("service unavailable") ||
    message.includes("fetch failed")
  );
}

function getGeminiModels() {
  return Array.from(
    new Set([
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ].filter(Boolean)),
  ) as string[];
}

async function generateContentWithFallback(genAI: GoogleGenerativeAI, prompt: string) {
  const models = getGeminiModels();
  let lastError: unknown;

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await model.generateContent(prompt);
      } catch (error) {
        lastError = error;

        if (!isRetryableGeminiError(error) || attempt === 2) {
          break;
        }

        await wait(600 * 2 ** attempt);
      }
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  try {
    await requireAuth(["ADMIN", "AKUNTAN"]);
    const { financialData } = (await req.json()) as {
      financialData?: FinancialData;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "GEMINI_API_KEY belum dikonfigurasi",
        },
        { status: 500 },
      );
    }

    if (!financialData) {
      return NextResponse.json(
        {
          success: false,
          message: "Data keuangan tidak valid",
        },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `
Kamu adalah asisten keuangan profesional untuk
perusahaan developer perumahan di Indonesia.

Analisis data keuangan berikut dan berikan insight
yang ringkas, jelas, dan mudah dipahami oleh
manajemen yang tidak berlatar belakang akuntansi.

DATA KEUANGAN:
- Nama Proyek    : ${financialData.projectName ?? "Semua Proyek"}
- Kas Diterima   : Rp ${rupiah(financialData.kasDiterima)}
- Pendapatan Diakui : Rp ${rupiah(financialData.pendapatanDiakui)}
- Total Beban    : Rp ${rupiah(financialData.totalBeban)}
- Laba Bersih    : Rp ${rupiah(financialData.labaBersih)}
- Beban Konstruksi  : Rp ${rupiah(financialData.bebanKonstruksi)}
- Beban Marketing   : Rp ${rupiah(financialData.bebanMarketing)}
- Beban Gaji        : Rp ${rupiah(financialData.bebanGaji)}
- Beban Operasional : Rp ${rupiah(financialData.bebanOperasional)}
- Unit Tersedia  : ${Number(financialData.unitTersedia ?? 0)} unit
- Unit Terjual   : ${Number(financialData.unitTerjual ?? 0)} unit
- Unit Serah Terima : ${Number(financialData.unitSerahTerima ?? 0)} unit
- Piutang KPR    : Rp ${rupiah(financialData.piutangKPR)}
- Total Aset     : Rp ${rupiah(financialData.totalAset)}
- Status Neraca  : ${financialData.neracaStatus ?? "TIDAK BALANCED"}

Berikan analisis HANYA dalam format JSON berikut,
tanpa teks tambahan, tanpa markdown, tanpa backtick:
{
  "ringkasan": "ringkasan kondisi keuangan dalam 2-3 kalimat yang jelas",
  "perhatian": [
    "hal yang perlu diperhatikan manajemen 1",
    "hal yang perlu diperhatikan manajemen 2"
  ],
  "positif": [
    "hal positif dari kondisi keuangan 1",
    "hal positif dari kondisi keuangan 2"
  ],
  "saran": [
    "saran strategis untuk manajemen 1",
    "saran strategis untuk manajemen 2"
  ]
}
`;

    const result = await generateContentWithFallback(genAI, prompt);
    const text = result.response.text();
    const insight = parseJsonResponse(text);

    return NextResponse.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error("Gemini AI error:", error);

    if (isRetryableGeminiError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Layanan AI sedang sibuk. Coba analisis ulang beberapa saat lagi.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mendapatkan analisis AI",
      },
      { status: getAuthErrorStatus(error) },
    );
  }
}
