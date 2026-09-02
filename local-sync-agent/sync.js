const ZKLib = require('node-zklib');
const fs = require('fs');
const readline = require('readline');
const net = require('net');

const CONFIG_FILE = './config.json';
const SYNC_SECRET = 'AskaraSync2026Secure';
const VERCEL_API_LOGS = 'https://www.hotelteamconnect.biz.id/api/attendance/sync';
const VERCEL_API_EMPLOYEES = 'https://www.hotelteamconnect.biz.id/api/employees/sync';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function scanLocalNetwork() {
  console.log('\n🔍 Memindai jaringan lokal (192.168.88.x)...');
  const activeIPs = [];
  const promises = [];
  for (let i = 1; i <= 254; i++) {
    const ip = '192.168.88.' + i;
    promises.push(new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1500);
      socket.on('connect', () => { activeIPs.push(ip); socket.destroy(); resolve(); });
      socket.on('timeout', () => { socket.destroy(); resolve(); });
      socket.on('error', () => resolve());
      socket.connect(4370, ip);
    }));
  }
  await Promise.all(promises);
  return activeIPs;
}

async function initConfig() {
  if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

  console.log('🌟 HOTEL TEAM CONNECT - SETUP AGEN 🌟');
  const orgId = await question('Masukkan ID Organisasi: ');
  const propId = await question('Masukkan ID Properti: ');
  
  let machineIp = '';
  const scanChoice = await question('Ingin scan IP otomatis? (Y/n): ');
  if (scanChoice.toLowerCase() !== 'n') {
    const foundIPs = await scanLocalNetwork();
    if (foundIPs.length > 0) {
      console.log(`✅ Mesin ditemukan di: ${foundIPs.join(', ')}`);
      machineIp = await question(`Pilih IP (Default: ${foundIPs[0]}): `) || foundIPs[0];
    } else {
      machineIp = await question('❌ Tidak ditemukan. Masukkan IP manual: ');
    }
  } else {
    machineIp = await question('Masukkan IP manual: ');
  }

  const machinePort = await question('Masukkan Port (Default: 4370): ') || '4370';
  const config = { organizationId: orgId, propertyId: propId, machineIp, machinePort: parseInt(machinePort) };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
}

async function runAgent() {
  const config = await initConfig();
  
  while (true) {
    console.log('\n=============================================');
    console.log('📋 MENU UTAMA - LOCAL SYNC AGENT');
    console.log('=============================================');
    console.log('1. Tarik & Migrasi Daftar Pegawai (Data Master)');
    console.log('2. Tarik & Sinkronisasi Log Absensi (Harian)');
    console.log('3. Keluar');
    
    const choice = await question('\nPilih menu (1/2/3): ');
    
    if (choice === '3') {
      console.log('🔌 Menutup program...');
      process.exit(0);
    }
    
    if (choice === '1' || choice === '2') {
      let zkInstance = new ZKLib(config.machineIp, config.machinePort, 10000, 4000);
      try {
        console.log(`\n⏳ Menghubungkan ke ${config.machineIp}...`);
        await zkInstance.createSocket();
        await zkInstance.connect();
        console.log('✅ Terhubung!');
        
        if (choice === '1') {
          // TARIK PEGAWAI
          const users = await zkInstance.getUsers();
          console.log(`📡 Ditemukan ${users.data.length} data pegawai di mesin.`);
          
          if (users.data.length > 0) {
            const payload = {
              organizationId: config.organizationId,
              propertyId: config.propertyId,
              // Di ZKTeco, PIN biasanya ada di field userId
              employees: users.data.map(u => ({ pin: u.userId, name: u.name }))
            };
            
            console.log(`🚀 Mengirim profil pegawai ke Vercel Cloud...`);
            const response = await fetch(VERCEL_API_EMPLOYEES, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SYNC_SECRET}` },
              body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok) console.log('🎉 MIGRASI SUKSES:', result.message);
            else console.error('❌ GAGAL:', result.error);
          }
        } 
        
        else if (choice === '2') {
          // TARIK LOG ABSEN
          const logs = await zkInstance.getAttendances();
          console.log(`📡 Ditemukan ${logs.data.length} log absensi.`);
          
          if (logs.data.length > 0) {
            const payload = {
              organizationId: config.organizationId,
              propertyId: config.propertyId,
              logs: logs.data.map(l => ({ pin: l.deviceUserId, timestamp: l.recordTime, ip: config.machineIp }))
            };

            console.log(`🚀 Mengirim log ke Vercel Cloud...`);
            const response = await fetch(VERCEL_API_LOGS, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SYNC_SECRET}` },
              body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok) console.log('🎉 SINKRONISASI SUKSES:', result.message);
            else console.error('❌ GAGAL:', result.error);
          }
        }
      } catch (e) {
        console.error('❌ Kesalahan Mesin:', e.message);
      } finally {
        await zkInstance.disconnect();
        console.log('🔌 Koneksi diputus secara aman.');
      }
    } else {
      console.log('⚠️ Pilihan tidak valid.');
    }
  }
}

runAgent();