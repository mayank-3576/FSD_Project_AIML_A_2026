import { query } from '../db/db.js';

export async function getSummary(req, res) {
  try {
    // 1. Total students
    const totalStudentsRes = await query('SELECT COUNT(*) as count FROM student_profiles');
    const totalStudents = parseInt(totalStudentsRes.rows[0].count || 0, 10);

    // 2. Placed students (students with at least one application with status 'Selected')
    const placedStudentsRes = await query(
      `SELECT COUNT(DISTINCT student_id) as count 
       FROM applications 
       WHERE status = 'Selected'`
    );
    const placedStudents = parseInt(placedStudentsRes.rows[0].count || 0, 10);
    const unplacedStudents = Math.max(0, totalStudents - placedStudents);
    const placementPercentage =
      totalStudents > 0 ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

    // 3. Highest & Average CTC of selected offers
    const ctcStatsRes = await query(
      `SELECT 
        MAX(pd.ctc_lpa) as highest_ctc,
        AVG(pd.ctc_lpa) as avg_ctc,
        COUNT(app.application_id) as total_offers
       FROM applications app
       JOIN placement_drives pd ON app.drive_id = pd.drive_id
       WHERE app.status = 'Selected'`
    );
    const highestCtc = parseFloat(ctcStatsRes.rows[0].highest_ctc || 0);
    const avgCtc = parseFloat(parseFloat(ctcStatsRes.rows[0].avg_ctc || 0).toFixed(2));
    const totalOffers = parseInt(ctcStatsRes.rows[0].total_offers || 0, 10);

    // 4. Partner companies
    const companiesRes = await query('SELECT COUNT(*) as count FROM companies');
    const partnerCompanies = parseInt(companiesRes.rows[0].count || 0, 10);

    // 5. Active drives
    const activeDrivesRes = await query("SELECT COUNT(*) as count FROM placement_drives WHERE status = 'Open'");
    const activeDrives = parseInt(activeDrivesRes.rows[0].count || 0, 10);

    // 6. Branch-wise placement statistics
    const branchStatsRes = await query(`
      SELECT 
        sp.branch,
        COUNT(DISTINCT sp.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN app.status = 'Selected' THEN sp.student_id END) as placed_students
      FROM student_profiles sp
      LEFT JOIN applications app ON sp.student_id = app.student_id
      GROUP BY sp.branch
      ORDER BY total_students DESC
    `);

    const branchWiseStats = branchStatsRes.rows.map((r) => {
      const total = parseInt(r.total_students || 0, 10);
      const placed = parseInt(r.placed_students || 0, 10);
      const pct = total > 0 ? parseFloat(((placed / total) * 100).toFixed(1)) : 0;
      return {
        branch: r.branch,
        total,
        placed,
        unplaced: total - placed,
        percentage: pct,
      };
    });

    // 7. Company-wise hiring count
    const companyHiresRes = await query(`
      SELECT 
        c.company_name as company,
        c.hiring_tier,
        COUNT(app.application_id) as hires,
        AVG(pd.ctc_lpa) as avg_ctc
      FROM applications app
      JOIN placement_drives pd ON app.drive_id = pd.drive_id
      JOIN companies c ON pd.company_id = c.company_id
      WHERE app.status = 'Selected'
      GROUP BY c.company_name, c.hiring_tier
      ORDER BY hires DESC, avg_ctc DESC
    `);

    const companyHires = companyHiresRes.rows.map((r) => ({
      company: r.company,
      hiring_tier: r.hiring_tier,
      hires: parseInt(r.hires || 0, 10),
      avg_ctc: parseFloat(parseFloat(r.avg_ctc || 0).toFixed(2)),
    }));

    // 8. CTC Tier distribution of drives and offers
    const tierStatsRes = await query(`
      SELECT 
        c.hiring_tier as tier,
        COUNT(DISTINCT pd.drive_id) as drives_count,
        COUNT(DISTINCT CASE WHEN app.status = 'Selected' THEN app.application_id END) as offers_count
      FROM companies c
      LEFT JOIN placement_drives pd ON c.company_id = pd.company_id
      LEFT JOIN applications app ON pd.drive_id = app.drive_id
      GROUP BY c.hiring_tier
    `);

    const tierDistribution = tierStatsRes.rows.map((r) => ({
      tier: r.tier,
      drives_count: parseInt(r.drives_count || 0, 10),
      offers_count: parseInt(r.offers_count || 0, 10),
    }));

    // 9. Pipeline stages summary
    const stagesRes = await query(`
      SELECT 
        current_round,
        COUNT(*) as count
      FROM applications
      GROUP BY current_round
      ORDER BY count DESC
    `);

    return res.status(200).json({
      success: true,
      college: {
        code: '032',
        name: 'ABES Engineering College',
        location: 'Ghaziabad, Uttar Pradesh',
      },
      kpi: {
        totalStudents,
        placedStudents,
        unplacedStudents,
        placementPercentage,
        highestCtc,
        avgCtc,
        totalOffers,
        partnerCompanies,
        activeDrives,
      },
      branchWiseStats,
      companyHires,
      tierDistribution,
      stageDistribution: stagesRes.rows,
    });
  } catch (err) {
    console.error('getSummary analytics error:', err);
    return res.status(500).json({ success: false, message: 'Server error compiling placement analytics' });
  }
}

export default {
  getSummary,
};
