function buildNetworkingPacket({ job, masterResume }) {
  const fitScore = job.fit_score != null ? job.fit_score : 'Unknown';

  const recommendation = job.recommendation || 'Unknown';

  const technologyScore = job.technology_score != null ? job.technology_score : 'Unknown';

  const technologyLabels = job.technology_labels != null ? JSON.stringify(job.technology_labels) : 'None';

  const companyScore = job.company_score != null ? job.company_score : 'Unknown';

  const companyStage = job.company_stage_label || 'Unknown';

  const companySize = job.company_size_label || 'Unknown';

  const salaryScore = job.salary_score != null ? job.salary_score : 'Unknown';

  const salaryLabel = job.salary_label || 'Unknown';

  const aiReason = job.ai_reason || 'None';

  const aiRedFlags = job.ai_red_flags != null ? JSON.stringify(job.ai_red_flags) : '[]';

  return `# NETWORKING PACKET

## JOB

**Company:** ${job.company || 'Unknown'}

**Title:** ${job.title || 'Unknown'}

**Source:** ${job.source || 'Unknown'}

**Fit Score:** ${fitScore}

**Recommendation:** ${recommendation}

**Location:** ${job.location || 'Unknown'}

**Employment Type:** ${job.employment_type || 'Unknown'}

**Workplace Type:** ${job.workplace_type || 'Unknown'}

**Job URL:** ${job.url || 'Unknown'}

**Application URL:** ${job.apply_url || job.url || 'Unknown'}

## FIT ANALYSIS

**Technology Score:** ${technologyScore}

**Technology Labels:** ${technologyLabels}

**Company Score:** ${companyScore}

**Company Stage:** ${companyStage}

**Company Size:** ${companySize}

**Salary Score:** ${salaryScore}

**Salary Label:** ${salaryLabel}

### AI Reason

${aiReason}

### AI Red Flags

${aiRedFlags}

## JOB DESCRIPTION

${job.description}

## MASTER RESUME

${masterResume}

## CHATGPT TASK

You are helping the candidate start a networking conversation
around this specific job opportunity.

Your goal is NOT simply to write a generic job application message.

Determine the strongest networking approach for this opportunity.

### 1. Identify the best person to contact

Based on the company, role, and job description, determine which
type of person would be most valuable to contact first.

Consider:

- Founder
- Co-founder
- Hiring manager
- Engineering manager
- Head of Engineering
- CTO
- Recruiter
- Relevant engineer or employee

Prefer people who are plausibly close to the hiring decision.

If specific people are not known from the supplied information,
do not invent them.

If web research is available, research the company and identify
specific relevant people to contact.

### 2. Explain why this person is worth contacting

Give a short explanation of:

- Why this person is relevant.
- Why this particular role is a strong opportunity.
- What candidate experience is most relevant to the conversation.

### 3. Find the strongest candidate angle

Identify the 1–3 strongest truthful reasons the candidate is relevant
to this company or role.

Prioritize:

- Relevant engineering experience
- Full-stack/product engineering
- Startup ownership
- Relevant technologies
- AI/LLM experience
- End-to-end product development
- Relevant projects

Do not force a match where one does not exist.

### 4. Draft the initial outreach

Write a short, natural personalized message.

The message should:

- Sound like a real person.
- Be concise.
- Mention the specific company or product.
- Explain why the candidate is reaching out.
- Use one or two relevant candidate details.
- Avoid dumping the resume into the message.
- Avoid generic phrases such as "I hope you're doing well."
- Avoid sounding like mass outreach.
- Avoid immediately asking for a referral unless appropriate.
- Aim to start a conversation.

### 5. Draft a LinkedIn connection request

Keep it short enough for a connection request.

Make it personalized to this company/person where possible.

### 6. Draft a follow-up

Create one concise follow-up message for use if there is
no response.

Do not make it pushy.

### 7. Networking strategy

Return:

- Best person/type of person to contact
- Why them
- Candidate's strongest angle
- Initial outreach message
- Connection request
- Follow-up message

## TRUTHFULNESS RULES

Use ONLY information supported by the master resume and the job
information above.

Do not invent:

- Technologies
- Frameworks
- Projects
- Responsibilities
- Employers
- Job titles
- Metrics
- Achievements
- Relationships
- Previous interactions
- Referrals
- Company facts not established by the available information

Vue experience does NOT become React experience.

Vue experience does NOT become React Native experience.

Do not claim direct experience with a technology unless the master
resume supports it.

Do not claim the candidate has spoken to, knows, follows, or was
referred by anyone unless that information is explicitly provided.

If researching specific people or company information, clearly
distinguish researched facts from candidate experience.

## OUTPUT

Return the networking strategy and messages only.

Do not rewrite the resume.

Do not create a cover letter.

Keep the outreach concise and natural.
`.trim();
}

module.exports = {
  buildNetworkingPacket,
};
