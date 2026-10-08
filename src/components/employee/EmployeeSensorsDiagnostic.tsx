import React from 'react';
import { ShieldCheck, Sparkles, MapPin } from 'lucide-react';

interface SensorsDiagnosticState {
  status: 'idle' | 'scanning' | 'done';
  gps: { ok: boolean; coords?: string; error?: string };
  camera: { ok: boolean; error?: string };
}

interface EmployeeSensorsDiagnosticProps {
  sensorsDiagnostic: SensorsDiagnosticState;
  runSensorsDiagnostic: () => void;
}

export const EmployeeSensorsDiagnostic: React.FC<EmployeeSensorsDiagnosticProps> = ({
  sensorsDiagnostic,
  runSensorsDiagnostic,
}) => {
  return (
    <div className="bg-stone-50/40 rounded-2xl p-4 border border-stone-200/60 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#2A7B76]" /> Contrôle Capteurs (GPS & Caméra)
          </h3>
          <p className="text-[10px] text-stone-500">
            Testez la géolocalisation et l'accès caméra de votre appareil avant de badger.
          </p>
        </div>
        <button
          onClick={runSensorsDiagnostic}
          disabled={sensorsDiagnostic.status === 'scanning'}
          className="px-3.5 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl text-[10px] flex items-center gap-1.5 self-start sm:self-auto transition disabled:opacity-50 cursor-pointer shadow-3xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {sensorsDiagnostic.status === 'scanning' ? 'Vérification...' : 'Tester GPS & Caméra'}
        </button>
      </div>

      {sensorsDiagnostic.status === 'scanning' && (
        <div className="text-[11px] font-bold text-[#2A7B76] animate-pulse flex items-center gap-1.5 py-1">
          <span className="w-1.5 h-1.5 bg-[#2A7B76] rounded-full animate-ping" />
          Vérification des autorisations GPS et de l'accès à la caméra...
        </div>
      )}

      {sensorsDiagnostic.status === 'done' && (
        <div className="space-y-2 text-[11px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              className={`p-3 rounded-xl border font-semibold ${
                sensorsDiagnostic.gps.ok
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#2A7B76]" /> GPS Localisation
                </span>
                {sensorsDiagnostic.gps.ok ? (
                  <span className="text-emerald-700 text-[10px]">✓ Opérationnel</span>
                ) : (
                  <span className="text-amber-700 text-[10px]">⚠️ Attention</span>
                )}
              </div>
              <p className="text-[10px] font-normal opacity-90">
                {sensorsDiagnostic.gps.coords || sensorsDiagnostic.gps.error}
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border font-semibold ${
                sensorsDiagnostic.camera.ok
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#2A7B76]" /> Caméra & QR Scanner
                </span>
                {sensorsDiagnostic.camera.ok ? (
                  <span className="text-emerald-700 text-[10px]">✓ Disponible</span>
                ) : (
                  <span className="text-amber-700 text-[10px]">⚠️ Indisponible</span>
                )}
              </div>
              <p className="text-[10px] font-normal opacity-90">
                {sensorsDiagnostic.camera.ok
                  ? "Caméra prête pour le scan du QR Code d'accueil."
                  : sensorsDiagnostic.camera.error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
