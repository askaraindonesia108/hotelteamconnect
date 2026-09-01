'use server';

import { prisma } from '@team-connect/database';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const deviceSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  machineNumber: z.coerce.number().min(1, 'Nomor Mesin minimal 1'),
  ipAddress: z.string().optional(),
  serialNumber: z.string().optional(),
});

export async function createDevice(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const parsed = deviceSchema.safeParse({
      name: formData.get('name'),
      machineNumber: formData.get('machineNumber'),
      ipAddress: formData.get('ipAddress'),
      serialNumber: formData.get('serialNumber'),
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    await prisma.device.create({
      data: {
        ...parsed.data,
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
      },
    });

    revalidatePath('/devices');
    return { success: true, message: 'Mesin berhasil ditambahkan!' };
  } catch (error) {
    return { error: 'Gagal menyimpan mesin.' };
  }
}

export async function deleteDevice(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    await prisma.device.delete({ where: { id, propertyId: session.user.propertyId } });
    revalidatePath('/devices');
    return { success: true };
  } catch (error) {
    return { error: 'Gagal menghapus mesin.' };
  }
}