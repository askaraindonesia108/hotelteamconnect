'use server';

import { prisma } from '@team-connect/database';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// Validasi input menggunakan Zod
const departmentSchema = z.object({
  name: z.string().min(2, 'Nama departemen minimal 2 karakter'),
  code: z.string().optional(),
});

export async function createDepartment(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Anda tidak memiliki akses.' };
    }

    const parsed = departmentSchema.safeParse({
      name: formData.get('name'),
      code: formData.get('code'),
    });

    if (!parsed.success) {
      // Perbaikan TypeScript Zod: menggunakan .issues
      return { error: parsed.error.issues[0].message };
    }

    await prisma.department.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
      },
    });

    revalidatePath('/departments');
    return { success: true, message: 'Departemen berhasil ditambahkan!' };
  } catch (error) {
    console.error('Create Department Error:', error);
    return { error: 'Gagal menyimpan departemen ke database.' };
  }
}

export async function deleteDepartment(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const employeeCount = await prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeeCount > 0) {
      return { error: 'Tidak dapat menghapus departemen yang masih memiliki pegawai.' };
    }

    await prisma.department.delete({
      where: { 
        id,
        propertyId: session.user.propertyId 
      },
    });

    revalidatePath('/departments');
    return { success: true };
  } catch (error) {
    console.error('Delete Department Error:', error);
    return { error: 'Gagal menghapus departemen.' };
  }
}