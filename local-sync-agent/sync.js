const express = require('express');
const { exec } = require('child_process');
const ZKLib = require('node-zklib');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // <-- Ditambahkan Axios

const app = express();
app.use(express.json());

const CONFIG_FILE = path.join(process.cwd(), 'config.json');
const SYNC_SECRET = 'AskaraSync2026Secure';
const VERCEL_DOMAIN = 'https://www.hotelteamconnect.biz.id';
const VERCEL_API_LOGS = `${VERCEL_DOMAIN}/api/attendance/sync`;
const VERCEL_API_EMPLOYEES = `${VERCEL_DOMAIN}/api/employees/sync`;
const VERCEL_API_AUTH = `${VERCEL_DOMAIN}/api/agent/auth`;

// --- API LOKAL ---

app.get('/api/config', (req, res) => {
  if (fs.existsSync(CONFIG_FILE)) {
    res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
  } else {
    res.json({ sessionActive: false, machineIp: '192.168.88.100', machinePort: 4370 });
  }
});

app.post('/api/config', (req, res) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
  res.json({ success: true });
});

// PROXY LOGIN: Menggunakan Axios yang stabil
app.post('/api/login', async (req, res) => {
  try {
    const response = await axios.post(VERCEL_API_AUTH, req.body);
    res.json(response.data);
  } catch (error) {
    // Menangkap pesan asli dari Vercel (misal: Salah password, atau Error 404/500)
    const msg = error.response ? (error.response.data.error || `Server Vercel Error (${error.response.status})`) : error.message;
    res.status(500).json({ error: `Gagal: ${msg}` });
  }
});

app.post('/api/sync', async (req, res) => {
  const { type } = req.body;
  if (!fs.existsSync(CONFIG_FILE)) return res.status(401).json({ error: 'Sesi tidak valid. Silakan login.' });
  
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  let zkInstance = new ZKLib(config.machineIp, config.machinePort, 10000, 4000);

  try {
    await zkInstance.createSocket();
    await zkInstance.connect();

    if (type === 'employees') {
      const users = await zkInstance.getUsers();
      if (users.data.length === 0) throw new Error('Tidak ada data pegawai di mesin.');
      
      const payload = {
        organizationId: config.organizationId,
        propertyId: config.propertyId,
        employees: users.data.map(u => ({ pin: u.userId, name: u.name }))
      };
      
      const response = await axios.post(VERCEL_API_EMPLOYEES, payload, {
        headers: { 'Authorization': `Bearer ${SYNC_SECRET}` }
      });
      res.json({ message: response.data.message });
      
    } else {
      const logs = await zkInstance.getAttendances();
      if (logs.data.length === 0) throw new Error('Tidak ada log absensi baru.');
      
      const payload = {
        organizationId: config.organizationId,
        propertyId: config.propertyId,
        logs: logs.data.map(l => ({ pin: l.deviceUserId, timestamp: l.recordTime, ip: config.machineIp }))
      };

      const response = await axios.post(VERCEL_API_LOGS, payload, {
        headers: { 'Authorization': `Bearer ${SYNC_SECRET}` }
      });
      res.json({ message: response.data.message });
    }
  } catch (e) {
    const errorMsg = e.response ? (e.response.data.error || `HTTP ${e.response.status}`) : e.message;
    res.status(500).json({ error: errorMsg });
  } finally {
    await zkInstance.disconnect();
  }
});

