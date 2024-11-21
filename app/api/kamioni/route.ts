// app/api/kamioni/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../lib/db';

/**
 * Handle Kamioni operations
 */

// GET all Kamioni
export async function GET(request: NextRequest) {
  const connection = await getConnection();

  try {
    const [rows] = await connection.execute('SELECT * FROM Kamioni');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching Kamioni:', error);
    return NextResponse.json({ error: 'Failed to fetch Kamioni' }, { status: 500 });
  } finally {
    connection.end();
  }
}

// PUT update Kamion status
export async function PUT(request: NextRequest) {
  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const allowedStatuses = ['Dostupan', 'U procesu utovara', 'Utovaren', 'Otpremljen', 'Na servisu'];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const connection = await getConnection();

  try {
    const [result] = await connection.execute(
      'UPDATE Kamioni SET status = ? WHERE id = ?',
      [status, id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Kamion not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Kamion status updated successfully' });
  } catch (error) {
    console.error('Error updating Kamion status:', error);
    return NextResponse.json({ error: 'Failed to update Kamion status' }, { status: 500 });
  } finally {
    connection.end();
  }
}