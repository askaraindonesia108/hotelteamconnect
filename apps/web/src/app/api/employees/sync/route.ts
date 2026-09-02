import { NextResponse } from 'next/server';
import { prisma } from '@team-connect/database';

const SYNC_SECRET = 'AskaraSync2026Secure';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${SYNC_SECRET}`) {
      return NextResponse.json({ error: 'Akses Ditolak: Kunci API tidak valid.' }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, organizationId, employees } = body;

    if (!propertyId || !organizationId || !Array.isArray(employees)) {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    // 1. Siapkan Default Master Data (Agar Foreign Key tidak error saat insert)
    let dept = await prisma.department.findFirst({ where: { propertyId } });
    if (!dept) dept = await prisma.department.create({ data: { name: 'Umum', organizationId, propertyId } });

    let pos = await prisma.position.findFirst({ where: { propertyId } });
    if (!pos) pos = await prisma.position.create({ data: { name: 'Staff', organizationId, propertyId } });

    let status = await prisma.employmentStatus.findFirst({ where: { propertyId } });
    if (!status) status = await prisma.employmentStatus.create({ data: { name: 'Tetap', organizationId, propertyId } });

    let newCount = 0;
    let skipCount = 0;

    // 2. Loop dan Masukkan Data Pegawai
    for (const emp of employees) {
      // Pastikan pin terbaca sebagai string, hindari data kosong
      const pinMesin = String(emp.pin || '').trim();
      if (!pinMesin) continue;

      // Cek apakah pegawai dengan PIN ini sudah ada
      const existing = await prisma.employee.findFirst({
        where: { propertyId, machinePin: pinMesin }
      });

      if (!existing) {
        await prisma.employee.create({
          data: {
            organizationId,
            propertyId,
            machinePin: pinMesin,
            nip: pinMesin, // Default NIP disamakan dengan PIN mesin
            name: emp.name || `User ${pinMesin}`, // Jika nama kosong, beri nama default
            departmentId: dept.id,
            positionId: pos.id,
            employmentStatusId: status.id,
            joinDate: new Date(),
            isActive: true
          }
        });
        newCount++;
      } else {
        skipCount++; // Dilewati agar tidak dobel
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Selesai. ${newCount} pegawai baru ditambahkan, ${skipCount} dilewati (sudah ada).`,
      inserted: newCount
    });

  } catch (error: any) {
    console.error('API SYNC EMPLOYEE ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}