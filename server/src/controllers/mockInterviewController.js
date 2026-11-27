import { query } from '../db/index.js';

export async function getSlots(req, res) {
  try {
    const studentId = req.user?.studentId;

    const slotsRes = await query(
      `SELECT mis.*, u.name as creator_name 
       FROM mock_interview_slots mis 
       LEFT JOIN users u ON mis.created_by = u.user_id 
       ORDER BY mis.scheduled_at ASC`
    );

    let bookedSlotIds = new Set();
    if (studentId) {
      const myBookings = await query(
        `SELECT slot_id, booking_id, status FROM mock_interview_bookings WHERE student_id = $1`,
        [studentId]
      );
      myBookings.rows.forEach((b) => {
        if (b.status !== 'Cancelled') {
          bookedSlotIds.add(b.slot_id);
        }
      });
    }

    const slots = slotsRes.rows.map((slot) => ({
      ...slot,
      is_booked_by_me: bookedSlotIds.has(slot.slot_id),
      available_seats: Math.max(0, slot.capacity - slot.booked_count),
      is_full: slot.booked_count >= slot.capacity,
    }));

    return res.status(200).json({ success: true, slots });
  } catch (err) {
    console.error('getSlots error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving mock slots' });
  }
}

export async function createSlot(req, res) {
  try {
    const {
      title,
      track = 'Full-Stack Technical',
      interviewer_name = 'ABES TPO Senior Panelist',
      scheduled_at,
      duration_minutes = 45,
      meeting_link_or_room = 'TPO Interview Lab B-204',
      capacity = 5,
    } = req.body;

    if (!title || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: 'Title and scheduled time are required',
      });
    }

    await query(
      `INSERT INTO mock_interview_slots 
       (title, track, interviewer_name, scheduled_at, duration_minutes, meeting_link_or_room, capacity, booked_count, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'Upcoming', $8)`,
      [
        title.trim(),
        track.trim(),
        interviewer_name.trim(),
        scheduled_at,
        parseInt(duration_minutes, 10) || 45,
        meeting_link_or_room.trim(),
        parseInt(capacity, 10) || 5,
        req.user.userId,
      ]
    );

    const createdRes = await query(
      'SELECT * FROM mock_interview_slots ORDER BY slot_id DESC LIMIT 1'
    );

    return res.status(201).json({
      success: true,
      message: 'Mock interview slot created successfully',
      slot: createdRes.rows[0],
    });
  } catch (err) {
    console.error('createSlot error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating mock slot' });
  }
}

export async function updateSlot(req, res) {
  try {
    const slotId = req.params.id;
    const {
      title,
      track,
      interviewer_name,
      scheduled_at,
      duration_minutes,
      meeting_link_or_room,
      capacity,
      status,
    } = req.body;

    await query(
      `UPDATE mock_interview_slots 
       SET title = COALESCE($1, title),
           track = COALESCE($2, track),
           interviewer_name = COALESCE($3, interviewer_name),
           scheduled_at = COALESCE($4, scheduled_at),
           duration_minutes = COALESCE($5, duration_minutes),
           meeting_link_or_room = COALESCE($6, meeting_link_or_room),
           capacity = COALESCE($7, capacity),
           status = COALESCE($8, status)
       WHERE slot_id = $9`,
      [
        title,
        track,
        interviewer_name,
        scheduled_at,
        duration_minutes ? parseInt(duration_minutes, 10) : null,
        meeting_link_or_room,
        capacity ? parseInt(capacity, 10) : null,
        status,
        slotId,
      ]
    );

    const updatedRes = await query('SELECT * FROM mock_interview_slots WHERE slot_id = $1', [slotId]);
    return res.status(200).json({
      success: true,
      message: 'Slot updated successfully',
      slot: updatedRes.rows[0],
    });
  } catch (err) {
    console.error('updateSlot error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating mock slot' });
  }
}

export async function deleteSlot(req, res) {
  try {
    const slotId = req.params.id;
    await query('DELETE FROM mock_interview_slots WHERE slot_id = $1', [slotId]);
    return res.status(200).json({ success: true, message: 'Mock interview slot deleted' });
  } catch (err) {
    console.error('deleteSlot error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting mock slot' });
  }
}

export async function bookSlot(req, res) {
  try {
    const slotId = req.params.id;
    const studentId = req.user?.studentId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student profile required to book an interview slot',
      });
    }

    // Check slot existence & capacity
    const slotRes = await query('SELECT * FROM mock_interview_slots WHERE slot_id = $1', [slotId]);
    if (slotRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    const slot = slotRes.rows[0];

    if (slot.status !== 'Upcoming') {
      return res.status(400).json({
        success: false,
        message: `This slot is marked as ${slot.status} and cannot be booked`,
      });
    }

    if (slot.booked_count >= slot.capacity) {
      return res.status(400).json({
        success: false,
        message: 'This mock interview slot is fully booked',
      });
    }

    // Check duplicate
    const checkRes = await query(
      'SELECT * FROM mock_interview_bookings WHERE slot_id = $1 AND student_id = $2',
      [slotId, studentId]
    );

    if (checkRes.rows.length > 0) {
      const existing = checkRes.rows[0];
      if (existing.status !== 'Cancelled') {
        return res.status(409).json({
          success: false,
          message: 'You have already booked a seat in this mock session',
        });
      } else {
        // Re-activate cancelled booking
        await query(
          "UPDATE mock_interview_bookings SET status = 'Booked' WHERE booking_id = $1",
          [existing.booking_id]
        );
        await query(
          'UPDATE mock_interview_slots SET booked_count = booked_count + 1 WHERE slot_id = $1',
          [slotId]
        );
        return res.status(200).json({
          success: true,
          message: 'Seat successfully re-booked!',
        });
      }
    }

    // Insert new booking
    await query(
      `INSERT INTO mock_interview_bookings (slot_id, student_id, status) VALUES ($1, $2, 'Booked')`,
      [slotId, studentId]
    );

    await query(
      'UPDATE mock_interview_slots SET booked_count = booked_count + 1 WHERE slot_id = $1',
      [slotId]
    );

    return res.status(201).json({
      success: true,
      message: 'Mock interview seat reserved successfully!',
    });
  } catch (err) {
    console.error('bookSlot error:', err);
    return res.status(500).json({ success: false, message: 'Server error booking slot' });
  }
}

