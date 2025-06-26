const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3058;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'bonus_proposals',
  password: 'admin123',
  port: 5432,
});

// Get all bonus proposals
app.get('/api/bonuses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bonus_proposals ORDER BY proposal_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get bonus proposal by name and ID
app.get('/api/bonuses/search', async (req, res) => {
  const { employeeName, employeeID } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM bonus_proposals WHERE LOWER(employee_name) = LOWER($1) AND employee_id = $2',
      [employeeName, employeeID]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No matching bonus proposals found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new bonus proposal
app.post('/api/bonuses', async (req, res) => {
  const { employeeName, employeeID, proposalDate, bonusAmount, reason } = req.body;
  try {
    // Check for duplicate employee ID
    const checkResult = await pool.query(
      'SELECT 1 FROM bonus_proposals WHERE employee_id = $1',
      [employeeID]
    );
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Employee ID has already been submitted' });
    }

    const result = await pool.query(
      'INSERT INTO bonus_proposals (employee_name, employee_id, proposal_date, bonus_amount, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employeeName, employeeID, proposalDate, bonusAmount, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize database with sample data
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bonus_proposals (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(100) NOT NULL,
        employee_id VARCHAR(7) NOT NULL UNIQUE,
        proposal_date DATE NOT NULL,
        bonus_amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        CONSTRAINT valid_employee_id CHECK (employee_id ~ '^ATS0(?!000)[0-9]{3}$'),
        CONSTRAINT valid_bonus_amount CHECK (bonus_amount >= 100)
      )
    `);

    // Insert sample data if table is empty
    const countResult = await pool.query('SELECT COUNT(*) FROM bonus_proposals');
    if (parseInt(countResult.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO bonus_proposals (employee_name, employee_id, proposal_date, bonus_amount, reason) VALUES
        ('Veera Raghava', 'ATS0123', '2025-04-24', 5000, 'Bonus for good performance and exceeding quarterly targets by 15% while maintaining excellent code quality standards.'),
        ('Pavan Kumar', 'ATS0456', '2025-04-20', 7500, 'Exceptional leadership in the recent product launch, coordinating between multiple teams to deliver ahead of schedule with outstanding results.');
      `);
    }
  } catch (err) {
    console.error('Error initializing database:', err.stack);
  }
}

// Start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://56.228.30.32:${port}`);
  });
});