// app/api/add-truck/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../lib/db';

export async function POST(request: NextRequest) {
  const { kamionId, skladisteId } = await request.json();

  if (!kamionId || !skladisteId) {
    return NextResponse.json({ error: 'kamionId and skladisteId are required' }, { status: 400 });
  }

  const connection = await getConnection();

  try {
    await connection.execute(
      'INSERT INTO KamioniNaSkladistu (kamion_id, skladiste_id) VALUES (?, ?)',
      [kamionId, skladisteId]
    );

    return NextResponse.json({ message: 'Truck added successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error adding truck to warehouse:', error);
    return NextResponse.json({ error: 'Failed to add truck to warehouse' }, { status: 500 });
  } finally {
    connection.end();
  }
}