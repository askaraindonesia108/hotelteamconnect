import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai melakukan seeding database...');

  // Bersihkan tabel sebelumnya (Hati-hati, ini khusus untuk development awal)
  await prisma.user.deleteMany();
  await prisma.property.deleteMany();
  await prisma.organization.deleteMany();

  // Hash password menggunakan Argon2id
  const hashedPassword = await hash('admin12345');

  // Buat Organisasi dan Properti
  const org = await prisma.organization.create({
    data: {
      name: 'eL Hotel',
      properties: {
        create: {
          name: 'Hotel Team Connect',
        },
      },
    },
    include: { properties: true },
  });

  // Buat Super Admin
  await prisma.user.create({
    data: {
      email: 'admin@elhotel.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      organizationId: org.id,
      propertyId: org.properties[0].id,
      isActive: true,
    },
  });

  console.log('✅ Seeding berhasil!');
  console.log('-------------------------------------------');
  console.log('Akun Default:');
  console.log('Email    : admin@elhotel.com');
  console.log('Password : admin12345');
  console.log('-------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });