import React from 'react';
import UserDashboard from '../components/UserDashboard';
import DriverDashboard from '../components/DriverDashboard';

interface DashboardPageProps {
  userId: string;
  userType: 'user' | 'driver';
}

const DashboardPage: React.FC<DashboardPageProps> = ({ userId, userType }) => {
  return (
    <div className="p-4">
      {userType === 'user' ? (
        <UserDashboard userId={userId} />
      ) : (
        <DriverDashboard userId={userId} />
      )}
    </div>
  );
};

export default DashboardPage;