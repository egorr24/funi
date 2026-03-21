const express = require('express');
const { pool } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initiate call
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { recipientId, callType = 'video' } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (!['video', 'audio'].includes(callType)) {
      return res.status(400).json({ error: 'Invalid call type' });
    }

    const query = `
      INSERT INTO calls (caller_id, callee_id, call_type, status, started_at)
      VALUES ($1, $2, $3, 'initiated', CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await pool.query(query, [req.user.id, recipientId, callType]);
    const call = result.rows[0];

    // Emit call notification via socket.io
    req.app.get('io')?.to(recipientId).emit('incoming_call', {
      callId: call.id,
      callerId: req.user.id,
      callerName: req.user.display_name,
      callerAvatar: req.user.avatar_url,
      callType,
      initiatedAt: call.started_at
    });

    res.status(201).json({
      message: 'Call initiated',
      call: {
        id: call.id,
        callerId: call.caller_id,
        calleeId: call.callee_id,
        callType: call.call_type,
        status: call.status,
        startedAt: call.started_at
      }
    });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Answer call
router.put('/:callId/answer', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;

    const query = `
      UPDATE calls 
      SET status = 'answered', started_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND callee_id = $2 AND status = 'initiated'
      RETURNING *
    `;

    const result = await pool.query(query, [callId, req.user.id]);
    const call = result.rows[0];

    if (!call) {
      return res.status(404).json({ error: 'Call not found or already answered' });
    }

    // Emit call answered notification via socket.io
    req.app.get('io')?.to(call.caller_id.toString()).emit('call_answered', {
      callId: call.id,
      calleeId: req.user.id,
      calleeName: req.user.display_name,
      answeredAt: call.started_at
    });

    res.json({
      message: 'Call answered',
      call: {
        id: call.id,
        status: call.status,
        startedAt: call.started_at
      }
    });
  } catch (error) {
    console.error('Answer call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End call
router.put('/:callId/end', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;

    const query = `
      UPDATE calls 
      SET status = 'ended', ended_at = CURRENT_TIMESTAMP,
          duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER
      WHERE id = $1 AND (caller_id = $2 OR callee_id = $2) AND status != 'ended'
      RETURNING *
    `;

    const result = await pool.query(query, [callId, req.user.id]);
    const call = result.rows[0];

    if (!call) {
      return res.status(404).json({ error: 'Call not found or already ended' });
    }

    // Notify other participant
    const otherParticipantId = call.caller_id === req.user.id ? call.callee_id : call.caller_id;
    req.app.get('io')?.to(otherParticipantId.toString()).emit('call_ended', {
      callId: call.id,
      endedBy: req.user.id,
      duration: call.duration,
      endedAt: call.ended_at
    });

    res.json({
      message: 'Call ended',
      call: {
        id: call.id,
        status: call.status,
        duration: call.duration,
        endedAt: call.ended_at
      }
    });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get call history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT c.*,
             u1.display_name as caller_name,
             u1.avatar_url as caller_avatar,
             u2.display_name as callee_name,
             u2.avatar_url as callee_avatar
      FROM calls c
      JOIN users u1 ON c.caller_id = u1.id
      JOIN users u2 ON c.callee_id = u2.id
      WHERE c.caller_id = $1 OR c.callee_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [req.user.id, limit, offset]);
    res.json({ calls: result.rows });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active calls
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT c.*,
             u1.display_name as caller_name,
             u1.avatar_url as caller_avatar,
             u2.display_name as callee_name,
             u2.avatar_url as callee_avatar
      FROM calls c
      JOIN users u1 ON c.caller_id = u1.id
      JOIN users u2 ON c.callee_id = u2.id
      WHERE (c.caller_id = $1 OR c.callee_id = $1)
      AND c.status IN ('initiated', 'answered')
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, [req.user.id]);
    res.json({ activeCalls: result.rows });
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
