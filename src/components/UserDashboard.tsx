import React, { Suspense } from 'react';

// Importación dinámica de UserProfile
const UserProfile = React.lazy(() => import('./UserProfile'));

interface UserDashboardProps {
  userId: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userId }) => {
  return (
    <div className="p-4">
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-ink to-[#111317] p-4 ring-1 ring-brand-yellow/15">
        <img
          src="/assets/UrbanDriveLogo-512.png"
          alt=""
          className="h-10 w-10 rounded-xl ring-1 ring-brand-yellow/20"
        />
        <div>
          <h2 className="font-display text-xl font-bold text-white">Mi panel</h2>
          <p className="text-sm text-white/60">Tu actividad en Urban Drive</p>
        </div>
      </div>
      <Suspense fallback={<div>Cargando perfil…</div>}>
        <UserProfile userId={userId} userType="user" isVisible={true} />
      </Suspense>
      {/* Add more user-specific components here */}
    </div>
  );
};

export default UserDashboard;