/**
 * Eligibility Engine for Placement Drives
 * Validates whether a student qualifies for a given placement drive.
 */

// Helper to normalize branch names (e.g. "CSE (AI & ML)" -> "AIML", "CSE")
export function normalizeBranch(branch) {
  if (!branch) return [];
  const b = branch.toUpperCase();
  const list = [];
  if (b.includes('AI') || b.includes('ML') || b.includes('AIML')) {
    list.push('AIML', 'CSE');
  } else if (b.includes('CSE') || b.includes('COMPUTER')) {
    list.push('CSE');
  } else if (b.includes('IT') || b.includes('INFORMATION')) {
    list.push('IT');
  } else if (b.includes('ECE') || b.includes('ELECTRONICS')) {
    list.push('ECE');
  } else {
    list.push(b);
  }
  return list;
}

export function checkEligibility(student, drive) {
  const failedReasons = [];

  if (!student) {
    return {
      isEligible: false,
      failedReasons: ['Student profile not found. Please complete your profile.'],
    };
  }

  // 1. Drive status check
  if (drive.status !== 'Open') {
    failedReasons.push(`Drive is currently ${drive.status || 'not open'}.`);
  }

  // 2. Registration deadline check
  if (drive.registration_deadline) {
    const deadline = new Date(drive.registration_deadline);
    const now = new Date();
    if (deadline < now) {
      failedReasons.push(
        `Registration deadline passed on ${deadline.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}.`
      );
    }
  }

  // 3. CGPA check
  const studentCgpa = parseFloat(student.cgpa || 0);
  const minCgpa = parseFloat(drive.min_cgpa || 0);
  if (studentCgpa < minCgpa) {
    failedReasons.push(`Minimum CGPA ${minCgpa.toFixed(1)} required (Your CGPA: ${studentCgpa.toFixed(1)}).`);
  }

  // 4. Backlogs check
  const studentBacklogs = parseInt(student.active_backlogs || 0, 10);
  const maxBacklogs = parseInt(drive.max_backlogs ?? 0, 10);
  if (studentBacklogs > maxBacklogs) {
    failedReasons.push(
      `Maximum ${maxBacklogs} active backlog${maxBacklogs === 1 ? '' : 's'} allowed (You have ${studentBacklogs}).`
    );
  }

  // 5. Eligible branches check
  let eligibleBranches = [];
  try {
    eligibleBranches = Array.isArray(drive.eligible_branches)
      ? drive.eligible_branches
      : JSON.parse(drive.eligible_branches || '[]');
  } catch (e) {
    eligibleBranches = (drive.eligible_branches || '').split(',').map((x) => x.trim());
  }

  if (eligibleBranches.length > 0) {
    const studentBranches = normalizeBranch(student.branch);
    const hasBranchMatch = studentBranches.some((sb) =>
      eligibleBranches.some((eb) => eb.toUpperCase() === sb.toUpperCase())
    );
    if (!hasBranchMatch) {
      failedReasons.push(
        `Eligible branches: ${eligibleBranches.join(', ')} (Your branch: ${student.branch || 'Unassigned'}).`
      );
    }
  }

  return {
    isEligible: failedReasons.length === 0,
    failedReasons,
  };
}

export default {
  checkEligibility,
  normalizeBranch,
};
