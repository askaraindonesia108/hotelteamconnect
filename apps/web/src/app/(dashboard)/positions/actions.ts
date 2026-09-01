'use server';

import { prisma } from '@team-connect/database';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const positionSchema = z.object({
  name: z.string().min(2, 'Nama jabatan minimal 2 karakter'),
});

export async function createPosition(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Anda tidak memiliki akses.' };
    }

    const parsed = positionSchema.safeParse({
      name: formData.get('name'),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    await prisma.position.create({
      data: {
        name: parsed.data.name,
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
      },
    });

    revalidatePath('/positions');
    return { success: true, message: 'Jabatan berhasil ditambahkan!' };
  } catch (error) {
    console.error('Create Position Error:', error);
    return { error: 'Gagal menyimpan jabatan ke database.' };
  }
}

export async function deletePosition(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    // Mencegah penghapusan jika masih ada pegawai di jabatan ini
    const employeeCount = await prisma.employee.count({
      where: { positionId: id },
    });

    if (employeeCount > 0) {
      return { error: 'Tidak dapat menghapus jabatan yang masih memiliki pegawai.' };
    }

    await prisma.position.delete({
      where: { 
        id,
        propertyId: session.user.propertyId 
      },
    });

    revalidatePath('/positions');
    return { success: true };
  } catch (error) {
    console.error('Delete Position Error:', error);
    return { error: 'Gagal menghapus jabatan.' };
  }
}