require('dotenv').config();

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const FIT_SCORE_THRESHOLD = 0.6;
const JOB_LIMIT = 1;

const MASTER_RESUME_PATH = path.join(__dirname, 'master-resume', 'master-resume.md');

function assertEnvironment() {
  if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable.');
  }

  if (!SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_KEY environment variable.');
  }
}

function printDivider(title) {
  console.log('\n');
  console.log('='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
}

function loadMasterResume() {
  if (!fs.existsSync(MASTER_RESUME_PATH)) {
    throw new Error(`Master resume not found: ${MASTER_RESUME_PATH}`);
  }

  const masterResume = fs.readFileSync(MASTER_RESUME_PATH, 'utf8').trim();

  if (!masterResume) {
    throw new Error('Master resume is empty.');
  }

  return masterResume;
}

async function fetchJobs() {
  const params = new URLSearchParams();

  params.set(
    'select',
    [
      'id',
      'source',
      'source_job_id',
      'url',
      'apply_url',
      'title',
      'company',
      'location',
      'employment_type',
      'workplace_type',
      'salary_min',
      'salary_max',
      'salary_currency',
      'description',
      'posted_at',
      'fit_score',
      'priority_score',
      'recommendation',
      'ai_reason',
      'ai_red_flags',
      'technology_score',
      'technology_labels',
      'company_score',
      'company_size_label',
      'company_stage_label',
      'salary_score',
      'salary_label',
      'analysis',
      'analysis_version',
      'archived',
    ].join(','),
  );

  params.set('fit_score', `gt.${FIT_SCORE_THRESHOLD}`);
  params.set('archived', 'eq.false');
  params.set('order', 'fit_score.desc');
  params.set('limit', String(JOB_LIMIT));

  const url = `${SUPABASE_URL.replace(/\/$/, '')}` + `/rest/v1/job_postings?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Supabase query failed (${response.status}): ${body}`);
  }

  return response.json();
}

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

async function savePacketsToSupabase({ job, applicationPacket, networkingPacket }) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}` + `/rest/v1/job_postings?id=eq.${encodeURIComponent(job.id)}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      application_packet: applicationPacket,
      networking_packet: networkingPacket,
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Supabase packet save failed (${response.status}): ${body}`);
  }
}

function printJob(job, index) {
  console.log('\n');
  console.log('-'.repeat(80));

  console.log(`JOB ${index + 1}`);
  console.log(`ID:       ${job.id}`);
  console.log(`Company:  ${job.company || 'Unknown'}`);
  console.log(`Title:    ${job.title || 'Unknown'}`);
  console.log(`Source:   ${job.source || 'Unknown'}`);
  console.log(`Fit:      ${job.fit_score}`);
  console.log(`Location: ${job.location || 'Unknown'}`);

  if (job.url) {
    console.log(`URL:      ${job.url}`);
  }

  console.log('-'.repeat(80));
}

async function main() {
  printDivider('9-resume-message-tailor — APPLICATION + NETWORKING PACKET TEST');

  console.log(`Fit threshold: > ${FIT_SCORE_THRESHOLD}`);
  console.log(`Maximum jobs:  ${JOB_LIMIT}`);

  assertEnvironment();

  console.log('\nLoading master resume...');

  const masterResume = loadMasterResume();

  console.log(`Master resume: ${masterResume.length} characters`);

  console.log('\nQuerying Supabase...');

  const rows = await fetchJobs();

  if (!rows.length) {
    console.log(`\nNo non-archived jobs found with ` + `fit_score > ${FIT_SCORE_THRESHOLD}.`);

    return;
  }

  printDivider(`FOUND ${rows.length} JOB(S)`);

  for (let index = 0; index < rows.length; index += 1) {
    const job = rows[index];

    console.log(
      `${index + 1}. ` + `${job.company || 'Unknown'} — ` + `${job.title || 'Unknown'} ` + `(fit: ${job.fit_score})`,
    );
  }

  const results = [];

  for (let index = 0; index < rows.length; index += 1) {
    const job = rows[index];

    try {
      printJob(job, index);

      if (!job.description) {
        throw new Error('Missing job description.');
      }

      console.log('\nBuilding application packet...');

      const applicationPacket = buildApplicationPacket({
        job,
        masterResume,
      });

      console.log(`Application packet: ${applicationPacket.length} characters`);

      console.log('\nBuilding networking packet...');

      const networkingPacket = buildNetworkingPacket({
        job,
        masterResume,
      });

      console.log(`Networking packet: ${networkingPacket.length} characters`);

      console.log('\nSaving both packets to Supabase...');

      await savePacketsToSupabase({
        job,
        applicationPacket,
        networkingPacket,
      });

      console.log('Both packets saved successfully.');

      results.push({
        job,
        success: true,
        applicationCharacters: applicationPacket.length,
        networkingCharacters: networkingPacket.length,
      });
    } catch (error) {
      console.error(`\nERROR creating packets for job ${job.id}:`);

      console.error(error.message);

      results.push({
        job,
        success: false,
        error: error.message,
      });
    }
  }

  printDivider('FINAL SUMMARY');

  for (const item of results) {
    const job = item.job;

    console.log(
      `${job.id} | ` +
        `${job.company || 'Unknown'} | ` +
        `${job.title || 'Unknown'} | ` +
        `fit=${job.fit_score} | ` +
        `${item.success ? 'PACKETS SAVED' : 'FAILED'}`,
    );

    if (item.success) {
      console.log(`  Application: ${item.applicationCharacters} characters`);

      console.log(`  Networking:  ${item.networkingCharacters} characters`);
    } else {
      console.log(`  ${item.error}`);
    }
  }

  const successful = results.filter((item) => item.success).length;

  const failed = results.length - successful;

  console.log('\n');
  console.log(`Processed: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  console.log('\nPackets were written to Supabase.');
  console.log('No AI model was called.');
}

main().catch((error) => {
  console.error('\nFATAL ERROR\n');
  console.error(error.message);
  process.exitCode = 1;
});
