import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { initDb, query } from './db.js';
import { runMigrations } from './migrate.js';

export const SAMPLE_RESUME_TEXT = `Raghav Bhatnagar
Email: student@abes.ac.in | Phone: +91 98765 43210 | Location: Ghaziabad, Uttar Pradesh
LinkedIn: https://linkedin.com/in/raghavbhatnagar | GitHub: https://github.com/raghavbhatnagar

Education:
ABES Engineering College (College Code: 032), Ghaziabad
B.Tech in Computer Science and Engineering (AI & ML) | 2024 – 2028 | Current CGPA: 8.60 / 10.0
Senior Secondary (12th CBSE) - 90.0% | Secondary (10th CBSE) - 92.5%

Technical Skills:
- Languages: Python, JavaScript, TypeScript, C++, SQL, HTML5, CSS3
- Frameworks & Libraries: React.js, Node.js, Express.js, Tailwind CSS, Next.js, PyTorch, Scikit-Learn
- Databases & Tools: PostgreSQL, SQLite, MongoDB, Redis, Docker, Git, Linux, Postman, Vite
- Core CS: Data Structures & Algorithms, Object-Oriented Programming (OOP), DBMS, Operating Systems, Computer Networks

Projects:
1. Campus Placement Tracker & Recruitment Management System
- Architected and deployed full-stack platform using React 18, Node.js, and PostgreSQL for 2,000+ students.
- Designed dual-layer eligibility engine reducing manual verification time by 85%.
- Implemented real-time recruitment pipeline tracking across 6 assessment rounds.

2. AI-Powered Resume & ATS Compatibility Analyzer
- Engineered TF-IDF and NLP keyword extraction engine analyzing resume keyword density against JDs.
- Achieved sub-200ms parse latency extracting sections, action verbs, and quantified metric achievements.
- Deployed REST APIs handling PDF, DOCX, and text extraction with automated scoring.

3. Distributed Task Queue & Rate-Limiting Engine
- Built high-throughput job queue in Node.js and Redis processing 10,000+ background tasks per minute.
- Enforced sliding-window rate limiters reducing API abuse by 99.4%.

Experience & Training:
Full Stack Web Development & Machine Learning Trainee — ABES TPO Cell (Jun 2025 – Aug 2025)
- Collaborated in an agile team of 5 to develop microservices for student evaluation analytics.
- Improved database query performance by 40% via composite indexing and query optimization.

Achievements & Certifications:
- Solved 450+ problems on LeetCode & Codeforces (Contest Rating: 1680+).
- Finalist, ABES Internal Hackathon 2025 (Top 5 out of 120 teams).
- Certified Deep Learning Specialist — Coursera / DeepLearning.AI.`;

