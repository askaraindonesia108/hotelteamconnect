'use server';

import { prisma } from '@team-connect/database';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const employeeSchema = z.object({
  nip: z.string().min(1, 'NIP wajib diisi'),
  machinePin: z.string().optional(),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  departmentId: z.string().min(1, 'Pilih departemen'),
  positionId: z.string().min(1, 'Pilih jabatan'),
  employmentStatusId: z.string().min(1, 'Pilih status kepegawaian'),
  joinDate: z.string().min(1, 'Tanggal masuk wajib diisi'),
});

export async function createEmployee(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { error: 'Anda tidak memiliki akses.' };

    const parsed = employeeSchema.safeParse({
      nip: formData.get('nip'),
      machinePin: formData.get('machinePin'),
      name: formData.get('name'),
      departmentId: formData.get('departmentId'),
      positionId: formData.get('positionId'),
      employmentStatusId: formData.get('employmentStatusId'),
      joinDate: formData.get('joinDate'),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    // Cek apakah NIP atau PIN Mesin sudah terpakai di properti ini
    const existing = await prisma.employee.findFirst({
      where: {
        propertyId: session.user.propertyId,
        OR: [
          { nip: parsed.data.nip },
          { machinePin: parsed.data.machinePin ? parsed.data.machinePin : 'TIDAK_MUNGKIN_SAMA' }
        ]
      }
    });

    if (existing) {
      if (existing.nip === parsed.data.nip) return { error: 'NIP sudah digunakan oleh pegawai lain.' };
      if (existing.machinePin === parsed.data.machinePin) return { error: 'PIN Mesin sudah digunakan.' };
    }

    // Simpan ke database
    await prisma.employee.create({
      data: {
        nip: parsed.data.nip,
        machinePin: parsed.data.machinePin || null,
        name: parsed.data.name,
        departmentId: parsed.data.departmentId,
        positionId: parsed.data.positionId,
        employmentStatusId: parsed.data.employmentStatusId,
        joinDate: new Date(parsed.data.joinDate), // Konversi format YYYY-MM-DD ke Date
        organizationId: session.user.organizationId,
        propertyId: session.user.propertyId,
      },
    });

    revalidatePath('/employees');
    return { success: true, message: 'Pegawai berhasil ditambahkan!' };
  } catch (error) {
    console.error('Create Employee Error:', error);
    return { error: 'Gagal menyimpan pegawai ke database.' };
  }
}

export async function deleteEmployee(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await prisma.employee.delete({
      where: { 
        id,
        propertyId: session.user.propertyId 
      },
    });

    revalidatePath('/employees');
    return { success: true };
  } catch (error) {
    console.error('Delete Employee Error:', error);
    return { error: 'Gagal menghapus pegawai (mungkin sudah ada histori absensi).' };
  }
}