import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface DriverProfileProps {
  driverId: string;
  isVisible: boolean;
}

const DriverProfile: React.FC<DriverProfileProps> = ({ driverId, isVisible }) => {
  const [visibility, setVisibility] = useState(isVisible);

  const handleVisibilityChange = async () => {
    const visibilityRef = doc(db, 'drivers', driverId);
    await updateDoc(visibilityRef, { isVisible: !visibility });
    setVisibility(!visibility);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <label className="flex items-center space-x-2">
        <span className="text-gray-900">Visible</span>
        <input
          type="checkbox"
          checked={visibility}
          onChange={handleVisibilityChange}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
      </label>
    </div>
  );
};

export default DriverProfile;