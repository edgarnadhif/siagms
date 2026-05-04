import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  try {
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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const insight = parseJsonResponse(text);

    return NextResponse.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error("Gemini AI error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mendapatkan analisis AI",
      },
      { status: 500 },
    );
  }
}
