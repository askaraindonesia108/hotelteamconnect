'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, CheckCircle, Database, ArrowRight, Loader2, Users, Clock, Wifi } from 'lucide-react';
import { processCsvImport, processEmployeeImport } from '../actions';
import { syncMachineData } from '../machine-actions';

type ImportType = 'MACHINE' | 'SCAN' | 'EMPLOYEE';

export function CsvWizard() {
  const [importType, setImportType] = useState<ImportType>('MACHINE');
  
  // State CSV
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // State Mapping CSV
  const [mapPin, setMapPin] = useState<string>('');
  const [mapDatetime, setMapDatetime] = useState<string>('');
  const [mapNip, setMapNip] = useState<string>('');
  const [mapName, setMapName] = useState<string>('');
  const [mapDept, setMapDept] = useState<string>('');
  const [mapPos, setMapPos] = useState<string>('');
  
  // State Jaringan Mesin
  const [ipAddress, setIpAddress] = useState('192.168.88.100');
  const [port, setPort] = useState('4370');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      preview: 3,
      complete: (results) => {
        if (results.meta.fields) {
          const fields = results.meta.fields;
          setHeaders(fields);
          
          if (importType === 'SCAN') {
            setMapPin(fields.find(f => f.toUpperCase().includes('PIN')) || '');
            setMapDatetime(fields.find(f => f.toUpperCase().includes('WAKTU') || f.toUpperCase().includes('TANGGAL')) || '');
          } else {
            setMapPin(fields.find(f => f.toUpperCase() === 'PIN') || '');
            setMapNip(fields.find(f => f.toUpperCase().includes('NIP')) || '');
            setMapName(fields.find(f => f.toUpperCase().includes('NAMA')) || '');
            setMapDept(fields.find(f => f.toUpperCase().includes('DEPARTEMEN') || f.toUpperCase().includes('DEPT')) || '');
            setMapPos(fields.find(f => f.toUpperCase().includes('JABATAN')) || '');
          }
        }
        setPreviewData(results.data);
      },
    });
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setResult(null);

    let res;

    if (importType === 'MACHINE') {
      res = await syncMachineData(ipAddress, port);
    } else {
      const formData = new FormData();
      formData.append('file', file!);

      if (importType === 'SCAN') {
        formData.append('mapping', JSON.stringify({ pin: mapPin, datetime: mapDatetime }));
        res = await processCsvImport(formData);
      } else {
        formData.append('mapping', JSON.stringify({ 
          pin: mapPin, nip: mapNip, name: mapName, department: mapDept, position: mapPos 
        }));
        res = await processEmployeeImport(formData);
      }
    }

    setResult(res);
    setIsProcessing(false);

    if (res?.success && importType !== 'MACHINE') {
      setTimeout(() => { setFile(null); setHeaders([]); }, 4000);
    }
  };

  const isReadyToSubmit = importType === 'MACHINE' 
    ? (ipAddress && port)
    : importType === 'SCAN' 
      ? (mapPin && mapDatetime && file) 
      : (mapPin && mapNip && mapName && mapDept && mapPos && file);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* HEADER TABS */}
      <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-slate-50">
        <button 
          onClick={() => { setImportType('MACHINE'); setResult(null); }}
          className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${importType === 'MACHINE' ? 'bg-white text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Wifi className="w-5 h-5" /> Tarik Mesin (LAN)
        </button>
        <button 
          onClick={() => { setImportType('SCAN'); setFile(null); setHeaders([]); setResult(null); }}
          className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${importType === 'SCAN' ? 'bg-white text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock className="w-5 h-5" /> Import CSV Absen
        </button>
        <button 
          onClick={() => { setImportType('EMPLOYEE'); setFile(null); setHeaders([]); setResult(null); }}
          className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${importType === 'EMPLOYEE' ? 'bg-white text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-5 h-5" /> Migrasi Pegawai
        </button>
      </div>

      <div className="p-6">
        
        {result?.error && (
          <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex flex-col">
            <span className="font-semibold mb-1">Terjadi Kesalahan:</span>
            {result.error}
          </div>
        )}

        {result?.success && (
          <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {result.message}
          </div>
        )}

        {/* --- KONTEN TAB TARIK MESIN (LAN) --- */}
        {importType === 'MACHINE' && (
          <div className="animate-in fade-in space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4 text-indigo-800 text-sm">
              Sistem akan melakukan koneksi TCP/IP ke mesin absensi di jaringan lokal (LAN) Anda, menarik semua log absen, dan melakukan filter deduplikasi otomatis.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IP Address Mesin *</label>
                <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-indigo-500 font-mono" placeholder="192.168.88.100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Port *</label>
                <input type="text" value={port} onChange={e => setPort(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-indigo-500 font-mono" placeholder="4370" />
              </div>
            </div>
          </div>
        )}

        {/* --- KONTEN TAB CSV --- */}
        {importType !== 'MACHINE' && (
          <div className="animate-in fade-in">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer border border-dashed border-slate-300 rounded-xl p-4 mb-6"
            />
            {headers.length > 0 && !result?.success && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /> Pratinjau (3 Baris)</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr>{headers.map((h, i) => <th key={i} className="py-2 px-3 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{previewData.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((h, colIndex) => <td key={colIndex} className="py-2 px-3 text-slate-600 whitespace-nowrap">{row[h] || '-'}</td>)}</tr>)}</tbody></table>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" /> Mapping Kolom</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-slate-50 rounded-xl border border-slate-200">
                    {importType === 'SCAN' && (
                      <><MappingSelect label="Kolom PIN Mesin *" value={mapPin} onChange={setMapPin} options={headers} /><MappingSelect label="Kolom Waktu Scan *" value={mapDatetime} onChange={setMapDatetime} options={headers} /></>
                    )}
                    {importType === 'EMPLOYEE' && (
                      <><MappingSelect label="Kolom PIN *" value={mapPin} onChange={setMapPin} options={headers} /><MappingSelect label="Kolom NIP *" value={mapNip} onChange={setMapNip} options={headers} /><MappingSelect label="Kolom Nama Pegawai *" value={mapName} onChange={setMapName} options={headers} /><MappingSelect label="Kolom Departemen *" value={mapDept} onChange={setMapDept} options={headers} /><MappingSelect label="Kolom Jabatan *" value={mapPos} onChange={setMapPos} options={headers} /></>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
          <button
            onClick={handleProcess}
            disabled={isProcessing || !isReadyToSubmit}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {importType === 'MACHINE' ? 'Menghubungkan ke Mesin...' : 'Memproses Data...'}</>
            ) : (
              <>{importType === 'MACHINE' ? 'Tarik Data Mesin Sekarang' : 'Mulai Impor File'} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

function MappingSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-indigo-500">
        <option value="">-- Abaikan --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}