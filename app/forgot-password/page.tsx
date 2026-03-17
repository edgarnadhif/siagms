import Link from 'next/link'

export default function ForgotPasswordPage() {
  // Replace with the actual WhatsApp number
  const whatsappNumber = "6281234567890" 
  const message = encodeURIComponent("Halo Admin, saya lupa password akun saya. Mohon bantuannya untuk reset password.")
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`

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
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl transition-colors duration-200"
          >
            Hubungi admin
          </a>
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
  )
}
