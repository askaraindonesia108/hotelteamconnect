import { NextResponse } from 'next/server';
import { prisma } from '@team-connect/database';

// Kunci rahasia statis untuk mengamankan jalur ini (Bisa diganti nanti)
const SYNC_SECRET = 'AskaraSync2026Secure';

export async function POST(req: Request) {
  try {
    // 1. Verifikasi Kunci Keamanan
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${SYNC_SECRET}`) {
      return NextResponse.json({ error: 'Akses Ditolak: Kunci API tidak valid.' }, { status: 401 });
    }

    // 2. Ekstrak Paket Data dari Agen Lokal
    const body = await req.json();
    const { propertyId, organizationId, logs } = body;

    if (!propertyId || !organizationId || !Array.isArray(logs)) {
      return NextResponse.json({ error: 'Format data tidak valid atau ada ID yang kurang.' }, { status: 400 });
    }

    // 3. Rakit Format Data untuk Database
    const dataToInsert = logs.map((log: any) => ({
      organizationId,
      propertyId,
      sourceType: 'MACHINE_LAN',
      // Menggabungkan PIN dan Waktu sebagai ID unik mutlak dari mesin
      sourceRecordId: `${log.pin}-${new Date(log.timestamp).getTime()}`, 
      employeePin: String(log.pin),
      scannedAtUtc: new Date(log.timestamp),
      deviceId: log.ip || 'Local_Machine',
    }));

    // 4. Suntikkan ke Database (Otomatis Abaikan Duplikat)
    const result = await prisma.rawScan.createMany({
      data: dataToInsert,
      skipDuplicates: true, // Kunci utama agar absen tidak dobel
    });

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menerima ${logs.length} baris log mentah. Data baru yang tersimpan: ${result.count} baris.`,
      inserted: result.count
    });

  } catch (error: any) {
    console.error('API SINKRONISASI ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}