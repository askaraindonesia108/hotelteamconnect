import { prisma } from '@team-connect/database';

export default async function DashboardPage() {
  try {
    const userCount = await prisma.user.count();

    return (
      <div className="p-8 bg-green-50 rounded-2xl border border-green-200 shadow-sm">
        <h2 className="text-2xl font-bold text-green-700 mb-2">✅ Koneksi Database Berhasil!</h2>
        <p className="text-green-600 font-medium">Prisma sukses terhubung ke Vercel. Jumlah User: {userCount}</p>
        <p className="mt-4 text-sm text-green-700">Silakan hapus file ini dan ubah kembali nama page_asli.tsx menjadi page.tsx.</p>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
        <h2 className="text-2xl font-bold text-red-700 mb-4">🚨 Radar Vercel: Database Gagal Diakses</h2>
        <p className="text-red-800 font-medium mb-2">Pesan Error Asli dari Server:</p>
        <pre className="bg-white p-5 rounded-xl border border-red-200 text-sm font-mono text-red-600 overflow-auto whitespace-pre-wrap shadow-inner">
          {error?.message || String(error)}
        </pre>
        <p className="mt-6 text-sm text-slate-600 font-medium">Foto atau salin isi teks di dalam kotak putih ini dan beritahu saya!</p>
      </div>
    );
  }
}