export async function cancelBooking(req, res) {
  try {
    const slotId = req.params.id;
    const studentId = req.user?.studentId;

    const bookingRes = await query(
      'SELECT * FROM mock_interview_bookings WHERE slot_id = $1 AND student_id = $2 AND status = $3',
      [slotId, studentId, 'Booked']
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Active booking not found' });
    }

    await query(
      "UPDATE mock_interview_bookings SET status = 'Cancelled' WHERE booking_id = $1",
      [bookingRes.rows[0].booking_id]
    );

    await query(
      'UPDATE mock_interview_slots SET booked_count = MAX(0, booked_count - 1) WHERE slot_id = $1',
      [slotId]
    );

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (err) {
    console.error('cancelBooking error:', err);
    return res.status(500).json({ success: false, message: 'Server error cancelling booking' });
  }
}

export async function getMyBookings(req, res) {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      return res.status(200).json({ success: true, bookings: [] });
    }

    const result = await query(
      `SELECT 
        mib.*,
        mis.title,
        mis.track,
        mis.interviewer_name,
        mis.scheduled_at,
        mis.duration_minutes,
        mis.meeting_link_or_room,
        mis.status as slot_status
       FROM mock_interview_bookings mib
       JOIN mock_interview_slots mis ON mib.slot_id = mis.slot_id
       WHERE mib.student_id = $1
       ORDER BY mis.scheduled_at DESC`,
      [studentId]
    );

    return res.status(200).json({ success: true, bookings: result.rows });
  } catch (err) {
    console.error('getMyBookings error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving your bookings' });
  }
}

export async function getAllBookings(req, res) {
  try {
    const result = await query(
      `SELECT 
        mib.*,
        mis.title as slot_title,
        mis.track as slot_track,
        mis.scheduled_at,
        mis.interviewer_name,
        u.name as student_name,
        u.email as student_email,
        sp.roll_no,
        sp.branch,
        sp.cgpa
       FROM mock_interview_bookings mib
       JOIN mock_interview_slots mis ON mib.slot_id = mis.slot_id
       JOIN student_profiles sp ON mib.student_id = sp.student_id
       JOIN users u ON sp.user_id = u.user_id
       ORDER BY mis.scheduled_at DESC`
    );

    return res.status(200).json({ success: true, bookings: result.rows });
  } catch (err) {
    console.error('getAllBookings error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving all bookings' });
  }
}

export async function evaluateBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const {
      dsa_score = 0,
      core_cs_score = 0,
      project_defense_score = 0,
      communication_score = 0,
      readiness_verdict = 'Ready',
      strengths = '',
      action_items = '',
    } = req.body;

    const bookingRes = await query(
      'SELECT * FROM mock_interview_bookings WHERE booking_id = $1',
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    await query(
      `UPDATE mock_interview_bookings 
       SET status = 'Completed',
           dsa_score = $1,
           core_cs_score = $2,
           project_defense_score = $3,
           communication_score = $4,
           readiness_verdict = $5,
           strengths = $6,
           action_items = $7,
           evaluated_by = $8,
           evaluated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $9`,
      [
        parseFloat(dsa_score),
        parseFloat(core_cs_score),
        parseFloat(project_defense_score),
        parseFloat(communication_score),
        readiness_verdict,
        strengths,
        action_items,
        req.user.userId,
        bookingId,
      ]
    );

    // Update student's training_scores table
    const avgScore = (
      (parseFloat(dsa_score) +
        parseFloat(core_cs_score) +
        parseFloat(project_defense_score) +
        parseFloat(communication_score)) /
      4
    ).toFixed(1);

    await query(
      `UPDATE training_scores 
       SET dsa_score = $1, 
           mock_interview_remarks = $2, 
           readiness_verdict = $3, 
           evaluated_by = $4, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE student_id = $5`,
      [
        parseFloat(dsa_score),
        `Mock Score: ${avgScore}/100. Verdict: ${readiness_verdict}. ${strengths ? 'Strengths: ' + strengths + '. ' : ''}${action_items ? 'Next steps: ' + action_items : ''}`,
        readiness_verdict,
        req.user.userId,
        booking.student_id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Mock interview evaluation saved successfully',
    });
  } catch (err) {
    console.error('evaluateBooking error:', err);
    return res.status(500).json({ success: false, message: 'Server error saving evaluation' });
  }
}

export default {
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  bookSlot,
  cancelBooking,
  getMyBookings,
  getAllBookings,
  evaluateBooking,
};
