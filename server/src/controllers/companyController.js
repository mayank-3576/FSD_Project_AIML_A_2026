import { query } from '../db/db.js';

export async function getCompanies(req, res) {
  try {
    const { tier, q } = req.query;

    let sql = `
      SELECT 
        c.*,
        COUNT(DISTINCT pd.drive_id) as total_drives,
        COUNT(DISTINCT CASE WHEN app.status = 'Selected' THEN app.application_id END) as total_hired
      FROM companies c
      LEFT JOIN placement_drives pd ON c.company_id = pd.company_id
      LEFT JOIN applications app ON pd.drive_id = app.drive_id
      WHERE 1=1
    `;

    const params = [];
    let paramIdx = 1;

    if (tier && tier !== 'All') {
      sql += ` AND c.hiring_tier = $${paramIdx++}`;
      params.push(tier);
    }

    if (q) {
      sql += ` AND (c.company_name LIKE $${paramIdx} OR c.industry_sector LIKE $${paramIdx} OR c.location LIKE $${paramIdx})`;
      params.push(`%${q}%`);
      paramIdx++;
    }

    sql += ` GROUP BY c.company_id ORDER BY c.company_name ASC`;

    const result = await query(sql, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      companies: result.rows,
    });
  } catch (err) {
    console.error('getCompanies error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving companies' });
  }
}

export async function createCompany(req, res) {
  try {
    const {
      company_name,
      industry_sector,
      location,
      website,
      hr_name,
      hr_email,
      hr_phone,
      hiring_tier = 'Standard',
    } = req.body;

    if (!company_name || !industry_sector || !location) {
      return res.status(400).json({
        success: false,
        message: 'Company name, industry sector, and location are required',
      });
    }

    await query(
      `INSERT INTO companies 
       (company_name, industry_sector, location, website, hr_name, hr_email, hr_phone, hiring_tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        company_name.trim(),
        industry_sector.trim(),
        location.trim(),
        website || null,
        hr_name || null,
        hr_email || null,
        hr_phone || null,
        hiring_tier,
      ]
    );

    const compRes = await query(
      'SELECT * FROM companies WHERE company_name = $1 ORDER BY company_id DESC LIMIT 1',
      [company_name.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      company: compRes.rows[0],
    });
  } catch (err) {
    console.error('createCompany error:', err);
    return res.status(500).json({ success: false, message: 'Server error registering company' });
  }
}

export async function updateCompany(req, res) {
  try {
    const companyId = req.params.id;
    const {
      company_name,
      industry_sector,
      location,
      website,
      hr_name,
      hr_email,
      hr_phone,
      hiring_tier,
    } = req.body;

    const existing = await query('SELECT * FROM companies WHERE company_id = $1', [companyId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    await query(
      `UPDATE companies SET
        company_name = COALESCE($1, company_name),
        industry_sector = COALESCE($2, industry_sector),
        location = COALESCE($3, location),
        website = COALESCE($4, website),
        hr_name = COALESCE($5, hr_name),
        hr_email = COALESCE($6, hr_email),
        hr_phone = COALESCE($7, hr_phone),
        hiring_tier = COALESCE($8, hiring_tier)
       WHERE company_id = $9`,
      [
        company_name,
        industry_sector,
        location,
        website,
        hr_name,
        hr_email,
        hr_phone,
        hiring_tier,
        companyId,
      ]
    );

    const updated = await query('SELECT * FROM companies WHERE company_id = $1', [companyId]);

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      company: updated.rows[0],
    });
  } catch (err) {
    console.error('updateCompany error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating company' });
  }
}

export async function deleteCompany(req, res) {
  try {
    const companyId = req.params.id;
    const existing = await query('SELECT * FROM companies WHERE company_id = $1', [companyId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    await query('DELETE FROM companies WHERE company_id = $1', [companyId]);

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (err) {
    console.error('deleteCompany error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting company' });
  }
}

export default {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
};