// --- ANTARMUKA PENGGUNA (UI) ---
const uiHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Team Connect Local Agent</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 p-8 font-sans h-screen flex items-center justify-center">
  <div class="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
    
    <div class="bg-indigo-600 p-6 text-white text-center relative">
      <h1 class="text-2xl font-bold">Team Connect Sync Agent</h1>
      <p class="text-indigo-200 text-sm mt-1">Jembatan Sinkronisasi Mesin Absensi Lokal</p>
      <button id="btnLogout" onclick="logout()" class="hidden absolute top-6 right-6 text-xs bg-indigo-800 hover:bg-indigo-900 px-3 py-1.5 rounded-lg transition-colors">
        Logout
      </button>
    </div>
    
    <div class="p-8 min-h-[400px]">
      <div id="alert" class="hidden mb-6 p-4 rounded-lg text-sm font-medium"></div>

      <div id="loginScreen" class="hidden flex flex-col items-center justify-center py-4">
        <h2 class="text-xl font-bold text-slate-800 mb-2">Login HRD</h2>
        <p class="text-slate-500 text-sm mb-6 text-center">Gunakan akun Dashboard Hotel Team Connect Anda untuk mengakses agen ini.</p>
        
        <div class="w-full max-w-sm space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Alamat Email</label>
            <input type="email" id="email" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="admin@hotel.com">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Password</label>
            <input type="password" id="password" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="••••••••">
          </div>
          <button id="btnLogin" onclick="login()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2">
            Masuk ke Agen
          </button>
        </div>
      </div>

      <div id="dashboardScreen" class="hidden">
        <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p class="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Status Sesi</p>
            <p id="userName" class="text-emerald-900 font-medium">Loading...</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Terkunci pada Properti</p>
            <p id="propLabel" class="text-emerald-900 font-medium text-sm font-mono">Loading...</p>
          </div>
        </div>

        <h2 class="text-lg font-bold text-slate-800 mb-3">1. Konfigurasi Jaringan Mesin</h2>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">IP Mesin Absen (LAN)</label>
            <input type="text" id="ip" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Port Mesin</label>
            <input type="number" id="port" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
          </div>
        </div>
        <button onclick="saveNetwork()" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-sm transition-colors mb-8">
          Simpan IP & Port Mesin
        </button>

        <hr class="border-slate-200 mb-8">

        <h2 class="text-lg font-bold text-slate-800 mb-4">2. Aksi Sinkronisasi</h2>
        <div class="grid grid-cols-2 gap-4">
          <button onclick="runSync('employees')" id="btn-employees" class="flex flex-col items-center justify-center p-6 border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
            <span class="text-3xl mb-2">👥</span>
            <span class="font-bold text-indigo-900">Tarik Data Pegawai</span>
            <span class="text-xs text-indigo-700 mt-1 text-center">Migrasi nama dari mesin ke Cloud</span>
          </button>
          <button onclick="runSync('logs')" id="btn-logs" class="flex flex-col items-center justify-center p-6 border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
            <span class="text-3xl mb-2">⏱️</span>
            <span class="font-bold text-emerald-900">Sinkronisasi Log</span>
            <span class="text-xs text-emerald-700 mt-1 text-center">Tarik data kehadiran harian</span>
          </button>
        </div>
      </div>
      
    </div>
  </div>

  <script>
    let currentConfig = {};

    function showAlert(msg, isError = false) {
      const alert = document.getElementById('alert');
      alert.className = \`mb-6 p-4 rounded-lg text-sm font-medium \${isError ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}\`;
      alert.innerText = msg;
      alert.classList.remove('hidden');
    }

    async function checkSession() {
      const res = await fetch('/api/config');
      currentConfig = await res.json();
      
      if (currentConfig.sessionActive) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        document.getElementById('btnLogout').classList.remove('hidden');
        
        document.getElementById('userName').innerText = currentConfig.name || 'Admin';
        document.getElementById('propLabel').innerText = currentConfig.propertyId;
        document.getElementById('ip').value = currentConfig.machineIp || '192.168.88.100';
        document.getElementById('port').value = currentConfig.machinePort || 4370;
      } else {
        document.getElementById('dashboardScreen').classList.add('hidden');
        document.getElementById('btnLogout').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
      }
    }

    async function login() {
      const btn = document.getElementById('btnLogin');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      btn.innerHTML = 'Memeriksa...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        currentConfig = {
          sessionActive: true,
          name: result.data.name,
          organizationId: result.data.organizationId,
          propertyId: result.data.propertyId,
          machineIp: '192.168.88.100',
          machinePort: 4370
        };
        
        await fetch('/api/config', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(currentConfig) });
        
        document.getElementById('alert').classList.add('hidden');
        checkSession();
      } catch (err) {
        showAlert(err.message, true);
      } finally {
        btn.innerHTML = 'Masuk ke Agen';
        btn.disabled = false;
      }
    }

    async function logout() {
      await fetch('/api/logout', { method: 'POST' });
      document.getElementById('alert').classList.add('hidden');
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      checkSession();
    }

    async function saveNetwork() {
      currentConfig.machineIp = document.getElementById('ip').value;
      currentConfig.machinePort = parseInt(document.getElementById('port').value);
      await fetch('/api/config', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(currentConfig) });
      showAlert('✅ Konfigurasi Jaringan Mesin disimpan!');
    }

    async function runSync(type) {
      const btn = document.getElementById(type === 'employees' ? 'btn-employees' : 'btn-logs');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span class="text-lg font-bold">⏳ Memproses...</span>';
      btn.disabled = true;

      try {
        const res = await fetch('/api/sync', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showAlert(\`✅ Sukses: \${data.message}\`);
      } catch (err) {
        showAlert(\`❌ Gagal: \${err.message}\`, true);
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }

    checkSession();
  </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.send(uiHTML);
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`✅ Server UI berjalan. Membuka antarmuka di browser otomatis...`);
  const url = `http://localhost:${PORT}`;
  const command = process.platform === 'win32' ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
  exec(command);
});