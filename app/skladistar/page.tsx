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
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const SkladistarDashboard = () => {
  const [kamioni, setKamioni] = useState<Kamion[]>([]);
  const [availableKamioni, setAvailableKamioni] = useState<Kamion[]>([]);
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

        // Dohvati podatke o kamionima na skladištu
        const res = await fetch(`/api/kamioni-na-skladistu?skladiste_id=${skladiste.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch kamioni');
        }

        setKamioni(data);

        // Fetch available kamioni data
        const availableRes = await fetch(`/api/available-trucks?skladiste_id=${skladiste.id}`);
        const availableData = await availableRes.json();

        if (!availableRes.ok) {
          throw new Error(availableData.error || 'Failed to fetch available trucks');
        }

        setAvailableKamioni(availableData);
      } catch (err) {
        const errorMessage = (err as Error).message || 'Greška pri učitavanju podataka.';
        console.error(err);
        setError(errorMessage);
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
    } catch (err) {
      const errorMessage = (err as Error).message || 'Error updating status';
      console.error(err);
      alert(errorMessage);
    }
  };

  const handleAddTruck = async (kamionId: number) => {
    const storedSkladiste = localStorage.getItem('skladiste');
    if (!storedSkladiste) {
      router.push('/');
      return;
    }

    const skladiste = JSON.parse(storedSkladiste);

    try {
      const res = await fetch('/api/add-truck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kamionId, skladisteId: skladiste.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add truck');
      }

      // Osvježi podatke
      setAvailableKamioni((prev) => prev.filter((kamion) => kamion.id !== kamionId));
      setKamioni((prev) => [...prev, availableKamioni.find((kamion) => kamion.id === kamionId)!]);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Error adding truck';
      console.error(err);
      alert(errorMessage);
    }
  };

  const handleRemoveTruck = async (kamionId: number) => {
    const storedSkladiste = localStorage.getItem('skladiste');
    if (!storedSkladiste) {
      router.push('/');
      return;
    }

    const skladiste = JSON.parse(storedSkladiste);

    try {
      const res = await fetch('/api/remove-truck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kamionId, skladisteId: skladiste.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove truck');
      }

      // Osvježi podatke
      setKamioni((prev) => prev.filter((kamion) => kamion.id !== kamionId));
      setAvailableKamioni((prev) => [...prev, kamioni.find((kamion) => kamion.id === kamionId)!]);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Error removing truck';
      console.error(err);
      alert(errorMessage);
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
        <h2 className="text-xl font-bold mb-4 text-center text-white">Slobodni Kamioni</h2>
        <ul className="space-y-4 mb-8">
          {availableKamioni.map((kamion) => (
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
              <button
                onClick={() => handleAddTruck(kamion.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Dodaj
              </button>
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-bold mb-4 text-center text-white">Kamioni na Skladištu</h2>
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
              <div className="flex space-x-4">
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
                <button
                  onClick={() => handleRemoveTruck(kamion.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Ukloni
                </button>
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