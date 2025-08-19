import React, { useEffect, useState, Suspense } from 'react';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import DriverProfile from '../components/DriverProfile';

const UserProfile = React.lazy(() => import('../components/UserProfile'));

interface ProfilePageProps {
  userId: string;
  userType: 'user' | 'driver';
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId, userType }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, userType === 'user' ? 'users' : 'drivers', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData && typeof userData.isVisible === 'boolean') {
            setIsVisible(userData.isVisible);
          } else {
            setError('Invalid user data structure');
          }
        } else {
          setError('User not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Error fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, userType]);

  const handleVisibilityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVisibility = e.target.checked;
    setIsVisible(newVisibility);

    try {
      if (userType === 'user') {
        await updateDoc(doc(db, 'users', userId), { isVisible: newVisibility });
      } else if (userType === 'driver') {
        await updateDoc(doc(db, 'drivers', userId), { isVisible: newVisibility });
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      setError('Error updating visibility');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
      <label className="flex items-center space-x-2">
        <span className="text-gray-900">Visible</span>
        <input
          type="checkbox"
          checked={isVisible}
          onChange={handleVisibilityChange}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
      </label>
      {userType === 'user' ? (
        <Suspense fallback={<div>Loading User Profile...</div>}>
          <UserProfile userId={userId} userType={userType} isVisible={isVisible} />
        </Suspense>
      ) : (
        <DriverProfile driverId={userId} isVisible={isVisible} />
      )}
    </div>
  );
};

export default ProfilePage;