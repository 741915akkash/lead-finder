const TAILORING_PROMPT_VERSION = 7;

/**
 * Build the prompt for resume tailoring.
 *
 * The master resume is the canonical candidate source.
 * The model decides which existing material is most relevant
 * to the target job and how to position it.
 */
function buildTailoringPrompt({ job, masterResume }) {
  if (!masterResume) {
    throw new Error('Missing master resume.');
  }

  if (!job?.description) {
    throw new Error('Missing job description.');
  }

  return `
You are tailoring a candidate's master resume for ONE specific job.

Your job is to create a concise, highly relevant version of the
candidate's existing resume for this job.

The MASTER RESUME is the complete truthful source of candidate
experience.

The JOB DESCRIPTION tells you what is relevant.

==================================================
CORE RULE
==================================================

ONLY use information that exists in the master resume.

Do not invent:

- technologies
- frameworks
- projects
- responsibilities
- employers
- job titles
- metrics
- achievements
- education
- experience

You may select, reorder, combine, clarify, and rewrite existing
material when doing so remains factually faithful to the master resume.

Do not create new claims from the job description.

==================================================
TECHNOLOGY RULE
==================================================

The master resume represents technologies the candidate genuinely
knows or has used.

Use technologies from the master resume when they are relevant to
the job.

Do NOT add a technology merely because it appears in the job
description.

Do NOT claim experience with a technology that is not supported
somewhere by the master resume.

Related technologies are not equivalent.

For example:

Vue experience does not become React experience.

Vue experience does not become React Native experience.

Node.js experience does not automatically become Express.js
experience unless Express.js appears in the master resume.

PostgreSQL experience does not become MongoDB experience unless
MongoDB appears in the master resume.

Transferable skills may be presented as transferable, but never as
direct experience with a technology that is not supported by the
master resume.

==================================================
WHAT YOU SHOULD OPTIMIZE
==================================================

Select the material that gives the strongest match for this job.

For technical/software engineering roles, prioritize engineering
and technical material.

Prioritize:

- relevant engineering experience
- relevant technologies
- relevant technical projects
- relevant AI/LLM experience
- relevant startup/product ownership
- relevant backend/frontend/database experience
- responsibilities that map closely to the job
- technologies that appear important in the job description

Use resume space primarily for material that helps demonstrate the
candidate can perform the target role.

Do NOT be overly conservative when selecting relevant technical
evidence.

If a technology appears in the master resume and is genuinely
relevant to the job, it should generally be included even if the
specific experience bullet containing it was not selected.

For example, if the master resume contains Node.js, Express.js,
PostgreSQL, MongoDB, AWS, Docker, OpenAI API, and Ollama, do not
arbitrarily reduce the Technologies section to only Node.js and
PostgreSQL when several of those technologies are relevant to the
job.

At the same time, do not copy every technology merely to make the
resume look comprehensive.

The goal is RELEVANCE, not maximum keyword coverage.

==================================================
EXPERIENCE
==================================================

Keep the candidate's real employers, roles, and dates.

For technical/software engineering roles, prioritize the strongest
technical evidence.

Go Launch Scall should normally contain 4–6 bullets when enough
relevant evidence exists.

Prefer bullets that demonstrate actual engineering work, including:

- full-stack application development
- backend/API development
- databases and data modeling
- AI/LLM systems
- automation and processing pipelines
- infrastructure/deployment
- product architecture and ownership

Do not reduce Go Launch Scall to only the product/domain description
when the master resume contains stronger technical evidence.

Other technical roles should be considered based on their relevance
to the job.

Do not include every experience entry automatically.

==================================================
BULLET SELECTION
==================================================

Do not simply take the first bullets from each role.

For each relevant role:

1. Identify what the job description is actually asking for.
2. Find the strongest existing evidence in the master resume.
3. Put the strongest matching bullets first.
4. Rewrite them only when rewriting improves relevance or clarity.
5. Preserve the underlying factual claim.

A relevant technical bullet is more valuable than a generic
description of the company or product.

Do not create a new accomplishment by combining unrelated facts.

==================================================
PROJECTS
==================================================

Select the projects most relevant to this job.

Technical projects should be prioritized when deciding what deserves
limited one-page resume space.

You may:

- change project ordering
- select the strongest bullets
- rewrite bullets for relevance
- omit low-relevance projects

Do not invent project details.

Prioritize projects that demonstrate technologies, systems, or
responsibilities directly relevant to the job.

==================================================
TECHNOLOGIES
==================================================

The Technologies section should be a relevance-filtered selection
from the master resume.

Choose technologies that are:

1. relevant to the job, and
2. genuinely supported by the master resume.

For a technical job, include the relevant technologies from the
master resume that strengthen the candidate's match.

Do not add technologies that are only mentioned in the job
description.

Do not automatically copy every technology from the master resume.

However, do not omit a genuinely relevant technology simply because
the experience bullet containing it was not selected.

Technology selection should be based on the candidate's actual
master-resume evidence plus relevance to the job.

==================================================
SUMMARY
==================================================

Tailor the summary to the target role.

Keep it concise.

Emphasize the candidate's strongest relevant positioning, such as:

- full-stack engineering
- product engineering
- startup ownership
- AI/LLM systems
- backend/frontend development
- end-to-end product development

Do not introduce a new specialization that is unsupported by the
master resume.

==================================================
ONE-PAGE PRIORITY
==================================================

When space is limited, remove material in approximately this order:

1. Low-relevance experience.
2. Low-relevance project bullets.
3. Low-relevance technical bullets.
4. Less important technologies.

Do NOT remove strong relevant engineering evidence merely to preserve
less relevant experience.

A strong one-page technical resume should contain the highest-value
evidence, not necessarily every section or bullet from the master
resume.

==================================================
RESUME FORMAT
==================================================

Create a clean, ATS-friendly, single-column resume.

Use these sections:

# Name

Contact information

## Summary

## Experience

## Projects

## Technologies

## Education

Keep the resume concise and suitable for one page.

Use ordinary bullets.

Do not use tables.

Do not use columns.

Do not add unnecessary sections.

Preserve the candidate's actual contact information from the master
resume.

==================================================
SECTION ORDER — MANDATORY
==================================================

The resume MUST contain sections in exactly this order:

1. # Name
2. Contact information
3. ## Summary
4. ## Experience
5. ## Projects
6. ## Technologies
7. ## Education

Never place Technologies before Experience.

Never duplicate a section.

Do not output an empty section.

If a section has no relevant content, omit it rather than creating
an empty section.

The section headings must be exactly:

## Summary
## Experience
## Projects
## Technologies
## Education

==================================================
FINAL QUALITY CHECK
==================================================

Before returning the resume, verify:

- Every claim is supported by the master resume.
- No technology was added from the job description.
- No employer or role was invented.
- No metric was invented.
- Relevant technical evidence was not unnecessarily removed.
- The Technologies section contains relevant technologies supported
  by the master resume.
- The resume remains concise and suitable for one page.
- The resume is tailored to THIS job rather than being a generic
  copy of the master resume.

==================================================
MASTER RESUME
==================================================

${masterResume}

==================================================
JOB DESCRIPTION
==================================================

${job.description}

==================================================
OUTPUT
==================================================

Return ONLY the tailored resume in Markdown.

Before returning it, verify the mandatory section order and remove
any duplicate or empty sections.

Do not return JSON.

Do not explain your decisions.

Do not add commentary before or after the resume.
`.trim();
}

module.exports = {
  TAILORING_PROMPT_VERSION,
  buildTailoringPrompt,
};
