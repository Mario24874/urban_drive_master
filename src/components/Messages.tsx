import React, { useState } from 'react';
import ContactSelector from './ContactSelector';

interface Message {
  id: string;
  message: string;
}

interface MessagesProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (message: string, contactId: string) => Promise<void>;
}

const Messages: React.FC<MessagesProps> = ({ messages, newMessage, setNewMessage, handleSendMessage }) => {
  const [selectedContact, setSelectedContact] = useState<{ id: string; displayName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContactSelected = (contact: { id: string; displayName: string }) => {
    setSelectedContact(contact);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) {
      setError('Please select a contact first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await handleSendMessage(newMessage, selectedContact.id);
      setNewMessage('');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
      <ContactSelector onContactSelected={handleContactSelected} />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {selectedContact && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected Contact: {selectedContact.displayName}</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <input
                type="text"
                className="input-field"
                placeholder="New Message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {messages.map((message) => (
          <li key={message.id} className="text-gray-700">
            {message.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Messages;