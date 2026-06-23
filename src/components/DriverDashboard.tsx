import React, { Suspense } from 'react';

// Importación dinámica de DriverLocation
const DriverLocation = React.lazy(() => import('./DriverLocation'));

interface DriverDashboardProps {
  userId: string;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ userId }) => {
  return (
    <div className="p-4">
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-ink to-[#111317] p-4 ring-1 ring-brand-yellow/15">
        <img
          src="/assets/UrbanDriveLogo-512.png"
          alt=""
          className="h-10 w-10 rounded-xl ring-1 ring-brand-yellow/20"
        />
        <div>
          <h2 className="font-display text-xl font-bold text-white">Panel de conductor</h2>
          <p className="text-sm text-white/60">Gestiona tu ubicación y viajes</p>
        </div>
      </div>
      <Suspense fallback={<div>Cargando ubicación…</div>}>
        <DriverLocation userId={userId} />
      </Suspense>
      {/* Add more driver-specific components here */}
    </div>
  );
};

export default DriverDashboard;