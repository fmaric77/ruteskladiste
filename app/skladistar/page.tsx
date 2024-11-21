// app/skladistar/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Kamion {
  id: number;
  registracija: string;
  datum_registracije: string;
  status: 'Dostupan' | 'U procesu utovara' | 'Utovaren' | 'Otpremljen' | 'Na servisu';
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');     // Remove UTC
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Remove UTC
  const year = date.getFullYear();  // Remove UTC
  return `${day}.${month}.${year}`;
};

const SkladistarDashboard = () => {
  const [kamioni, setKamioni] = useState<Kamion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchKamioni = async () => {
      const storedSkladiste = localStorage.getItem('skladiste');
      if (!storedSkladiste) {
        router.push('/');
        return;
      }

      try {
        const skladiste = JSON.parse(storedSkladiste);
        if (!skladiste.id) {
          setError('Neispravan podatak o skladištu.');
          setLoading(false);
          return;
        }

        // Fetch kamioni data
        const res = await fetch('/api/kamioni');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch kamioni');
        }

        setKamioni(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Greška pri učitavanju podataka.');
      } finally {
        setLoading(false);
      }
    };

    fetchKamioni();
  }, [router]);

  const handleStatusChange = async (kamionId: number, newStatus: Kamion['status']) => {
    try {
      const res = await fetch('/api/kamioni', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: kamionId, status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setKamioni((prev) =>
        prev.map((kamion) =>
          kamion.id === kamionId ? { ...kamion, status: newStatus } : kamion
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error updating status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('skladiste');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 bg-gray-900">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">Kamioni</h1>
        <ul className="space-y-4 mb-8">
          {kamioni.map((kamion) => (
            <li
              key={kamion.id}
              className="p-4 border border-gray-600 rounded-lg shadow bg-gray-700 text-white flex justify-between items-center"
            >
              <div>
                <p>
                  <strong>Registracija:</strong> {kamion.registracija}
                </p>
                <p>
                  <strong>Datum Registracije:</strong> {formatDate(kamion.datum_registracije)}
                </p>
                <p>
                  <strong>Status:</strong> {kamion.status}
                </p>
              </div>
              <div>
                <select
                  value={kamion.status}
                  onChange={(e) =>
                    handleStatusChange(kamion.id, e.target.value as Kamion['status'])
                  }
                  className="mt-1 block w-full bg-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Dostupan">Dostupan</option>
                  <option value="U procesu utovara">U procesu utovara</option>
                  <option value="Utovaren">Utovaren</option>
                  <option value="Otpremljen">Otpremljen</option>
                  <option value="Na servisu">Na servisu</option>
                </select>
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Odjavi se
        </button>
      </div>
    </div>
  );
};

export default SkladistarDashboard;