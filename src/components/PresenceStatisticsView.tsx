import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  UserCheck,
  Calendar,
  Filter,
  CheckCircle2,
  Award
} from 'lucide-react';
import { Employee, Presence } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { isCameroonHoliday } from '../utils/cameroonHolidays';

interface PresenceStatisticsViewProps {
  employees: Employee[];
  presences: Presence[];
  onSelectEmployee?: (id: string) => void;
}

export function PresenceStatisticsView({ employees, presences, onSelectEmployee }: PresenceStatisticsViewProps) {
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'last_3_months' | 'all'>('this_month');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMetric, setActiveMetric] = useState<'assiduite' | 'ponctualite' | 'urgences' | 'anomalies'>('assiduite');

  // Filter employees who are active or non-sponsors
  const trackedEmployees = useMemo(() => {
    return employees.filter(e => e.roleType !== 'sponsor' && (e.status === 'en_poste' || !e.status));
  }, [employees]);

  // Date range filter calculation
  const { dateStart, dateEnd, dateStartStr, dateEndStr, totalWorkingDays, effectiveEndStr } = useMemo(() => {
    const now = new Date();
    const start = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'this_month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'last_month') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0); // Last day of previous month
      end.setHours(23, 59, 59, 59);
    } else if (period === 'last_3_months') {
      start.setMonth(start.getMonth() - 3);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setFullYear(2024, 0, 1); // From beginning of tracking
      start.setHours(0, 0, 0, 0);
    }

    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const effectiveEnd = end > todayEnd ? todayEnd : end;

    const startStr = toDateKey(start);
    const endStr = toDateKey(end);
    const effEndStr = toDateKey(effectiveEnd);

    // Calculate actual working business days (Monday to Saturday, excluding Cameroon public holidays)
    let workingDaysCount = 0;
    const cur = new Date(start);
    while (cur <= effectiveEnd) {
      const dayOfWeek = cur.getDay(); // 0 = Sunday
      const dateKey = toDateKey(cur);

      if (dayOfWeek !== 0 && !isCameroonHoliday(dateKey)) {
        workingDaysCount++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { 
      dateStart: start, 
      dateEnd: end,
      dateStartStr: startStr,
      dateEndStr: endStr,
      effectiveEndStr: effEndStr,
      totalWorkingDays: Math.max(1, workingDaysCount)
    };
  }, [period]);

  // Compute exact statistics per employee
  const employeeStats = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    return trackedEmployees.map(emp => {
      // Filter presences for this employee within date range
      const empPresences = presences.filter(p => {
        if (p.employeeId !== emp.id) return false;
        const pDateStr = p.date || (p as any).timestamp?.split('T')[0] || '';
        return pDateStr >= dateStartStr && pDateStr <= dateEndStr;
      });

      // Calculate employee-specific working days (taking into account hireDate & departureDate)
      const empStart = emp.hireDate && emp.hireDate > dateStartStr ? new Date(emp.hireDate) : dateStart;
      const empEndLimit = emp.departureDate && emp.departureDate < effectiveEndStr ? new Date(emp.departureDate) : new Date();
      const empEnd = empEndLimit < dateEnd ? empEndLimit : dateEnd;

      let empWorkingDays = 0;
      if (empStart <= empEnd) {
        const curD = new Date(empStart);
        while (curD <= empEnd) {
          const dayOfWeek = curD.getDay();
          const dKey = toDateKey(curD);
          if (dayOfWeek !== 0 && !isCameroonHoliday(dKey)) {
            empWorkingDays++;
          }
          curD.setDate(curD.getDate() + 1);
        }
      }
      const effectiveEmpWorkingDays = Math.max(1, empWorkingDays > 0 ? empWorkingDays : totalWorkingDays);

      let onTimeDays = 0;
      let retardsCount = 0;
      let retardsSignalesCount = 0;
      let pausesAnticipeesCount = 0;
      let pausesAnticipeesSignaleesCount = 0;
      let rallongesPauseCount = 0;
      let rallongesPauseSignaleesCount = 0;
      let departsAnticipesCount = 0;
      let departsAnticipesSignalesCount = 0;
      let departsTardifsCount = 0;
      let totalUrgencesCount = 0;
      let presentDaysCount = 0;
      let declaredAbsencesCount = 0;

      empPresences.forEach(p => {
        const arrival = p.arrivalTime || (p as any).checkIn || '';
        const departure = p.departureTime || (p as any).checkOut || '';
        const pauseStart = p.pauseStart || '';
        const pauseEnd = p.pauseEnd || '';

        const hasPointed = p.status === 'present' || p.status === 'late' || (arrival && p.status !== 'absent');
        const isDeclaredAbsent = p.status === 'absent';

        if (isDeclaredAbsent) {
          declaredAbsencesCount++;
          if (p.correctionReason || p.emergencies?.length) {
            totalUrgencesCount++;
          }
          return;
        }

        if (hasPointed) {
          presentDaysCount++;

          // Check arrival time (Threshold 08:15 standard HERO Cab)
          let isArrivalLate = p.status === 'late';
          if (arrival && arrival.includes(':')) {
            const [h, m] = arrival.split(':').map(Number);
            const arrivalMinutes = (h || 8) * 60 + (m || 0);
            const threshold = 8 * 60 + 15; // 08h15
            if (arrivalMinutes > threshold) {
              isArrivalLate = true;
            }
          }

          if (!isArrivalLate) {
            onTimeDays++;
          } else {
            retardsCount++;
            if (p.correctionReason || p.emergencies?.length || p.correctionReasonStatus === 'approved') {
              retardsSignalesCount++;
            }
          }

          // Urgences & justification count
          const urgCount = (p.emergencies?.length || 0) + (p.correctionReason ? 1 : 0);
          totalUrgencesCount += urgCount;

          // Early lunch before 12h00
          if (pauseStart && pauseStart < '12:00') {
            pausesAnticipeesCount++;
            if (p.correctionReason || p.emergencies?.length) pausesAnticipeesSignaleesCount++;
          }

          // Extended break > 60 minutes
          if (pauseStart && pauseEnd) {
            const [psh, psm] = pauseStart.split(':').map(Number);
            const [peh, pem] = pauseEnd.split(':').map(Number);
            const durationMins = (peh * 60 + pem) - (psh * 60 + psm);
            if (durationMins > 60) {
              rallongesPauseCount++;
              if (p.correctionReason || p.emergencies?.length) rallongesPauseSignaleesCount++;
            }
          }

          // Early departure before 17h00
          if (departure && departure < '17:00') {
            departsAnticipesCount++;
            if (p.correctionReason || p.departureReason || p.emergencies?.length) departsAnticipesSignalesCount++;
          }

          // Late departure after 17h30
          if (departure && departure > '17:30') {
            departsTardifsCount++;
          }
        }
      });

      const totalDaysPointed = presentDaysCount;
      const computedAbsences = Math.max(declaredAbsencesCount, effectiveEmpWorkingDays - totalDaysPointed);
      
      // 1. Taux d'Assiduité : Proportion des jours ouvrés effectifs où le collaborateur s'est présenté
      const assiduiteRate = effectiveEmpWorkingDays > 0 
        ? Math.min(100, Math.round((totalDaysPointed / effectiveEmpWorkingDays) * 100)) 
        : 100;

      // 2. Taux de Ponctualité : Proportion des arrivées à l'heure parmi les jours pointés
      const ponctualiteRate = totalDaysPointed > 0 
        ? Math.round((onTimeDays / totalDaysPointed) * 100) 
        : 100;

      const nonSignaledAnomalies =
        (retardsCount - retardsSignalesCount) +
        (pausesAnticipeesCount - pausesAnticipeesSignaleesCount) +
        (rallongesPauseCount - rallongesPauseSignaleesCount) +
        (departsAnticipesCount - departsAnticipesSignalesCount);

      return {
        id: emp.id,
        name: emp.name,
        avatarUrl: emp.avatarUrl,
        position: emp.roleType || 'Collaborateur',
        totalDaysPointed,
        totalWorkingDays: effectiveEmpWorkingDays,
        onTimeDays,
        absencesCount: computedAbsences,
        retardsCount,
        retardsSignalesCount,
        retardsNonSignales: Math.max(0, retardsCount - retardsSignalesCount),
        pausesAnticipeesCount,
        pausesAnticipeesSignaleesCount,
        pausesAnticipeesNonSignalees: Math.max(0, pausesAnticipeesCount - pausesAnticipeesSignaleesCount),
        rallongesPauseCount,
        rallongesPauseSignaleesCount,
        rallongesPauseNonSignalees: Math.max(0, rallongesPauseCount - rallongesPauseSignaleesCount),
        departsAnticipesCount,
        departsAnticipesSignalesCount,
        departsAnticipesNonSignales: Math.max(0, departsAnticipesCount - departsAnticipesSignalesCount),
        departsTardifsCount,
        totalUrgencesCount,
        assiduiteRate,
        ponctualiteRate,
        nonSignaledAnomalies
      };
    }).sort((a, b) => {
      if (b.assiduiteRate !== a.assiduiteRate) {
        return b.assiduiteRate - a.assiduiteRate;
      }
      if (b.ponctualiteRate !== a.ponctualiteRate) {
        return b.ponctualiteRate - a.ponctualiteRate;
      }
      return b.totalDaysPointed - a.totalDaysPointed;
    });
  }, [trackedEmployees, presences, dateStartStr, dateEndStr, totalWorkingDays, dateStart, dateEnd, effectiveEndStr]);

  const filteredEmployeeStats = useMemo(() => {
    if (!searchQuery.trim()) return employeeStats;
    const q = searchQuery.toLowerCase();
    return employeeStats.filter(
      s => s.name.toLowerCase().includes(q) || s.position.toLowerCase().includes(q)
    );
  }, [employeeStats, searchQuery]);

  const globalKpis = useMemo(() => {
    const totalCollaborators = employeeStats.length;
    if (totalCollaborators === 0) {
      return { avgAssiduite: 100, avgPonctualite: 100, totalUrgences: 0, totalAnomalies: 0, totalPointages: 0, totalWorkingDays };
    }
    const sumAssiduite = employeeStats.reduce((acc, curr) => acc + curr.assiduiteRate, 0);
    const sumPonctualite = employeeStats.reduce((acc, curr) => acc + curr.ponctualiteRate, 0);
    const totalUrgences = employeeStats.reduce((acc, curr) => acc + curr.totalUrgencesCount, 0);
    const totalAnomalies = employeeStats.reduce((acc, curr) => acc + curr.nonSignaledAnomalies, 0);
    const totalPointages = employeeStats.reduce((acc, curr) => acc + curr.totalDaysPointed, 0);

    return {
      avgAssiduite: Math.round(sumAssiduite / totalCollaborators),
      avgPonctualite: Math.round(sumPonctualite / totalCollaborators),
      totalUrgences,
      totalAnomalies,
      totalPointages,
      totalWorkingDays
    };
  }, [employeeStats, totalWorkingDays]);

  const chartData = useMemo(() => {
    return filteredEmployeeStats.map(stat => ({
      name: stat.name.split(' ')[0],
      fullName: stat.name,
      assiduite: stat.assiduiteRate,
      ponctualite: stat.ponctualiteRate,
      urgences: stat.totalUrgencesCount,
      anomalies: stat.nonSignaledAnomalies,
      retards: stat.retardsCount,
      pauses: stat.pausesAnticipeesCount + stat.rallongesPauseCount,
      departs: stat.departsAnticipesCount
    }));
  }, [filteredEmployeeStats]);

  return (
    <div className="space-y-5 animate-fadeIn" id="presence-statistics-dashboard">
      
      {/* 1. 4 Cards Summary Grid at the very top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Assiduité Globale */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Taux d'Assiduité Global
            </span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-black text-stone-900">
              {globalKpis.avgAssiduite}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              présence / {globalKpis.totalWorkingDays} j. ouvrés
            </span>
          </div>
        </div>

        {/* Card 2: Ponctualité Globale */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Taux de Ponctualité
            </span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-black text-stone-900">
              {globalKpis.avgPonctualite}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              arrivées à l'heure (≤ 08h15)
            </span>
          </div>
        </div>

        {/* Card 3: Urgences & Justifications */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Urgences & Motifs
            </span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-700 border border-amber-100">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-black text-stone-900">
              {globalKpis.totalUrgences}
            </span>
            <span className="text-xs text-amber-700 font-semibold">
              déclarations enregistrées
            </span>
          </div>
        </div>

        {/* Card 4: Anomalies Non Justifiées */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Anomalies Non Justifiées
            </span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-700 border border-rose-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-black text-stone-900">
              {globalKpis.totalAnomalies}
            </span>
            <span className="text-xs text-rose-700 font-semibold">
              retards / sorties sans motif
            </span>
          </div>
        </div>
      </div>

      {/* 2. Single Merged Container Div (Controls + Chart + Table) below the 4 cards */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-6">
        
        {/* Controls Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                Analyse Détaillée d'Assiduité & Comportement
              </h3>
              <p className="text-xs text-stone-500">
                Période active : {dateStartStr} au {dateEndStr} ({globalKpis.totalWorkingDays} jours ouvrés)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Period Filter Buttons */}
            <div className="inline-flex bg-stone-100 p-1.5 rounded-xl text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setPeriod('this_month')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  period === 'this_month' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ce mois
              </button>
              <button
                onClick={() => setPeriod('last_month')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  period === 'last_month' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Mois dernier
              </button>
              <button
                onClick={() => setPeriod('last_3_months')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  period === 'last_3_months' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                3 Derniers Mois
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  period === 'all' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tout
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un collaborateur..."
                className="pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Bar Chart Section */}
        <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Comparatif Graphique par Collaborateur
              </h4>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 text-xs">
              <button
                onClick={() => setActiveMetric('assiduite')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold ${
                  activeMetric === 'assiduite' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Assiduité (%)
              </button>
              <button
                onClick={() => setActiveMetric('ponctualite')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold ${
                  activeMetric === 'ponctualite' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ponctualité (%)
              </button>
              <button
                onClick={() => setActiveMetric('urgences')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold ${
                  activeMetric === 'urgences' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Urgences
              </button>
              <button
                onClick={() => setActiveMetric('anomalies')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold ${
                  activeMetric === 'anomalies' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Anomalies
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#6B7280' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  domain={activeMetric === 'assiduite' || activeMetric === 'ponctualite' ? [0, 100] : [0, 'auto']}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                          <p className="font-bold text-white border-b border-stone-700 pb-1">{data.fullName}</p>
                          <p className="text-[11px] text-stone-300">
                            Assiduité : <strong className="text-emerald-400">{data.assiduite}%</strong>
                          </p>
                          <p className="text-[11px] text-stone-300">
                            Ponctualité : <strong className="text-emerald-300">{data.ponctualite}%</strong>
                          </p>
                          <p className="text-[11px] text-stone-300">
                            Retards : <strong className="text-amber-400">{data.retards}</strong>
                          </p>
                          <p className="text-[11px] text-stone-300">
                            Urgences déclarées : <strong className="text-blue-400">{data.urgences}</strong>
                          </p>
                          <p className="text-[11px] text-stone-300">
                            Anomalies non motivées : <strong className="text-rose-400">{data.anomalies}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey={activeMetric} 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                >
                  {chartData.map((entry, index) => {
                    let fillColor = '#059669';
                    if (activeMetric === 'assiduite' || activeMetric === 'ponctualite') {
                      const val = activeMetric === 'assiduite' ? entry.assiduite : entry.ponctualite;
                      fillColor = val >= 85 ? '#059669' : val >= 70 ? '#d97706' : '#e11d48';
                    } else if (activeMetric === 'urgences') {
                      fillColor = '#2563eb';
                    } else if (activeMetric === 'anomalies') {
                      fillColor = '#dc2626';
                    }
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
              Registre Récapitulatif par Collaborateur ({filteredEmployeeStats.length})
            </h4>
            <span className="text-xs font-mono text-stone-500">
              Base de calcul : {globalKpis.totalWorkingDays} jours ouvrés
            </span>
          </div>

          <div className="border border-stone-200/80 rounded-2xl overflow-x-auto shadow-2xs bg-white">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200/80 text-xs font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3.5 px-3">Collaborateur</th>
                  <th className="py-3.5 px-3 text-center">Jours Pointés</th>
                  <th className="py-3.5 px-3 text-center">Assiduité</th>
                  <th className="py-3.5 px-3 text-center">Ponctualité</th>
                  <th className="py-3.5 px-3 text-center">Retards</th>
                  <th className="py-3.5 px-3 text-center">Urgences</th>
                  <th className="py-3.5 px-3 text-center">Pauses (&lt;12h/&gt;1h)</th>
                  <th className="py-3.5 px-3 text-center">Départs (&lt;17h/&gt;17h30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredEmployeeStats.map(stat => {
                  const empInitials = stat.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr 
                      key={stat.id} 
                      onClick={() => onSelectEmployee?.(stat.id)}
                      className="hover:bg-stone-50/70 transition cursor-pointer"
                      title="Cliquer pour ouvrir la fiche de ce collaborateur"
                    >
                      {/* Collaborateur */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {stat.avatarUrl ? (
                            <img
                              src={stat.avatarUrl}
                              alt={stat.name}
                              className="w-8 h-8 rounded-full object-cover border border-stone-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                              {empInitials}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-stone-900 text-xs sm:text-sm">{stat.name}</div>
                            <div className="text-xs text-stone-500">{stat.position}</div>
                          </div>
                        </div>
                      </td>

                      {/* Total Days Pointed */}
                      <td className="py-3 px-3 text-center font-mono text-stone-800">
                        <span className="font-bold text-stone-900">{stat.totalDaysPointed}</span>
                        <span className="text-[10px] text-stone-400"> / {stat.totalWorkingDays} j</span>
                      </td>

                      {/* Assiduite Rate */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-xs border ${
                          stat.assiduiteRate >= 85
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : stat.assiduiteRate >= 70
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {stat.assiduiteRate}%
                        </span>
                      </td>

                      {/* Ponctualite Rate */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-xs border ${
                          stat.ponctualiteRate >= 85
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : stat.ponctualiteRate >= 70
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {stat.ponctualiteRate}%
                        </span>
                      </td>

                      {/* Retards */}
                      <td className="py-3 px-3 text-center">
                        {stat.retardsCount > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-800">{stat.retardsCount}</span>
                            <div className="text-[9px] text-stone-500">
                              {stat.retardsSignalesCount} sig. / <span className="text-emerald-700 font-bold">{stat.retardsNonSignales} non sig.</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-300 font-bold">0</span>
                        )}
                      </td>

                      {/* Urgences */}
                      <td className="py-3 px-3 text-center font-bold text-emerald-900">
                        {stat.totalUrgencesCount > 0 ? (
                          <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-mono">
                            {stat.totalUrgencesCount}
                          </span>
                        ) : (
                          <span className="text-stone-300 font-bold">0</span>
                        )}
                      </td>

                      {/* Pauses */}
                      <td className="py-3 px-3 text-center">
                        {(stat.pausesAnticipeesCount + stat.rallongesPauseCount) > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-800">
                              {stat.pausesAnticipeesCount + stat.rallongesPauseCount}
                            </span>
                            <div className="text-[9px] text-stone-500">
                              {stat.pausesAnticipeesCount > 0 && `${stat.pausesAnticipeesCount} ant. `}
                              {stat.rallongesPauseCount > 0 && `${stat.rallongesPauseCount} prol.`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-300 font-bold">0</span>
                        )}
                      </td>

                      {/* Départs */}
                      <td className="py-3 px-3 text-center">
                        {(stat.departsAnticipesCount + stat.departsTardifsCount) > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-stone-800">
                              {stat.departsAnticipesCount + stat.departsTardifsCount}
                            </span>
                            <div className="text-[9px] text-stone-500">
                              {stat.departsAnticipesCount > 0 && <span className="text-amber-700">{stat.departsAnticipesCount} ant. </span>}
                              {stat.departsTardifsCount > 0 && <span className="text-emerald-700">{stat.departsTardifsCount} tard.</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-300 font-bold">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredEmployeeStats.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                      Aucun collaborateur trouvé pour cette recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PresenceStatisticsView;
