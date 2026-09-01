'use server';

import { prisma } from '@team-connect/database';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// node-zklib tidak memiliki deklarasi TypeScript resmi, kita gunakan require
const ZKLib = require('node-zklib');

export async function syncMachineData(ipAddress: string, portStr: string = '4370') {
  let zkInstance = null;
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const port = parseInt(portStr);
    
    // 1. Buat instance koneksi TCP ke mesin
    zkInstance = new ZKLib(ipAddress, port, 10000, 4000); 
    
    // 2. Lakukan jabat tangan (Handshake)
    await zkInstance.createSocket();

    // 3. Tarik seluruh data log absensi yang tersimpan di mesin
    const logs = await zkInstance.getAttendances();
    
    if (!logs.data || logs.data.length === 0) {
      await zkInstance.disconnect();
      return { error: 'Koneksi berhasil, tetapi tidak ada data log di mesin tersebut.' };
    }

    const { organizationId, propertyId } = session.user;

    // 4. Catat pekerjaan ini sebagai ImportJob
    const importJob = await prisma.importJob.create({
      data: {
        organizationId,
        propertyId,
        sourceType: 'TCP_IP_SYNC',
        status: 'RUNNING',
      },
    });

    let validCount = 0;
    const rawScansToInsert: any[] = [];

    // 5. Transformasi data mesin ke format database kita
    // Format logs.data biasanya: { deviceUserId: '1', recordTime: '2026-09-01 07:45:00' }
    for (const record of logs.data) {
      const pin = record.deviceUserId?.toString().trim();
      const datetimeStr = record.recordTime?.toString().trim();

      if (!pin || !datetimeStr) continue;

      // Anggap waktu dari mesin adalah WIB (GMT+7)
      const scannedAtUtc = new Date(`${datetimeStr} GMT+0700`);
      if (isNaN(scannedAtUtc.getTime())) continue;

      // Kunci unik pencegah duplikat absolut
      const sourceRecordId = `${pin}_${datetimeStr}`;

      rawScansToInsert.push({
        organizationId,
        propertyId,
        sourceType: 'TCP_IP_MACHINE',
        sourceRecordId,
        employeePin: pin,
        scannedAtUtc,
        rawMetadata: record, // Simpan payload asli ZKLib untuk audit
      });

      validCount++;
    }

    // 6. Masukkan secara massal dengan proteksi duplikat bawaan PostgreSQL
    if (rawScansToInsert.length > 0) {
      await prisma.rawScan.createMany({
        data: rawScansToInsert,
        skipDuplicates: true,
      });
    }

    // 7. Selesaikan Job
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: 'SUCCEEDED',
        totalRead: logs.data.length,
        totalValid: validCount,
        finishedAt: new Date(),
      },
    });

    await zkInstance.disconnect();
    revalidatePath('/raw-scans');
    revalidatePath('/reports');
    
    return { success: true, message: `Sinkronisasi selesai! Berhasil memindai ${validCount} log dari mesin.` };

  } catch (error: any) {
    console.error('Mesin ZKLib Error:', error);
    if (zkInstance) {
      try { await zkInstance.disconnect(); } catch (e) {}
    }
    return { error: 'Gagal terhubung ke mesin. Pastikan IP valid dan mesin berada di jaringan yang sama (LAN).' };
  }
}