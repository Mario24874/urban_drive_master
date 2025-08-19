import React, { Suspense } from 'react';

// Importación dinámica de DriverLocation
const DriverLocation = React.lazy(() => import('./DriverLocation'));

interface DriverDashboardProps {
  userId: string;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ userId }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Driver Dashboard</h2>
      <Suspense fallback={<div>Loading Driver Location...</div>}>
        <DriverLocation userId={userId} />
      </Suspense>
      {/* Add more driver-specific components here */}
    </div>
  );
};

export default DriverDashboard;