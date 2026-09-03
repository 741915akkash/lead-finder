function buildApplicationPacket({ job, masterResume }) {
  return `# APPLICATION PACKET

## JOB

**Company:** ${job.company || 'Unknown'}

**Title:** ${job.title || 'Unknown'}

**Source:** ${job.source || 'Unknown'}

**Fit Score:** ${job.fit_score ?? 'Unknown'}

**Recommendation:** ${job.recommendation || 'Unknown'}

**Location:** ${job.location || 'Unknown'}

**Employment Type:** ${job.employment_type || 'Unknown'}

**Workplace Type:** ${job.workplace_type || 'Unknown'}

**Job URL:** ${job.url || 'Unknown'}

**Application URL:** ${job.apply_url || job.url || 'Unknown'}

## JOB DESCRIPTION

${job.description}

## MASTER RESUME

${masterResume}

## CHATGPT TASK

Tailor the master resume for this specific job.

Rules:

- Use ONLY information supported by the master resume.
- Do not invent technologies, frameworks, projects, responsibilities,
  employers, job titles, metrics, achievements, education, or experience.
- Do not add a technology merely because it appears in the job description.
- Vue experience does NOT become React experience.
- Vue experience does NOT become React Native experience.
- Do not claim direct experience with any technology unless the master
  resume supports it.
- Prioritize the strongest relevant engineering evidence.
- Prioritize relevant technical projects.
- Prioritize relevant technologies.
- Remove irrelevant experience when space is limited.
- Keep the resume concise and suitable for one page.
- Optimize for both ATS matching and human review.
- Preserve truthful employment history and dates.
- Return ONLY the tailored resume in Markdown.
`.trim();
}

module.exports = {
  buildApplicationPacket,
};
