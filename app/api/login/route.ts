// app/api/login/route.ts

import { NextResponse } from 'next/server';
import { getConnection } from '../../lib/db'; // Adjust the import path as necessary
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  const { nazivSkladista, password } = await req.json();
  if (!nazivSkladista || !password) {
    return NextResponse.json({ message: 'Naziv skladišta i lozinka su obavezni' }, { status: 400 });
  }
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM Skladista WHERE naziv_skladista = ?', [nazivSkladista]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ message: 'Neispravan naziv skladišta ili lozinka' }, { status: 401 });
    }
    const skladiste = (rows as RowDataPacket[])[0];
    const isPasswordValid = await bcrypt.compare(password, skladiste.lozinka_skladista);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Neispravan naziv skladišta ili lozinka' }, { status: 401 });
    }
    return NextResponse.json({ skladiste });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    connection.end();
  }
}