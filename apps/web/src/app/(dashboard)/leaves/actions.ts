'use server';

import { prisma } from '@team-connect/database';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const leaveSchema = z.object({
  employeeId: z.string().min(1, 'Pilih pegawai'),
  type: z.string().min(1, 'Pilih jenis izin'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal akhir wajib diisi'),
  reason: z.string().optional(),
});

export async function createLeaveRequest(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const parsed = leaveSchema.safeParse({
      employeeId: formData.get('employeeId'),
      type: formData.get('type'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      reason: formData.get('reason'),
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);

    if (end < start) {
      return { error: 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.' };
    }

    await prisma.leaveRequest.create({
      data: {
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
        employeeId: parsed.data.employeeId,
        type: parsed.data.type,
        startDate: start,
        endDate: end,
        reason: parsed.data.reason,
        status: 'APPROVED', // Karena diinput langsung oleh HRD
      }
    });

    revalidatePath('/leaves');
    return { success: true, message: 'Data cuti/izin berhasil ditambahkan!' };
  } catch (error) {
    console.error('Create Leave Error:', error);
    return { error: 'Gagal menyimpan data cuti.' };
  }
}

export async function deleteLeaveRequest(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await prisma.leaveRequest.delete({
      where: { id, propertyId: session.user.propertyId }
    });
    
    revalidatePath('/leaves');
    return { success: true };
  } catch (error) {
    return { error: 'Gagal menghapus data cuti.' };
  }
}