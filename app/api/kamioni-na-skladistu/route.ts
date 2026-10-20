// app/api/kamioni-na-skladistu/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../lib/db';
import { ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skladisteId = searchParams.get('skladiste_id');

  if (!skladisteId) {
    return NextResponse.json({ error: 'skladiste_id is required' }, { status: 400 });
  }

  const connection = await getConnection();

  try {
    const [rows] = await connection.execute(
      `
      SELECT k.*, ks.rampa
      FROM Kamioni k
      JOIN KamioniNaSkladistu ks ON k.id = ks.kamion_id
      WHERE ks.skladiste_id = ?
      `,
      [skladisteId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching trucks assigned to warehouse:', error);
    return NextResponse.json({ error: 'Failed to fetch trucks assigned to warehouse' }, { status: 500 });
  } finally {
    connection.end();
  }
}

export async function PUT(request: NextRequest) {
  const { kamionId, skladisteId, rampa } = await request.json();

  if (!kamionId || !skladisteId) {
    return NextResponse.json({ error: 'kamionId and skladisteId are required' }, { status: 400 });
  }

  const value = rampa === null || rampa === undefined || String(rampa).trim() === ''
    ? null
    : String(rampa).trim();

  if (value !== null && !/^\d{1,4}$/.test(value)) {
    return NextResponse.json({ error: 'Broj rampe mora biti broj od 1 do 4 znamenke.' }, { status: 400 });
  }

  const connection = await getConnection();

  try {
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE KamioniNaSkladistu SET rampa = ? WHERE kamion_id = ? AND skladiste_id = ?',
      [value, kamionId, skladisteId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Kamion nije na ovom skladištu.' }, { status: 404 });
    }

    return NextResponse.json({ rampa: value });
  } catch (error) {
    console.error('Error updating ramp:', error);
    return NextResponse.json({ error: 'Failed to update ramp' }, { status: 500 });
  } finally {
    connection.end();
  }
}