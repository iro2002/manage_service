import express from 'express';
import pool from '../db.js';
import auth from '../middleware/auth.js';
import { sendAssignmentEmail } from '../emailService.js';

const router = express.Router();

// GET /api/laptops/check-unique
router.get('/check-unique', auth, async (req, res) => {
  try {
    const { field, value, excludeId } = req.query;
    if (!value || value.trim() === '') return res.json({ unique: true });

    let query = `SELECT * FROM laptops WHERE ${field} = ?`;
    const params = [value.trim()];

    if (excludeId && excludeId !== 'null' && excludeId !== 'undefined') {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) return res.json({ unique: true });
    return res.json({
      unique: false,
      field,
      conflictingModel: rows[0].model || 'another laptop'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/laptops
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM laptops ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/laptops/:id/history
router.get('/:id/history', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM laptop_history WHERE laptopId = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/laptops
router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { model, serialNo, dateOfDelivery, vendorName, comments, performedBy, hrRefNumber, ratePerMonth } = req.body;
    const status = 'Available';
    const actionDate = dateOfDelivery || new Date().toISOString().split('T')[0];

    const [result] = await connection.query(
      `INSERT INTO laptops (model, serialNo, status, currentUserName, handoverDate, department, comments, dateOfDelivery, vendorName, hrRefNumber, ratePerMonth)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [model, serialNo, status, '', '', '', comments || '', dateOfDelivery || '', vendorName || '', hrRefNumber || '', ratePerMonth || 0]
    );

    const laptopId = result.insertId;

    await connection.query(
      `INSERT INTO laptop_history (laptopId, laptopModel, serialNo, action, fromUser, toUser, department, actionDate, comments, performedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [laptopId, model, serialNo, 'Added', '', '', '', actionDate, comments || '', performedBy || req.user.email]
    );

    await connection.commit();
    res.json({ id: laptopId, msg: 'Laptop added' });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

// PUT /api/laptops/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const fields = req.body;
    if (Object.keys(fields).length === 0) return res.status(400).json({ msg: 'No fields to update' });

    const setClause = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(req.params.id);

    await pool.query(`UPDATE laptops SET ${setClause} WHERE id = ?`, values);
    res.json({ msg: 'Laptop updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/laptops/:id/assign
router.post('/:id/assign', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { laptop, assignData, performedBy } = req.body;

    await connection.query(
      `UPDATE laptops SET status = ?, currentUserName = ?, handoverDate = ?, department = ?, comments = ? WHERE id = ?`,
      ['Assigned', assignData.userName, assignData.handoverDate, assignData.department, assignData.comments || '', req.params.id]
    );

    // When laptop is "With MS", currentUserName is empty — show 'Manage Service' as source
    const assignFromUser = laptop.currentUserName && laptop.currentUserName.trim()
      ? laptop.currentUserName
      : 'Manage Service';

    await connection.query(
      `INSERT INTO laptop_history (laptopId, laptopModel, serialNo, action, fromUser, toUser, department, actionDate, comments, performedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, laptop.model, laptop.serialNo, 'Assigned', assignFromUser, assignData.userName, assignData.department, assignData.handoverDate, assignData.comments || '', performedBy || req.user.email]
    );

    await connection.commit();

    // Send assignment email to employee (non-blocking — don't fail the request if email fails)
    if (assignData.userEmail) {
      sendAssignmentEmail({
        toEmail:     assignData.userEmail,
        userName:    assignData.userName,
        model:       laptop.model,
        serialNo:    laptop.serialNo,
        hrRefNumber: laptop.hrRefNumber,
        handoverDate: assignData.handoverDate,
        department:  assignData.department,
        performedBy: performedBy || req.user.email,
      }).catch((err) => console.error('[Email] Failed to send assignment email:', err.message));
    }

    res.json({ msg: 'Laptop assigned' });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

// POST /api/laptops/:id/return-ms
router.post('/:id/return-ms', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { laptop, returnData, performedBy } = req.body;

    await connection.query(
      `UPDATE laptops SET status = ?, currentUserName = ?, handoverDate = ?, department = ?, comments = ? WHERE id = ?`,
      ['With MS', '', '', '', returnData.comments || '', req.params.id]
    );

    await connection.query(
      `INSERT INTO laptop_history (laptopId, laptopModel, serialNo, action, fromUser, toUser, department, actionDate, comments, performedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, laptop.model, laptop.serialNo, 'Returned to MS', laptop.currentUserName, 'Manage Service', '', returnData.returnDate, returnData.comments || '', performedBy || req.user.email]
    );

    await connection.commit();
    res.json({ msg: 'Laptop returned to MS' });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

// POST /api/laptops/:id/return-vendor
router.post('/:id/return-vendor', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { laptop, returnData, performedBy } = req.body;

    await connection.query(
      `UPDATE laptops SET status = ?, currentUserName = ?, handoverDate = ?, department = ?, comments = ? WHERE id = ?`,
      ['Returned to Vendor', '', '', '', returnData.comments || '', req.params.id]
    );

    // If currentUserName is empty, laptop was held by Manage Service
    const fromUser = laptop.currentUserName && laptop.currentUserName.trim()
      ? laptop.currentUserName
      : 'Manage Service';

    await connection.query(
      `INSERT INTO laptop_history (laptopId, laptopModel, serialNo, action, fromUser, toUser, department, actionDate, comments, performedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, laptop.model, laptop.serialNo, 'Returned to Vendor', fromUser, laptop.vendorName || 'Vendor', '', returnData.returnDate, returnData.comments || '', performedBy || req.user.email]
    );

    await connection.commit();
    res.json({ msg: 'Laptop returned to Vendor' });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

export default router;
