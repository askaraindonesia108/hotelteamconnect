'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Briefcase } from 'lucide-react';

interface RawAttendance {
  date: string;
  checkIn: Date | null;
  checkOut: Date | null;
  departmentId: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface HRChartProps {
  attendances: RawAttendance[];
  departments: Department[];
  last7Days: string[];
}

export function InteractiveHRChart({ attendances, departments, last7Days }: HRChartProps) {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [metric, setMetric] = useState<'ARRIVAL' | 'WORK_HOURS'>('ARRIVAL');

  // Konversi format waktu desimal ke HH:mm (contoh: 7.5 -> 07:30)
  const formatTimeFromDecimal = (decimal: number) => {
    if (!decimal) return '-';
    const hrs = Math.floor(decimal);
    const mins = Math.round((decimal - hrs) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatDurationFromDecimal = (decimal: number) => {
    if (!decimal) return '-';
    const hrs = Math.floor(decimal);
    const mins = Math.round((decimal - hrs) * 60);
    return `${hrs}j ${mins}m`;
  };

  // Kalkulasi data grafik secara dinamis saat filter diubah
  const chartData = useMemo(() => {
    // 1. Filter berdasarkan departemen
    const filtered = selectedDept === 'ALL' 
      ? attendances 
      : attendances.filter(a => a.departmentId === selectedDept);

    // 2. Kelompokkan berdasarkan tanggal
    const groupedByDate: Record<string, typeof filtered> = {};
    filtered.forEach(record => {
      if (!groupedByDate[record.date]) groupedByDate[record.date] = [];
      groupedByDate[record.date].push(record);
    });

    // 3. Petakan ke rentang 7 hari terakhir agar sumbu X selalu konsisten
    return last7Days.map(dateStr => {
      const dayRecords = groupedByDate[dateStr] || [];
      
      let totalArrivalDecimal = 0;
      let validArrivals = 0;
      
      let totalWorkHours = 0;
      let validWorkHours = 0;

      dayRecords.forEach(rec => {
        if (rec.checkIn) {
          // Konversi jam ke desimal (contoh: 07:30 = 7.5)
          const checkInDate = new Date(rec.checkIn);
          const arrivalDecimal = checkInDate.getHours() + (checkInDate.getMinutes() / 60);
          totalArrivalDecimal += arrivalDecimal;
          validArrivals++;

          if (rec.checkOut) {
            const checkOutDate = new Date(rec.checkOut);
            const durationDecimal = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
            totalWorkHours += durationDecimal;
            validWorkHours++;
          }
        }
      });

      return {
        date: dateStr,
        avgArrival: validArrivals > 0 ? Number((totalArrivalDecimal / validArrivals).toFixed(2)) : null,
        avgWorkHours: validWorkHours > 0 ? Number((totalWorkHours / validWorkHours).toFixed(2)) : null,
      };
    });
  }, [attendances, selectedDept, last7Days]);

  const isArrival = metric === 'ARRIVAL';

  return (
    <div className="w-full">
      {/* Kontrol Interaktif (Filter & Toggle) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setMetric('ARRIVAL')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isArrival ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Clock className="w-4 h-4" /> Jam Kedatangan
          </button>
          <button
            onClick={() => setMetric('WORK_HOURS')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!isArrival ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Briefcase className="w-4 h-4" /> Jam Kerja
          </button>
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="text-sm border-slate-300 rounded-lg text-slate-700 focus:ring-indigo-500 py-2 pl-3 pr-8 bg-slate-50"
        >
          <option value="ALL">Semua Departemen</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Render Grafik Recharts */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isArrival ? '#4f46e5' : '#10b981'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isArrival ? '#4f46e5' : '#10b981'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
              tickMargin={10}
            />
            <YAxis 
              domain={isArrival ? [5, 10] : [0, 12]} // Batas Y dinamis
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => isArrival ? formatTimeFromDecimal(val) : `${val}j`}
            />
            <Tooltip
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [
                isArrival ? formatTimeFromDecimal(value as number) : formatDurationFromDecimal(value as number),
                isArrival ? 'Rata-rata Kedatangan' : 'Rata-rata Jam Kerja'
              ]}
              labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey={isArrival ? "avgArrival" : "avgWorkHours"}
              stroke={isArrival ? '#4f46e5' : '#10b981'}
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorMetric)" 
              connectNulls={true}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}