import React, { useState } from 'react';

interface VisibilityToggleProps {
  isVisible: boolean;
  onChange: (isVisible: boolean) => void;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ isVisible, onChange }) => {
  const [visibility, setVisibility] = useState(isVisible);

  const handleVisibilityChange = () => {
    const newVisibility = !visibility;
    setVisibility(newVisibility);
    onChange(newVisibility);
  };

  return (
    <div className="p-4 bg-slate-900 bg-opacity-50 rounded-lg shadow-lg">
      <label className="flex items-center space-x-2">
        <span className="text-gray-300">Visible</span>
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

export default VisibilityToggle;