import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Importa la instancia de Firestore desde firebase.ts

interface SearchDriverProps {
  onDriverFound: (driver: any) => void;
}

const SearchDriver: React.FC<SearchDriverProps> = ({ onDriverFound }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, where('phone', '==', phoneNumber));
      console.log('Searching for phone number:', phoneNumber); // Log del número buscado
      const querySnapshot = await getDocs(q);
  
      console.log('Query snapshot size:', querySnapshot.size); // Log del tamaño del resultado
  
      if (!querySnapshot.empty) {
        const driver = querySnapshot.docs[0].data();
        console.log('Driver found:', driver); // Log del conductor encontrado
        onDriverFound(driver);
      } else {
        console.log('No matching documents.'); // Log si no se encuentran documentos
        setError('Driver not found');
      }
    } catch (error) {
      console.error('Error searching driver:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Driver</h2>
      <input
        type="text"
        className="input-field"
        placeholder="Enter driver's phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button
        className="btn-primary mt-4"
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
};

export default SearchDriver;