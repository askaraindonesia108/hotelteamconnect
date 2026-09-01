'use server';

import { prisma } from '@team-connect/database';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const shiftSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  code: z.string().min(1, 'Kode wajib diisi'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam awal tidak valid (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam akhir tidak valid (HH:mm)'),
  isNightShift: z.boolean(),
  gracePeriodMin: z.coerce.number().min(0, 'Toleransi minimal 0 menit'),
});

export async function createShift(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const parsed = shiftSchema.safeParse({
      name: formData.get('name'),
      code: formData.get('code'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      isNightShift: formData.get('isNightShift') === 'on', // Checkbox handling
      gracePeriodMin: formData.get('gracePeriodMin'),
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    await prisma.shift.create({
      data: {
        ...parsed.data,
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
      },
    });

    revalidatePath('/schedules');
    return { success: true, message: 'Shift berhasil ditambahkan!' };
  } catch (error) {
    return { error: 'Gagal menyimpan shift ke database.' };
  }
}

export async function deleteShift(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await prisma.shift.delete({
      where: { id, propertyId: session.user.propertyId },
    });
    revalidatePath('/schedules');
    return { success: true };
  } catch (error) {
    return { error: 'Gagal menghapus shift.' };
  }
}