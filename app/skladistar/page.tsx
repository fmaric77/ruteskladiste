// app/skladistar/page.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Kamion {
  id: number;
  registracija: string;
  datum_registracije: string;
  status: 'Dostupan' | 'U procesu utovara' | 'Utovaren' | 'Otpremljen' | 'Na servisu';
  rampa?: string | null;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const statusTone: Record<Kamion['status'], string> = {
  Dostupan: 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/30',
  'U procesu utovara': 'bg-amber-400/15 text-amber-100 ring-amber-400/30',
  Utovaren: 'bg-sky-400/15 text-sky-100 ring-sky-400/30',
  Otpremljen: 'bg-violet-400/15 text-violet-100 ring-violet-400/30',
  'Na servisu': 'bg-rose-400/15 text-rose-100 ring-rose-400/30',
};

const SkladistarDashboard = () => {
  const [kamioni, setKamioni] = useState<Kamion[]>([]);
  const [availableKamioni, setAvailableKamioni] = useState<Kamion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [naziv, setNaziv] = useState('');
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
        setNaziv(skladiste.naziv_skladista || skladiste.naziv || '');
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

        //Dohvati podatke o dostupnim kamionima
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

  const rampRequest = useRef<Record<number, string>>({});

  const handleRampSave = async (kamionId: number, rampa: string) => {
    const storedSkladiste = localStorage.getItem('skladiste');
    if (!storedSkladiste) {
      router.push('/');
      return;
    }

    const skladiste = JSON.parse(storedSkladiste);
    const value = rampa.trim();
    rampRequest.current[kamionId] = value;

    try {
      const res = await fetch('/api/kamioni-na-skladistu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kamionId, skladisteId: skladiste.id, rampa: value }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update ramp');
      }

      if (rampRequest.current[kamionId] !== value) return;

      setKamioni((prev) =>
        prev.map((kamion) =>
          kamion.id === kamionId ? { ...kamion, rampa: data.rampa } : kamion
        )
      );
    } catch (err) {
      if (rampRequest.current[kamionId] !== value) return;
      const errorMessage = (err as Error).message || 'Error updating ramp';
      console.error(err);
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('skladiste');
    router.push('/');
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ui-kicker">Skladište</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Kamioni</h1>
            <p className="mt-1 text-sm text-slate-400">{naziv || 'Pregled vozila na lokaciji'}</p>
          </div>
          <button type="button" onClick={handleLogout} className="ui-btn ui-btn-danger">
            Odjavi se
          </button>
        </header>

        {loading && <p className="text-slate-300">Učitavanje...</p>}
        {error && (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Slobodni kamioni</h2>
                <span className="text-sm text-slate-400">{availableKamioni.length}</span>
              </div>
              {availableKamioni.length === 0 ? (
                <p className="ui-card px-4 py-6 text-sm text-slate-400">Nema slobodnih kamiona.</p>
              ) : (
                <ul className="space-y-3">
                  {availableKamioni.map((kamion) => (
                    <li key={kamion.id} className="ui-row flex-col sm:flex-row sm:items-center">
                      <div>
                        <p className="font-mono text-lg tracking-wider">{kamion.registracija}</p>
                        <p className="mt-1 text-sm text-slate-400">Registriran {formatDate(kamion.datum_registracije)}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs ring-1 ${statusTone[kamion.status]}`}>
                          {kamion.status}
                        </span>
                      </div>
                      <button type="button" onClick={() => handleAddTruck(kamion.id)} className="ui-btn ui-btn-primary">
                        Dodaj
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Kamioni na skladištu</h2>
                <span className="text-sm text-slate-400">{kamioni.length}</span>
              </div>
              {kamioni.length === 0 ? (
                <p className="ui-card px-4 py-6 text-sm text-slate-400">Nema kamiona na skladištu.</p>
              ) : (
                <ul className="space-y-3">
                  {kamioni.map((kamion) => (
                    <li key={kamion.id} className="ui-row flex-col items-stretch sm:flex-row sm:items-center">
                      <div>
                        <p className="font-mono text-lg tracking-wider">{kamion.registracija}</p>
                        <p className="mt-1 text-sm text-slate-400">Registriran {formatDate(kamion.datum_registracije)}</p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <RampField kamion={kamion} onSave={handleRampSave} />
                        <select
                          aria-label={`Status za ${kamion.registracija}`}
                          value={kamion.status}
                          onChange={(e) =>
                            handleStatusChange(kamion.id, e.target.value as Kamion['status'])
                          }
                          className="ui-input sm:w-52"
                        >
                          <option value="Dostupan">Dostupan</option>
                          <option value="U procesu utovara">U procesu utovara</option>
                          <option value="Utovaren">Utovaren</option>
                          <option value="Otpremljen">Otpremljen</option>
                          <option value="Na servisu">Na servisu</option>
                        </select>
                        <button type="button" onClick={() => handleRemoveTruck(kamion.id)} className="ui-btn ui-btn-danger">
                          Ukloni
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

function RampField({
  kamion,
  onSave,
}: {
  kamion: Kamion;
  onSave: (kamionId: number, rampa: string) => Promise<void>;
}) {
  const [value, setValue] = useState(kamion.rampa ?? '');
  const latest = useRef(kamion.rampa ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    const next = kamion.rampa ?? '';
    if (timer.current) return;
    if (inputRef.current && document.activeElement === inputRef.current) return;
    latest.current = next;
    setValue(next);
  }, [kamion.rampa]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const commit = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const next = latest.current;
    if (next === (kamion.rampa ?? '')) return;
    onSaveRef.current(kamion.id, next);
  };

  const schedule = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(commit, 400);
  };

  return (
    <input
      ref={inputRef}
      aria-label={`Rampa za ${kamion.registracija}`}
      inputMode="numeric"
      placeholder="Rampa"
      value={value}
      onChange={(event) => {
        const next = event.target.value.replace(/\D/g, '').slice(0, 4);
        latest.current = next;
        setValue(next);
        schedule();
      }}
      onBlur={commit}
      className="ui-input w-24"
    />
  );
}

export default SkladistarDashboard;