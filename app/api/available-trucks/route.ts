// app/api/available-trucks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../lib/db';

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
      SELECT k.*
      FROM Kamioni k
      LEFT JOIN KamioniNaSkladistu ks ON k.id = ks.kamion_id
      WHERE ks.kamion_id IS NULL
      `
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching available trucks:', error);
    return NextResponse.json({ error: 'Failed to fetch available trucks' }, { status: 500 });
  } finally {
    connection.end();
  }
}