export async function seed() {
  await initDb();
  await runMigrations();

  console.log('🌱 Starting comprehensive database seeding for ABES EC (College Code: 032)...');

  const saltRounds = 10;
  const orgPasswordHash = await bcrypt.hash('Org@123', saltRounds);
  const studentPasswordHash = await bcrypt.hash('Student@123', saltRounds);
  const defaultPasswordHash = await bcrypt.hash('Student@123', saltRounds);

  // 1. Seed Organization Account
  const orgEmail = 'org@abes.ac.in';
  let orgRes = await query('SELECT user_id FROM users WHERE email = $1', [orgEmail]);
  let orgUserId;
  if (orgRes.rows.length === 0) {
    await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4)`,
      [
        'ABES Engineering College — Training & Placement Office (TPO)',
        orgEmail,
        orgPasswordHash,
        'organization',
      ]
    );
    orgRes = await query('SELECT user_id FROM users WHERE email = $1', [orgEmail]);
  }
  orgUserId = orgRes.rows[0].user_id;

  // 2. Seed 7 Companies
  const companiesData = [
    {
      name: 'Microsoft',
      sector: 'Cloud & Software',
      location: 'Hyderabad / Noida',
      website: 'https://careers.microsoft.com',
      hr_name: 'Ananya Verma',
      hr_email: 'ananya.verma@microsoft.com',
      hr_phone: '+91 98765 43210',
      tier: 'Super Dream',
    },
    {
      name: 'Amazon',
      sector: 'E-Commerce & Cloud',
      location: 'Bengaluru',
      website: 'https://amazon.jobs',
      hr_name: 'Rohit Mehra',
      hr_email: 'rohit.mehra@amazon.com',
      hr_phone: '+91 98765 43211',
      tier: 'Super Dream',
    },
    {
      name: 'Adobe',
      sector: 'Digital Media & SaaS',
      location: 'Noida',
      website: 'https://adobe.wd5.myworkdayjobs.com',
      hr_name: 'Sneha Kapoor',
      hr_email: 'sneha.kapoor@adobe.com',
      hr_phone: '+91 98765 43212',
      tier: 'Super Dream',
    },
    {
      name: 'Atlassian',
      sector: 'Enterprise Software',
      location: 'Bengaluru',
      website: 'https://atlassian.com/company/careers',
      hr_name: 'Vikram Nair',
      hr_email: 'vikram.nair@atlassian.com',
      hr_phone: '+91 98765 43213',
      tier: 'Dream',
    },
    {
      name: 'Infosys',
      sector: 'IT Consulting',
      location: 'Pune / Mysuru',
      website: 'https://infosys.com/careers',
      hr_name: 'Priya Sharma',
      hr_email: 'priya.sharma@infosys.com',
      hr_phone: '+91 98765 43214',
      tier: 'Dream',
    },
    {
      name: 'Accenture',
      sector: 'Technology Consulting',
      location: 'Gurugram',
      website: 'https://accenture.com/in-en/careers',
      hr_name: 'Karan Malhotra',
      hr_email: 'karan.malhotra@accenture.com',
      hr_phone: '+91 98765 43215',
      tier: 'Standard',
    },
    {
      name: 'TCS',
      sector: 'IT Services',
      location: 'Noida / Mumbai',
      website: 'https://tcs.com/careers',
      hr_name: 'Deepak Joshi',
      hr_email: 'deepak.joshi@tcs.com',
      hr_phone: '+91 98765 43216',
      tier: 'Standard',
    },
  ];

  const companyMap = {};
  for (const c of companiesData) {
    let res = await query('SELECT company_id FROM companies WHERE company_name = $1', [c.name]);
    if (res.rows.length === 0) {
      await query(
        `INSERT INTO companies (company_name, industry_sector, location, website, hr_name, hr_email, hr_phone, hiring_tier)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [c.name, c.sector, c.location, c.website, c.hr_name, c.hr_email, c.hr_phone, c.tier]
      );
      res = await query('SELECT company_id FROM companies WHERE company_name = $1', [c.name]);
    }
    companyMap[c.name] = res.rows[0].company_id;
  }

  // Helper date generators relative to now
  const now = new Date();
  const futureDate = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };
  const pastDate = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  // 3. Seed 7 Complete Placement Drives with Structured JDs
  const drivesData = [
    {
      company: 'Microsoft',
      role: 'SDE-1 (Software Development Engineer)',
      ctc: 42.0,
      location: 'Hyderabad / Noida',
      min_cgpa: 8.5,
      max_backlogs: 0,
      branches: JSON.stringify(['CSE', 'AIML', 'IT']),
      deadline: futureDate(12),
      drive_date: futureDate(20),
      status: 'Open',
      rounds: JSON.stringify(['Online Assessment', 'Technical Round 1', 'Technical Round 2', 'AA Round']),
      role_overview: 'As an SDE-1 at Microsoft India Development Center, you will build hyper-scale cloud infrastructure on Azure, architect resilient distributed systems, and implement cutting-edge machine learning backends.',
      responsibilities: '1. Design and maintain high-performance microservices in C++, Java, or Go.\n2. Optimize asynchronous data pipelines handling petabytes of telemetry.\n3. Collaborate with global teams on telemetry, security, and automated continuous delivery.',
      must_have_skills: JSON.stringify(['Data Structures', 'Algorithms', 'C++', 'Java', 'Distributed Systems', 'SQL', 'OS', 'DBMS']),
      good_to_have_skills: JSON.stringify(['Azure', 'Kubernetes', 'Docker', 'System Design', 'Kafka', 'Microservices']),
      bond: 'No service bond required.',
      perks: 'Health insurance for family, stock grants (RSUs), relocation allowance, wellness subsidy, free transport.',
      ctc_breakdown: 'Base: 16.5 LPA | Performance Bonus: 3.5 LPA | Joining Bonus: 5 LPA | RSUs: 17 LPA over 4 years.',
    },
    {
      company: 'Amazon',
      role: 'SDE-1 (Cloud & Distributed Systems)',
      ctc: 32.0,
      location: 'Bengaluru',
      min_cgpa: 8.0,
      max_backlogs: 0,
      branches: JSON.stringify(['CSE', 'AIML', 'IT', 'ECE']),
      deadline: futureDate(14),
      drive_date: futureDate(22),
      status: 'Open',
      rounds: JSON.stringify(['Online Assessment', 'Technical Interview 1', 'Bar Raiser Round']),
      role_overview: 'Join Amazon Web Services (AWS) or Retail Consumer Engineering to build customer-obsessed scalable architectures that handle hundreds of thousands of transactions per second.',
      responsibilities: '1. Build reliable services with fault tolerance, auto-scaling, and low latency.\n2. Write maintainable Java/Python code adhering to Amazon leadership principles.\n3. Participate in on-call operational excellence and root-cause analysis.',
      must_have_skills: JSON.stringify(['Java', 'Python', 'Object-Oriented Programming', 'Data Structures', 'Algorithms', 'Computer Networks']),
      good_to_have_skills: JSON.stringify(['AWS', 'DynamoDB', 'Lambda', 'Docker', 'RESTful APIs']),
      bond: 'No service bond.',
      perks: 'Relocation bonus, comprehensive medical, employee discount, parental leave.',
      ctc_breakdown: 'Base: 15 LPA | Sign-on Bonus Year 1: 6 LPA | Year 2: 4 LPA | RSUs: 7 LPA.',
    },
    {
      company: 'Adobe',
      role: 'Product Engineer - Creative Cloud',
      ctc: 28.5,
      location: 'Noida',
      min_cgpa: 8.0,
      max_backlogs: 0,
      branches: JSON.stringify(['CSE', 'AIML', 'IT']),
      deadline: futureDate(16),
      drive_date: futureDate(25),
      status: 'Open',
      rounds: JSON.stringify(['Online Coding Test', 'Technical Round', 'HR Round']),
      role_overview: 'Work on Adobe Creative Cloud desktop and web applications, bringing advanced generative AI features (Firefly) into the hands of millions of creators worldwide.',
      responsibilities: '1. Develop desktop and web components using modern C++, WebAssembly, and React.\n2. Optimize graphics rendering and memory footprint for large digital assets.\n3. Implement unit and integration tests ensuring 99.9% crash-free sessions.',
      must_have_skills: JSON.stringify(['C++', 'JavaScript', 'React', 'Data Structures', 'Computer Graphics', 'Git']),
      good_to_have_skills: JSON.stringify(['WebAssembly', 'WebGL', 'TypeScript', 'Python', 'Machine Learning']),
      bond: 'No bond.',
      perks: 'Annual education stipend, Adobe product licenses, generous health coverage, gym reimbursement.',
      ctc_breakdown: 'Base: 14 LPA | Incentive: 3 LPA | RSUs: 9.5 LPA | Joining Bonus: 2 LPA.',
    },
    {
      company: 'Atlassian',
      role: 'Full Stack Developer',
      ctc: 26.0,
      location: 'Bengaluru',
      min_cgpa: 7.8,
      max_backlogs: 0,
      branches: JSON.stringify(['CSE', 'AIML', 'IT']),
      deadline: futureDate(10),
      drive_date: futureDate(18),
      status: 'Open',
      rounds: JSON.stringify(['OA Round', 'System Problem Solving', 'Values Interview']),
      role_overview: 'Engineer collaborative products like Jira, Confluence, and Trello. Empower team productivity across Fortune 500 enterprises with clean, testable full-stack systems.',
      responsibilities: '1. Build responsive user interfaces with React and GraphQL.\n2. Develop robust backend microservices in Java and Kotlin on AWS.\n3. Champion code quality, continuous integration, and inclusive code reviews.',
      must_have_skills: JSON.stringify(['React', 'TypeScript', 'Java', 'Node.js', 'REST APIs', 'SQL']),
      good_to_have_skills: JSON.stringify(['GraphQL', 'PostgreSQL', 'Docker', 'AWS', 'Jest', 'Cypress']),
      bond: 'No bond.',
      perks: 'Flexible work from home, annual wellness fund, equity grants, top-tier health insurance.',
      ctc_breakdown: 'Base: 16 LPA | Performance Bonus: 2.5 LPA | RSUs: 7.5 LPA.',
    },
    {
      company: 'Infosys',
      role: 'Specialist Programmer (Power Programmer)',
      ctc: 9.5,
      location: 'Pune / Mysuru',
      min_cgpa: 7.0,
      max_backlogs: 1,
      branches: JSON.stringify(['CSE', 'AIML', 'IT', 'ECE']),
      deadline: futureDate(15),
      drive_date: futureDate(24),
      status: 'Open',
      rounds: JSON.stringify(['HackWithInfy Coding Round', 'Technical Interview', 'HR Round']),
      role_overview: 'Elite coding and architecture track at Infosys tasked with delivering high-impact digital transformation and cloud modernization for Tier-1 banking and healthcare clients.',
      responsibilities: '1. Develop cloud-native solutions using Java Spring Boot or Python FastAPI.\n2. Design clean database schemas and implement secure authentication protocols.\n3. Integrate CI/CD pipelines and microservice observability tools.',
      must_have_skills: JSON.stringify(['Java', 'Python', 'Data Structures', 'Spring Boot', 'SQL', 'OOP']),
      good_to_have_skills: JSON.stringify(['React', 'Docker', 'Cloud Fundamentals', 'Microservices', 'Git']),
      bond: '1 year bond (INR 1,00,000).',
      perks: 'Infosys Mysore training campus stay, medical insurance, retention bonus.',
      ctc_breakdown: 'Fixed: 8.5 LPA | Variable: 1.0 LPA.',
    },
    {
      company: 'Accenture',
      role: 'Associate Software Engineer (ASE)',
      ctc: 6.5,
      location: 'Gurugram',
      min_cgpa: 6.5,
      max_backlogs: 1,
      branches: JSON.stringify(['CSE', 'AIML', 'IT', 'ECE']),
      deadline: futureDate(20),
      drive_date: futureDate(30),
      status: 'Open',
      rounds: JSON.stringify(['Cognitive & Technical Assessment', 'Coding Test', 'Communication Test', 'Interview']),
      role_overview: 'Work with multinational technology consulting teams to deploy enterprise web platforms, cloud migrations, and modern CRM systems.',
      responsibilities: '1. Participate in agile software development sprints and bug triaging.\n2. Write modular frontend and backend code under senior mentorship.\n3. Create technical documentation and user guides.',
      must_have_skills: JSON.stringify(['Core Java', 'SQL', 'HTML/CSS', 'Basic Data Structures', 'Problem Solving']),
      good_to_have_skills: JSON.stringify(['Python', 'React', 'Git', 'Agile Methodologies', 'Cloud Basics']),
      bond: 'No service bond.',
      perks: 'Shift allowances, medical cover for parents, learning certifications reimbursement.',
      ctc_breakdown: 'Base: 5.5 LPA | Joining Bonus: 0.5 LPA | Annual Performance Bonus: 0.5 LPA.',
    },
    {
      company: 'TCS',
      role: 'TCS Digital & Innovator',
      ctc: 7.5,
      location: 'Noida / Mumbai',
      min_cgpa: 7.0,
      max_backlogs: 0,
      branches: JSON.stringify(['CSE', 'AIML', 'IT', 'ECE']),
      deadline: futureDate(18),
      drive_date: futureDate(28),
      status: 'Open',
      rounds: JSON.stringify(['TCS NQT Advanced', 'Technical Round', 'MR Round', 'HR Round']),
      role_overview: 'Accelerated innovation cadre at Tata Consultancy Services focused on AI/ML, cloud engineering, cybersecurity, and IoT projects.',
      responsibilities: '1. Build production ML pipelines and backend services.\n2. Perform unit testing, automated benchmarking, and code refactoring.\n3. Collaborate with solution architects on enterprise client deliverables.',
      must_have_skills: JSON.stringify(['Python', 'Data Structures', 'SQL', 'Algorithms', 'Machine Learning Basics']),
      good_to_have_skills: JSON.stringify(['Flask', 'Django', 'Docker', 'AWS', 'TensorFlow', 'PostgreSQL']),
      bond: '1 year bond.',
      perks: 'Tata group discounts, health insurance, TCS iON learning access, annual bonus.',
      ctc_breakdown: 'Base: 7.0 LPA | Performance Linked Incentive: 0.5 LPA.',
    },
  ];

  const driveMap = {};
  for (const d of drivesData) {
    const compId = companyMap[d.company];
    let res = await query(
      'SELECT drive_id FROM placement_drives WHERE company_id = $1 AND job_role = $2',
      [compId, d.role]
    );
    if (res.rows.length === 0) {
      await query(
        `INSERT INTO placement_drives 
         (company_id, created_by, job_role, ctc_lpa, location, min_cgpa, max_backlogs, eligible_branches, registration_deadline, drive_date, status, selection_rounds, role_overview, responsibilities, must_have_skills, good_to_have_skills, bond_details, perks, ctc_breakdown)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          compId,
          orgUserId,
          d.role,
          d.ctc,
          d.location,
          d.min_cgpa,
          d.max_backlogs,
          d.branches,
          d.deadline,
          d.drive_date,
          d.status,
          d.rounds,
          d.role_overview,
          d.responsibilities,
          d.must_have_skills,
          d.good_to_have_skills,
          d.bond,
          d.perks,
          d.ctc_breakdown,
        ]
      );
      res = await query(
        'SELECT drive_id FROM placement_drives WHERE company_id = $1 AND job_role = $2',
        [compId, d.role]
      );
    }
    driveMap[`${d.company}_${d.role}`] = res.rows[0].drive_id;
  }

  // 4. Seed 10+ Students with Full Profiles and Sample Resume Text
  const studentsData = [
    {
      name: 'Raghav Bhatnagar',
      email: 'student@abes.ac.in',
      passwordHash: studentPasswordHash,
      roll_no: '2400321530154',
      branch: 'CSE (AI & ML)',
      section: 'A',
      batch_year: '2024–2028',
      tenth_pct: 92.5,
      twelfth_pct: 90.0,
      cgpa: 8.6,
      backlogs: 0,
      github: 'https://github.com/raghavbhatnagar',
      linkedin: 'https://linkedin.com/in/raghavbhatnagar',
      resume: '/uploads/resumes/raghav_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT,
      aptitude: 88,
      dsa: 92,
      remarks: 'Strong fundamentals in DSA, clean problem solving approach, and proficient in Python/MERN stack.',
    },
    {
      name: 'Mayank Garg',
      email: 'mayank.garg@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321530140',
      branch: 'CSE (AI & ML)',
      section: 'A',
      batch_year: '2024–2028',
      tenth_pct: 89.0,
      twelfth_pct: 88.5,
      cgpa: 8.2,
      backlogs: 0,
      github: 'https://github.com/mayankgarg',
      linkedin: 'https://linkedin.com/in/mayankgarg',
      resume: '/uploads/resumes/mayank_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Mayank Garg'),
      aptitude: 82,
      dsa: 85,
      remarks: 'Good understanding of system design concepts and algorithms.',
    },
    {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321510001',
      branch: 'CSE',
      section: 'B',
      batch_year: '2024–2028',
      tenth_pct: 94.0,
      twelfth_pct: 93.0,
      cgpa: 8.9,
      backlogs: 0,
      github: 'https://github.com/aaravsharma',
      linkedin: 'https://linkedin.com/in/aaravsharma',
      resume: '/uploads/resumes/aarav_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Aarav Sharma'),
      aptitude: 94,
      dsa: 96,
      remarks: 'Top competitive programmer (Codeforces Candidate Master candidate). Outstanding algorithmic speed.',
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321510045',
      branch: 'CSE',
      section: 'A',
      batch_year: '2024–2028',
      tenth_pct: 88.0,
      twelfth_pct: 86.0,
      cgpa: 7.8,
      backlogs: 0,
      github: 'https://github.com/priyapatel',
      linkedin: 'https://linkedin.com/in/priyapatel',
      resume: '/uploads/resumes/priya_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Priya Patel'),
      aptitude: 76,
      dsa: 80,
      remarks: 'Very disciplined, strong command over Java and OOP fundamentals.',
    },
    {
      name: 'Rohan Gupta',
      email: 'rohan.gupta@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321520012',
      branch: 'IT',
      section: 'A',
      batch_year: '2024–2028',
      tenth_pct: 82.0,
      twelfth_pct: 80.0,
      cgpa: 7.2,
      backlogs: 1,
      github: 'https://github.com/rohangupta',
      linkedin: 'https://linkedin.com/in/rohangupta',
      resume: '/uploads/resumes/rohan_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Rohan Gupta'),
      aptitude: 70,
      dsa: 72,
      remarks: 'Solid web development experience; continuing dynamic programming practice.',
    },
    {
      name: 'Ananya Singh',
      email: 'ananya.singh@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321530018',
      branch: 'CSE (AI & ML)',
      section: 'B',
      batch_year: '2024–2028',
      tenth_pct: 91.0,
      twelfth_pct: 89.0,
      cgpa: 8.4,
      backlogs: 0,
      github: 'https://github.com/ananyasingh',
      linkedin: 'https://linkedin.com/in/ananyasingh',
      resume: '/uploads/resumes/ananya_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Ananya Singh'),
      aptitude: 85,
      dsa: 88,
      remarks: 'Excellent computer vision projects and strong Python foundations.',
    },
    {
      name: 'Shreya Saxena',
      email: 'shreya.saxena@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321540023',
      branch: 'ECE',
      section: 'A',
      batch_year: '2024–2028',
      tenth_pct: 85.0,
      twelfth_pct: 84.0,
      cgpa: 7.6,
      backlogs: 0,
      github: 'https://github.com/shreyasaxena',
      linkedin: 'https://linkedin.com/in/shreyasaxena',
      resume: '/uploads/resumes/shreya_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Shreya Saxena'),
      aptitude: 78,
      dsa: 74,
      remarks: 'Good embedded systems & IoT background, developing software engineering skills.',
    },
    {
      name: 'Aditya Verma',
      email: 'aditya.verma@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321510088',
      branch: 'CSE',
      section: 'C',
      batch_year: '2024–2028',
      tenth_pct: 78.0,
      twelfth_pct: 76.0,
      cgpa: 6.8,
      backlogs: 1,
      github: 'https://github.com/adityaverma',
      linkedin: 'https://linkedin.com/in/adityaverma',
      resume: '/uploads/resumes/aditya_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Aditya Verma'),
      aptitude: 68,
      dsa: 65,
      remarks: 'Good communication skills, working hard to clear pending subject.',
    },
    {
      name: 'Tanvi Agarwal',
      email: 'tanvi.agarwal@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321520054',
      branch: 'IT',
      section: 'B',
      batch_year: '2024–2028',
      tenth_pct: 90.0,
      twelfth_pct: 89.0,
      cgpa: 8.1,
      backlogs: 0,
      github: 'https://github.com/tanviagarwal',
      linkedin: 'https://linkedin.com/in/tanviagarwal',
      resume: '/uploads/resumes/tanvi_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Tanvi Agarwal'),
      aptitude: 84,
      dsa: 82,
      remarks: 'High aptitude scores and well-rounded technical leadership in college clubs.',
    },
    {
      name: 'Siddharth Mishra',
      email: 'siddharth.mishra@abes.ac.in',
      passwordHash: defaultPasswordHash,
      roll_no: '2400321540071',
      branch: 'ECE',
      section: 'B',
      batch_year: '2024–2028',
      tenth_pct: 74.0,
      twelfth_pct: 72.0,
      cgpa: 6.4,
      backlogs: 2,
      github: 'https://github.com/siddharthmishra',
      linkedin: 'https://linkedin.com/in/siddharthmishra',
      resume: '/uploads/resumes/siddharth_resume.pdf',
      resume_text: SAMPLE_RESUME_TEXT.replace('Raghav Bhatnagar', 'Siddharth Mishra'),
      aptitude: 62,
      dsa: 58,
      remarks: 'Advised focused preparation for service-based standard placement rounds.',
    },
  ];

  const studentMap = {}; // roll_no -> student_id

  for (const s of studentsData) {
    let userRes = await query('SELECT user_id FROM users WHERE email = $1', [s.email]);
    let uId;
    if (userRes.rows.length === 0) {
      await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        [s.name, s.email, s.passwordHash, 'user']
      );
      userRes = await query('SELECT user_id FROM users WHERE email = $1', [s.email]);
    }
    uId = userRes.rows[0].user_id;

    let studRes = await query('SELECT student_id FROM student_profiles WHERE roll_no = $1', [s.roll_no]);
    let sId;
    if (studRes.rows.length === 0) {
      await query(
        `INSERT INTO student_profiles 
         (user_id, roll_no, branch, section, batch_year, tenth_pct, twelfth_pct, cgpa, active_backlogs, github_url, linkedin_url, resume_url, resume_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          uId,
          s.roll_no,
          s.branch,
          s.section,
          s.batch_year,
          s.tenth_pct,
          s.twelfth_pct,
          s.cgpa,
          s.backlogs,
          s.github,
          s.linkedin,
          s.resume,
          s.resume_text,
        ]
      );
      studRes = await query('SELECT student_id FROM student_profiles WHERE roll_no = $1', [s.roll_no]);
    } else {
      // Ensure resume_text is populated
      await query(
        'UPDATE student_profiles SET resume_text = COALESCE(resume_text, $1) WHERE student_id = $2',
        [s.resume_text, studRes.rows[0].student_id]
      );
    }
    sId = studRes.rows[0].student_id;
    studentMap[s.roll_no] = sId;

    let scoreRes = await query('SELECT score_id FROM training_scores WHERE student_id = $1', [sId]);
    if (scoreRes.rows.length === 0) {
      await query(
        `INSERT INTO training_scores (student_id, evaluated_by, aptitude_score, dsa_score, mock_interview_remarks, ai_interview_avg_score, best_ats_score, readiness_verdict)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sId, orgUserId, s.aptitude, s.dsa, s.remarks, 84.5, 91.0, s.cgpa >= 8.0 ? 'Ready for Super Dream' : 'Ready for Dream']
      );
    }
  }

  // 5. Seed Applications with ATS Scores
  const raghavId = studentMap['2400321530154'];
  const mayankId = studentMap['2400321530140'];
  const aaravId = studentMap['2400321510001'];
  const priyaId = studentMap['2400321510045'];
  const rohanId = studentMap['2400321520012'];
  const ananyaId = studentMap['2400321530018'];

  const msftDrive = driveMap['Microsoft_SDE-1 (Software Development Engineer)'];
  const amznDrive = driveMap['Amazon_SDE-1 (Cloud & Distributed Systems)'];
  const adbeDrive = driveMap['Adobe_Product Engineer - Creative Cloud'];
  const atlsDrive = driveMap['Atlassian_Full Stack Developer'];
  const infyDrive = driveMap['Infosys_Specialist Programmer (Power Programmer)'];
  const tcsDigDrive = driveMap['TCS_TCS Digital & Innovator'];

  const sampleApps = [
    { drive_id: msftDrive, student_id: raghavId, round: 'Technical Interview', status: 'In Progress', ats_score: 91.0 },
    { drive_id: amznDrive, student_id: raghavId, round: 'Online Assessment', status: 'In Progress', ats_score: 88.0 },
    { drive_id: atlsDrive, student_id: raghavId, round: 'Applied', status: 'In Review', ats_score: 94.0 },
    { drive_id: tcsDigDrive, student_id: raghavId, round: 'Selected', status: 'Selected', ats_score: 89.5 },
    { drive_id: amznDrive, student_id: mayankId, round: 'Technical Interview', status: 'In Progress', ats_score: 84.0 },
    { drive_id: infyDrive, student_id: mayankId, round: 'Selected', status: 'Selected', ats_score: 86.0 },
    { drive_id: msftDrive, student_id: aaravId, round: 'Selected', status: 'Selected', ats_score: 96.0 },
    { drive_id: atlsDrive, student_id: priyaId, round: 'Shortlisted', status: 'In Progress', ats_score: 82.0 },
    { drive_id: infyDrive, student_id: rohanId, round: 'Applied', status: 'In Review', ats_score: 74.0 },
    { drive_id: adbeDrive, student_id: ananyaId, round: 'HR Round', status: 'In Progress', ats_score: 90.0 },
  ];

  for (const app of sampleApps) {
    if (!app.drive_id || !app.student_id) continue;
    const existing = await query(
      'SELECT application_id FROM applications WHERE drive_id = $1 AND student_id = $2',
      [app.drive_id, app.student_id]
    );
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO applications (drive_id, student_id, current_round, status, ats_score)
         VALUES ($1, $2, $3, $4, $5)`,
        [app.drive_id, app.student_id, app.round, app.status, app.ats_score]
      );
    }
  }

  // 6. Seed Sample Resume Audits for Raghav
  const auditRes = await query('SELECT audit_id FROM resume_audits WHERE student_id = $1', [raghavId]);
  if (auditRes.rows.length === 0) {
    await query(
      `INSERT INTO resume_audits (student_id, overall_score, grade_badge, section_scores, formatting_checks, impact_analysis, bullet_rewrites, extracted_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        raghavId,
        89.5,
        'Interview-Ready',
        JSON.stringify({
          contact: 100,
          summary: 85,
          education: 100,
          skills: 95,
          projects: 90,
          experience: 85,
          achievements: 90,
        }),
        JSON.stringify({
          word_count: 362,
          page_count: 1,
          bullet_structure_score: 92,
          contact_links_valid: true,
          readability_grade: 'A',
          issues: ['Consider adding a 1-sentence career summary at the top.'],
        }),
        JSON.stringify({
          action_verbs_count: 14,
          metrics_count: 8,
          weak_phrases_found: ['Worked on'],
          impact_rating: 'High',
        }),
        JSON.stringify([
          {
            original: 'Worked on microservices for student evaluation analytics.',
            star_rewrite: 'Architected and deployed 3 Node.js microservices reducing evaluation response latency by 40% for 2,000+ candidates.',
            issue: 'Weak action verb and lacking quantitative achievement.',
          },
        ]),
        SAMPLE_RESUME_TEXT,
      ]
    );

    await query(
      `INSERT INTO resume_audits (student_id, overall_score, grade_badge, section_scores, formatting_checks, impact_analysis, bullet_rewrites, extracted_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        raghavId,
        78.0,
        'Good',
        JSON.stringify({
          contact: 100,
          summary: 70,
          education: 100,
          skills: 80,
          projects: 75,
          experience: 70,
          achievements: 80,
        }),
        JSON.stringify({
          word_count: 280,
          page_count: 1,
          bullet_structure_score: 78,
          contact_links_valid: true,
          readability_grade: 'B+',
          issues: ['Several project bullets lack clear metric outcomes.'],
        }),
        JSON.stringify({
          action_verbs_count: 8,
          metrics_count: 3,
          weak_phrases_found: ['Helped with', 'Responsible for'],
          impact_rating: 'Moderate',
        }),
        JSON.stringify([]),
        SAMPLE_RESUME_TEXT.substring(0, 800),
      ]
    );
  }

  // 7. Seed Sample ATS Scans
  const scanRes = await query('SELECT scan_id FROM ats_scans WHERE student_id = $1', [raghavId]);
  if (scanRes.rows.length === 0) {
    await query(
      `INSERT INTO ats_scans (student_id, drive_id, job_title, match_score, shortlist_probability, keyword_breakdown, matched_keywords, missing_must_have, missing_good_to_have, recommendations, resume_text, jd_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        raghavId,
        msftDrive,
        'Microsoft — SDE-1 (Software Development Engineer)',
        91.0,
        'High',
        JSON.stringify({
          hard_skills_score: 92,
          role_alignment_score: 90,
          experience_relevance: 91,
          ats_parseability: 95,
        }),
        JSON.stringify(['C++', 'Python', 'Data Structures', 'Algorithms', 'SQL', 'DBMS', 'Operating Systems', 'Git']),
        JSON.stringify(['Azure']),
        JSON.stringify(['Kubernetes', 'Kafka']),
        JSON.stringify([
          'Incorporate "Azure" in project deployment descriptions to boost cloud keywords.',
          'Highlight distributed systems concurrency models in project 3.',
        ]),
        SAMPLE_RESUME_TEXT,
        drivesData[0].role_overview,
      ]
    );

    await query(
      `INSERT INTO ats_scans (student_id, drive_id, job_title, match_score, shortlist_probability, keyword_breakdown, matched_keywords, missing_must_have, missing_good_to_have, recommendations, resume_text, jd_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        raghavId,
        atlsDrive,
        'Atlassian — Full Stack Developer',
        94.0,
        'High',
        JSON.stringify({
          hard_skills_score: 96,
          role_alignment_score: 94,
          experience_relevance: 92,
          ats_parseability: 96,
        }),
        JSON.stringify(['React', 'TypeScript', 'Node.js', 'REST APIs', 'PostgreSQL', 'Tailwind CSS', 'Git', 'Docker']),
        JSON.stringify([]),
        JSON.stringify(['GraphQL', 'Cypress']),
        JSON.stringify([
          'Exceptional match for Full Stack Developer. Highlight your React 18 and microservices expertise in the initial interview round.',
        ]),
        SAMPLE_RESUME_TEXT,
        drivesData[3].role_overview,
      ]
    );
  }

  // 8. Seed Sample AI Interview Session (Completed with 5-Axis Radar Chart Scores)
  const interviewRes = await query('SELECT session_id FROM ai_interview_sessions WHERE student_id = $1', [raghavId]);
  if (interviewRes.rows.length === 0) {
    await query(
      `INSERT INTO ai_interview_sessions (student_id, drive_id, target_role, interview_type, difficulty, input_mode, overall_score, axis_scores, status, duration_seconds, questions_data, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
      [
        raghavId,
        msftDrive,
        'SDE-1 (Software Development Engineer)',
        'Technical + Core CS',
        'Medium',
        'Voice Mode',
        88.5,
        JSON.stringify({
          technical_accuracy: 90,
          communication_clarity: 88,
          problem_solving: 89,
          star_structure: 85,
          jd_relevance: 90,
        }),
        'Completed',
        1140, // 19 minutes
        JSON.stringify([
          {
            q_id: 1,
            question: 'Can you walk us through the architecture of your Campus Placement Tracker project and how you designed the dual-layer eligibility engine?',
            answer: 'I designed the system using React on the frontend and Express with PostgreSQL on the backend. The eligibility engine runs on both layers: client-side for immediate responsive UX, and server-side to enforce strict verification against CGPA, active backlogs, branches, and deadlines before database insertion.',
            score: 9.0,
            strengths: 'Clear explanation of separation of concerns and defense against unauthorized submissions.',
            areas_to_improve: 'Could mention specific caching strategies used if student profile checks become high-frequency.',
            model_answer: 'Start with high-level architecture (Vite React client, stateless Node/Express API, normalized SQL database). Then explain the eligibility rules parser which validates CGPA >= min_cgpa, active_backlogs <= max, and normalized branch arrays before executing an idempotent insert.',
          },
          {
            q_id: 2,
            question: 'Explain the difference between process and thread in modern operating systems, and how concurrency is managed in Node.js vs C++.',
            answer: 'A process is an executing instance of a program with its own dedicated memory space, while threads exist within a process and share its heap. Node.js uses a single-threaded event loop powered by libuv for non-blocking I/O, whereas C++ supports true multi-threading with std::thread and mutexes.',
            score: 8.5,
            strengths: 'Accurate distinction between process memory isolation and thread memory sharing; accurate Node event loop explanation.',
            areas_to_improve: 'Mention thread synchronization pitfalls like race conditions and deadlocks.',
            model_answer: 'Processes have independent virtual address spaces. Threads share code, data, and heap. In Node.js, asynchronous I/O runs on the libuv thread pool while JS code executes on one thread. In C++, multiple threads execute simultaneously across CPU cores, requiring mutexes and atomic operations.',
          },
          {
            q_id: 3,
            question: 'How does indexing in a relational database improve query performance, and what are the trade-offs on write operations?',
            answer: 'Indexes typically use B-Trees or Hash tables to allow lookups in O(log N) rather than full table scans O(N). The trade-off is that every INSERT, UPDATE, or DELETE must also update the index trees, increasing write latency and storage.',
            score: 9.0,
            strengths: 'Mentioned B-Trees, logarithmic time complexity, and accurate write amplification trade-off.',
            areas_to_improve: 'Could touch on composite index column ordering.',
            model_answer: 'B-Tree indexes maintain sorted pointers to table pages. While reads drop from O(N) to O(log N), every write requires tree balancing and additional disk I/O. Best practice is to index high-cardinality columns used in WHERE, JOIN, and ORDER BY clauses.',
          },
        ]),
      ]
    );
  }

  // 9. Seed Mock Interview Slots & Bookings
  const slotRes = await query('SELECT slot_id FROM mock_interview_slots');
  if (slotRes.rows.length === 0) {
    const slot1 = await query(
      `INSERT INTO mock_interview_slots (title, track, interviewer_name, scheduled_at, duration_minutes, meeting_link_or_room, capacity, booked_count, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'ABES Super Dream DSA & Algorithmic Defense',
        'DSA Mock',
        'Prof. Alok Gupta (TPO Lead)',
        futureDate(2),
        45,
        'https://meet.google.com/abes-dsa-mock',
        10,
        3,
        'Upcoming',
        orgUserId,
      ]
    );

    const slot2 = await query(
      `INSERT INTO mock_interview_slots (title, track, interviewer_name, scheduled_at, duration_minutes, meeting_link_or_room, capacity, booked_count, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'Enterprise Full Stack & System Design Review',
        'Full Stack Technical',
        'Er. Neha Singh (Alumni - Amazon SDE-2)',
        futureDate(4),
        60,
        'Lab 304, Academic Block A',
        8,
        2,
        'Upcoming',
        orgUserId,
      ]
    );

    const slot3 = await query(
      `INSERT INTO mock_interview_slots (title, track, interviewer_name, scheduled_at, duration_minutes, meeting_link_or_room, capacity, booked_count, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'HR Behavioral & STAR Leadership Readiness',
        'HR Readiness',
        'Dr. Rakesh Sharma (Head Training)',
        pastDate(2),
        30,
        'Seminar Hall 2 / Online',
        15,
        5,
        'Completed',
        orgUserId,
      ]
    );

    const slot4 = await query(
      `INSERT INTO mock_interview_slots (title, track, interviewer_name, scheduled_at, duration_minutes, meeting_link_or_room, capacity, booked_count, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'Core CS Deep Dive: OS, DBMS & Computer Networks',
        'System Design',
        'Prof. Swati Verma',
        futureDate(5),
        45,
        'https://meet.google.com/abes-core-cs',
        12,
        1,
        'Upcoming',
        orgUserId,
      ]
    );

    // Bookings for Raghav:
    // 1. Upcoming booking on Slot 1
    const s1Id = (await query('SELECT slot_id FROM mock_interview_slots WHERE title LIKE "%DSA & Algorithmic%"')).rows[0].slot_id;
    await query(
      `INSERT INTO mock_interview_bookings (slot_id, student_id, status)
       VALUES ($1, $2, 'Booked')`,
      [s1Id, raghavId]
    );

    // 2. Completed & Evaluated booking on Slot 3 (HR Readiness)
    const s3Id = (await query('SELECT slot_id FROM mock_interview_slots WHERE title LIKE "%HR Behavioral%"')).rows[0].slot_id;
    await query(
      `INSERT INTO mock_interview_bookings (slot_id, student_id, status, dsa_score, core_cs_score, project_defense_score, communication_score, readiness_verdict, strengths, action_items, evaluated_by, evaluated_at)
       VALUES ($1, $2, 'Completed', 88, 86, 92, 90, 'Ready for Super Dream', $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        s3Id,
        raghavId,
        'Excellent articulation using the STAR methodology; clear project impact metrics and confidence.',
        'Keep refining system design trade-offs (e.g. CAP theorem and database replication strategies).',
        orgUserId,
      ]
    );
  }

  console.log('✅ Seeded 11 core entities: users, profiles, companies, drives, applications, scores, resume audits, ATS scans, AI sessions, mock slots, mock bookings');
  console.log('🎉 Comprehensive seeding completed successfully!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
