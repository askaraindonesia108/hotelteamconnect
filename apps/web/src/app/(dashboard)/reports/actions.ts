'use server';

import { prisma } from '@team-connect/database';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function generateDailyAttendance(dateStr: string) {
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const { propertyId, organizationId } = session.user;
    
    // 1. Rentang waktu lokal untuk mencari Raw Scan (WIB)
    const targetDate = parseISO(dateStr);
    const startLocal = startOfDay(targetDate);
    const endLocal = endOfDay(targetDate);

    // 2. Format tanggal absolut UTC untuk Prisma @db.Date agar tidak bergeser hari
    const recordDate = new Date(`${dateStr}T00:00:00.000Z`);

    const employees = await prisma.employee.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, machinePin: true }
    });

    let presentCount = 0;
    let absentCount = 0;

    for (const emp of employees) {
      if (!emp.machinePin) {
        absentCount++;
        continue;
      }

      const scans = await prisma.rawScan.findMany({
        where: {
          propertyId,
          employeePin: emp.machinePin,
          scannedAtUtc: { gte: startLocal, lte: endLocal }
        },
        orderBy: { scannedAtUtc: 'asc' }
      });

      let status = 'ABSENT';
      let checkIn = null;
      let checkOut = null;

      if (scans.length > 0) {
        status = 'PRESENT';
        checkIn = scans[0].scannedAtUtc; 
        checkOut = scans[scans.length - 1].scannedAtUtc; 
        presentCount++;
      } else {
        absentCount++;
      }

      await prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: { employeeId: emp.id, date: recordDate }
        },
        update: {
          checkIn,
          checkOut,
          status,
          updatedAt: new Date()
        },
        create: {
          organizationId,
          propertyId,
          employeeId: emp.id,
          date: recordDate,
          checkIn,
          checkOut,
          status
        }
      });
    }

    revalidatePath('/reports');
    return { success: true, message: `Berhasil mengkalkulasi absensi: ${presentCount} Hadir, ${absentCount} Alpa/Libur.` };

  } catch (error) {
    console.error('Attendance Calculation Error:', error);
    return { error: 'Gagal melakukan kalkulasi absensi harian.' };
  }
}