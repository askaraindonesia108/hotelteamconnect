'use server';

import { prisma } from '@team-connect/database';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import Papa from 'papaparse';

// ==========================================
// 1. FUNGSI IMPORT RAW SCAN (Log Absensi)
// ==========================================
export async function processCsvImport(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const file = formData.get('file') as File;
    const mappingStr = formData.get('mapping') as string;
    
    if (!file || !mappingStr) return { error: 'File atau mapping tidak valid' };

    const mapping = JSON.parse(mappingStr);
    const pinCol = mapping.pin;
    const datetimeCol = mapping.datetime;

    if (!pinCol || !datetimeCol) {
      return { error: 'Anda harus memetakan kolom PIN dan Waktu Scan.' };
    }

    const importJob = await prisma.importJob.create({
      data: {
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
        sourceType: 'CSV_SCAN',
        status: 'RUNNING',
      },
    });

    const fileText = await file.text();
    const parsed = Papa.parse<any>(fileText, { header: true, skipEmptyLines: true });

    let validCount = 0;
    let invalidCount = 0;
    const rawScansToInsert: any[] = [];

    for (const row of parsed.data) {
      const pin = row[pinCol]?.toString().trim();
      const datetimeStr = row[datetimeCol]?.toString().trim();

      if (!pin || !datetimeStr) {
        invalidCount++;
        continue;
      }

      const scannedAtUtc = new Date(`${datetimeStr} GMT+0700`);
      if (isNaN(scannedAtUtc.getTime())) {
        invalidCount++;
        continue;
      }

      const sourceRecordId = `${pin}_${datetimeStr}`;

      rawScansToInsert.push({
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
        sourceType: 'CSV',
        sourceRecordId,
        employeePin: pin,
        scannedAtUtc,
        rawMetadata: row,
      });

      validCount++;
    }

    if (rawScansToInsert.length > 0) {
      await prisma.rawScan.createMany({
        data: rawScansToInsert,
        skipDuplicates: true,
      });
    }
    
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: 'SUCCEEDED',
        totalRead: parsed.data.length,
        totalValid: validCount,
        totalInvalid: invalidCount,
        finishedAt: new Date(),
      },
    });

    revalidatePath('/import');
    return { success: true, message: `Berhasil mengimpor ${validCount} log absen.` };

  } catch (error) {
    console.error('CSV Scan Import Error:', error);
    return { error: 'Terjadi kesalahan sistem saat memproses impor log.' };
  }
}

// ==========================================
// 2. FUNGSI IMPORT MASTER PEGAWAI
// ==========================================
export async function processEmployeeImport(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const { organizationId, propertyId } = session.user;

    const file = formData.get('file') as File;
    const mappingStr = formData.get('mapping') as string;
    
    if (!file || !mappingStr) return { error: 'File atau mapping tidak valid' };

    const mapping = JSON.parse(mappingStr);
    
    // Validasi kolom wajib
    if (!mapping.pin || !mapping.nip || !mapping.name || !mapping.department || !mapping.position) {
      return { error: 'Semua kolom wajib (PIN, NIP, Nama, Departemen, Jabatan) harus dipetakan.' };
    }

    const fileText = await file.text();
    const parsed = Papa.parse<any>(fileText, { header: true, skipEmptyLines: true });

    let validCount = 0;
    
    // Siapkan default status jika kosong
    let defaultStatus = await prisma.employmentStatus.findFirst({ where: { propertyId } });
    if (!defaultStatus) {
      defaultStatus = await prisma.employmentStatus.create({
        data: { name: 'Tetap', organizationId, propertyId }
      });
    }

    // Cache untuk menghindari query berulang ke database
    const deptCache = new Map<string, string>();
    const posCache = new Map<string, string>();

    // Ambil data yang sudah ada ke memory
    const existingDepts = await prisma.department.findMany({ where: { propertyId } });
    existingDepts.forEach(d => deptCache.set(d.name.toLowerCase(), d.id));

    const existingPos = await prisma.position.findMany({ where: { propertyId } });
    existingPos.forEach(p => posCache.set(p.name.toLowerCase(), p.id));

    for (const row of parsed.data) {
      const pin = row[mapping.pin]?.toString().trim();
      const nip = row[mapping.nip]?.toString().trim();
      const name = row[mapping.name]?.toString().trim();
      const deptName = row[mapping.department]?.toString().trim();
      const posName = row[mapping.position]?.toString().trim();

      if (!pin || !nip || !name || !deptName || !posName) continue;

      // 1. Dapatkan atau Buat Departemen
      let deptId = deptCache.get(deptName.toLowerCase());
      if (!deptId) {
        const newDept = await prisma.department.create({
          data: { name: deptName, organizationId, propertyId }
        });
        deptId = newDept.id;
        deptCache.set(deptName.toLowerCase(), deptId);
      }

      // 2. Dapatkan atau Buat Jabatan
      let posId = posCache.get(posName.toLowerCase());
      if (!posId) {
        const newPos = await prisma.position.create({
          data: { name: posName, organizationId, propertyId }
        });
        posId = newPos.id;
        posCache.set(posName.toLowerCase(), posId);
      }

      // 3. Upsert Pegawai (Jika NIP sudah ada, update namanya/jabatannya. Jika belum, buat baru)
      await prisma.employee.upsert({
        where: {
          id: (await prisma.employee.findFirst({ where: { propertyId, nip } }))?.id || 'new-record-trigger',
        },
        update: {
          machinePin: pin,
          name,
          departmentId: deptId,
          positionId: posId,
        },
        create: {
          nip,
          machinePin: pin,
          name,
          departmentId: deptId,
          positionId: posId,
          employmentStatusId: defaultStatus.id,
          joinDate: new Date(), // Default hari ini jika kolom tanggal tidak diimpor
          organizationId,
          propertyId,
        }
      });

      validCount++;
    }

    revalidatePath('/employees');
    revalidatePath('/departments');
    revalidatePath('/positions');
    
    return { success: true, message: `Berhasil migrasi ${validCount} data pegawai berserta strukturnya.` };

  } catch (error) {
    console.error('Employee Import Error:', error);
    return { error: 'Gagal memproses migrasi data pegawai.' };
  }
}