import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Importa la instancia de Firestore desde firebase.ts

interface Contact {
  id: string;
  displayName: string;
  phone: string;
}

interface ContactSelectorProps {
  onContactSelected: (contact: Contact) => void;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({ onContactSelected }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError(null);

      try {
        const usersRef = collection(db, 'users');
        const driversRef = collection(db, 'drivers');

        const [usersSnapshot, driversSnapshot] = await Promise.all([
          getDocs(usersRef),
          getDocs(driversRef)
        ]);

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
        const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));

        setContacts([...users, ...drivers]);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    onContactSelected(contact);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Contact</h2>
      {loading && <p className="text-gray-700">Loading contacts...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-2">
        {contacts.map(contact => (
          <li
            key={contact.id}
            className={`p-2 cursor-pointer rounded-lg ${selectedContact?.id === contact.id ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => handleContactSelect(contact)}
          >
            <p className="text-gray-900">{contact.displayName}</p>
            <p className="text-gray-700">{contact.phone}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactSelector;