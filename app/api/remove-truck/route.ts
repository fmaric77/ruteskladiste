// app/api/remove-truck/route.ts

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
      'DELETE FROM KamioniNaSkladistu WHERE kamion_id = ? AND skladiste_id = ?',
      [kamionId, skladisteId]
    );

    return NextResponse.json({ message: 'Truck removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error removing truck from warehouse:', error);
    return NextResponse.json({ error: 'Failed to remove truck from warehouse' }, { status: 500 });
  } finally {
    connection.end();
  }
}