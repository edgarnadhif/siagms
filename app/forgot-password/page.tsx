import Link from "next/link";
import { prisma } from "@/lib/db";

function toWhatsAppNumber(rawPhone: string | null | undefined) {
  if (!rawPhone) return "";

  const digitsOnly = rawPhone.replace(/\D/g, "");
  if (!digitsOnly) return "";

  if (digitsOnly.startsWith("62")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return `62${digitsOnly.slice(1)}`;
  return digitsOnly;
}

export default async function ForgotPasswordPage() {
  const profile = await prisma.companyProfile.findFirst({
    select: { phone: true },
    orderBy: { updatedAt: "desc" },
  });

  const whatsappNumber = toWhatsAppNumber(profile?.phone);
  const hasWhatsappNumber = Boolean(whatsappNumber);
  const message = encodeURIComponent(
    "Halo Admin, saya lupa password akun saya. Mohon bantuannya untuk reset password.",
  );
  const whatsappLink = hasWhatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${message}`
    : "#";

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Title Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-black">Lupa password ?</h1>
          <p className="text-sm text-gray-500">
            Silakan hubungi administrator untuk melakukan reset password
          </p>
        </div>

        {/* Action Button */}
        <div>
          <a
            href={whatsappLink}
            target={hasWhatsappNumber ? "_blank" : undefined}
            rel={hasWhatsappNumber ? "noopener noreferrer" : undefined}
            aria-disabled={!hasWhatsappNumber}
            className={`block w-full py-3 px-4 font-medium rounded-2xl transition-colors duration-200 ${
              hasWhatsappNumber
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            Hubungi admin
          </a>
          {!hasWhatsappNumber && (
            <p className="mt-2 text-xs text-gray-400">
              Nomor WhatsApp admin belum diatur di Profil Perusahaan.
            </p>
          )}
        </div>

        {/* Back Link */}
        <div>
          <Link
            href="/login"
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  );
}
