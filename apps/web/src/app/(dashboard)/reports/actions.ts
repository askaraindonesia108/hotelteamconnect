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
    
    const targetDate = parseISO(dateStr);
    const startLocal = startOfDay(targetDate);
    const endLocal = endOfDay(targetDate);

    // Format tanggal absolut untuk database
    const recordDate = new Date(`${dateStr}T00:00:00.000Z`);

    const employees = await prisma.employee.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, machinePin: true }
    });

    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0; // Tambahan metrik baru

    for (const emp of employees) {
      if (!emp.machinePin) {
        absentCount++;
        continue;
      }

      // 1. Cek log mesin absensi
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
      let notes = null;

      if (scans.length > 0) {
        status = 'PRESENT';
        checkIn = scans[0].scannedAtUtc; 
        checkOut = scans[scans.length - 1].scannedAtUtc; 
        presentCount++;
      } else {
        // 2. SINERGI CUTI: Jika tidak ada absen mesin, cek tabel cuti/izin
        const leave = await prisma.leaveRequest.findFirst({
          where: {
            employeeId: emp.id,
            startDate: { lte: recordDate },
            endDate: { gte: recordDate },
            status: 'APPROVED'
          }
        });

        if (leave) {
          status = leave.type; // Timpa dengan SICK, ANNUAL, PERMISSION, dll
          notes = leave.reason;
          leaveCount++;
        } else {
          absentCount++;
        }
      }

      await prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: { employeeId: emp.id, date: recordDate }
        },
        update: {
          checkIn,
          checkOut,
          status,
          notes, // Simpan keterangan cuti
          updatedAt: new Date()
        },
        create: {
          organizationId,
          propertyId,
          employeeId: emp.id,
          date: recordDate,
          checkIn,
          checkOut,
          status,
          notes
        }
      });
    }

    revalidatePath('/reports');
    return { 
      success: true, 
      message: `Kalkulasi Selesai: ${presentCount} Hadir, ${leaveCount} Izin/Cuti, ${absentCount} Alpa.` 
    };

  } catch (error) {
    console.error('Attendance Calculation Error:', error);
    return { error: 'Gagal melakukan kalkulasi absensi harian.' };
  }
}