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