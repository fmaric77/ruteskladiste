"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [nazivSkladista, setNazivSkladista] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nazivSkladista || !password) {
      setError('Naziv skladišta i lozinka su obavezni');
      return;
    }

    try {
      console.log('Sl zahtjeva za prijavu:', { nazivSkladista, password });

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nazivSkladista, password }),
      });

      const data = await res.json();

      console.log('Primljen odgovor:', data);

      if (!res.ok) {
        throw new Error(data.message);
      }

      // Pohrani informacije o skladištu u lokalnu pohranu
      localStorage.setItem('skladiste', JSON.stringify(data.skladiste));

      // Preusmjeri na skladišnu ploču
      router.push('/skladistar'); // Prilagodite putanju do vaše skladišne ploče
    } catch (error) {
      console.error('Greška pri prijavi:', error);
      setError((error as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="ui-card w-full max-w-md p-8">
        <p className="ui-kicker">Skladište</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Prijava skladišta</h1>
        <p className="mt-2 text-sm text-slate-400">Unesite naziv skladišta i lozinku za pregled kamiona.</p>
        {error && (
          <p className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nazivSkladista" className="ui-label">Naziv skladišta</label>
            <input
              type="text"
              id="nazivSkladista"
              className="ui-input"
              value={nazivSkladista}
              onChange={(e) => setNazivSkladista(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="ui-label">Lozinka</label>
            <input
              type="password"
              id="password"
              className="ui-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ui-btn ui-btn-primary mt-2 w-full">
            Prijava
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;