import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../lib/db';
import { openTripSql } from '../../lib/openTrip';
import { RowDataPacket } from 'mysql2';

/**
 * Handle Kamioni operations
 */

// GET all Kamioni
export async function GET() {
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
    const [existing] = await connection.execute<RowDataPacket[]>(
      'SELECT status FROM Kamioni WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Kamion not found' }, { status: 404 });
    }
    if (existing[0].status === status) {
      return NextResponse.json({ message: 'Kamion status updated successfully' });
    }

    const [trips] = await connection.execute<RowDataPacket[]>(
      `SELECT p.id, DATE_FORMAT(p.datum, '%Y-%m-%d') AS dan, p.datum = CURDATE() AS danas,
              (
                SELECT d.dogadaj
                FROM Dogadaji d
                WHERE d.putovanje_id = p.id
                ORDER BY d.vrijeme DESC, d.id DESC
                LIMIT 1
              ) AS zadnji,
              (
                SELECT COUNT(*)
                FROM Dogadaji d
                WHERE d.putovanje_id = p.id AND d.dogadaj <> 'Dostupan'
              ) AS radnih
       FROM Putovanja p
       WHERE p.kamion_id = ?
         AND (p.datum = CURDATE() OR ${openTripSql})
       ORDER BY p.datum ASC, p.id ASC`,
      [id]
    );
    const open = new Set(['U procesu utovara', 'Utovaren', 'Otpremljen']);
    const finished = (row: RowDataPacket) => row.zadnji === 'Dostupan' && Number(row.radnih) > 0;
    const unfinished = [...trips].reverse().find((row) => open.has(row.zadnji));
    const todayTrip = trips.find((row) => Number(row.danas) === 1 && !finished(row));
    const startsNewLoad = status === 'U procesu utovara' || status === 'Utovaren';
    const trip = startsNewLoad && unfinished?.zadnji === 'Otpremljen'
      ? todayTrip
      : (unfinished ?? todayTrip);

    await connection.beginTransaction();
    await connection.execute(
      'UPDATE Kamioni SET status = ? WHERE id = ?',
      [status, id]
    );
    await connection.execute(
      `INSERT INTO Dogadaji (kamion_id, putovanje_id, putovanje_datum, dogadaj, vrijeme)
       VALUES (?, ?, COALESCE(?, CURDATE()), ?, NOW())`,
      [id, trip?.id ?? null, trip?.dan ?? null, status]
    );
    await connection.commit();

    return NextResponse.json({ message: 'Kamion status updated successfully', putovanjeId: trip?.id ?? null });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating Kamion status:', error);
    return NextResponse.json({ error: 'Failed to update Kamion status' }, { status: 500 });
  } finally {
    connection.end();
  }
}