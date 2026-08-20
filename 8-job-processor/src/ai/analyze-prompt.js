function buildAnalyzePrompt({ targetRole, job, detectedTechnologies = [] }) {
  return `
You are analyzing a job posting against a target role.

Your task is to compare the job with the target role and return ONLY valid JSON.

TARGET ROLE:
${targetRole}

JOB:
Title: ${job.title ?? null}
Company: ${job.company ?? null}
Location: ${job.location ?? null}
Employment Type: ${job.employment_type ?? null}
Workplace Type: ${job.workplace_type ?? null}

DESCRIPTION:
${job.description ?? null}

DETERMINISTICALLY DETECTED TECHNOLOGIES:
${JSON.stringify(detectedTechnologies)}

IMPORTANT TECHNOLOGY CLASSIFICATION RULE:

The technology list above was extracted deterministically from the
job description.

You MUST NOT discover, invent, rename, or add technologies.

You may ONLY classify technologies from this list.

Your task is to divide the detected technologies into:

1. required
2. nice_to_have

You do NOT need to put every detected technology into either bucket.

Only classify a technology into a bucket when the job description
provides enough evidence about its importance.

If the importance is unclear, do not force it into required.
Use nice_to_have only when the job indicates it is optional, preferred,
bonus, nice-to-have, or otherwise non-central.

ROLE:

1. role.label must be exactly one of:
   - "direct"
   - "adjacent"
   - "unrelated"

2. "direct" means the job is fundamentally the type of role described
   by the target role.

3. "adjacent" means the job is reasonably related but is not the target role.

4. "unrelated" means the job is substantially different from the target role.

5. Do not assign a numerical score to the role.

TECHNOLOGY:

6. technology.labels must contain technologies from the
   DETERMINISTICALLY DETECTED TECHNOLOGIES list.

7. technology.labels must NOT contain technologies outside that list.

8. technology.required must contain technologies that are explicitly
   required, strongly expected, or clearly central to the role.

9. technology.nice_to_have must contain technologies explicitly
   described as:
   - nice to have
   - bonus
   - preferred
   - optional
   - plus
   - desirable
   - or equivalent language

10. Do not assume that every technology mentioned near the role
    is required.

11. Do not infer that a technology is required merely because it
    appears in the job description.

12. If the job provides insufficient evidence about a technology's
    importance, leave it out of both required and nice_to_have.

13. Every technology in required must also appear in labels.

14. Every technology in nice_to_have must also appear in labels.

15. A technology must NOT appear in both required and nice_to_have.

16. Do not invent technologies.

17. Do not calculate technology.score.

18. technology.score must NOT appear in the output.

19. The technology reason should briefly explain the strongest
    technology overlap or lack of overlap with the target role.

IMPORTANT REQUIRED-TECHNOLOGY INTERPRETATION

Do NOT automatically treat every technology mentioned in a
"Required Skills" section as independently required.

Interpret the wording carefully.

Examples:

"React.js / Next.js"
→ treat as alternatives; do not automatically classify both as required.

"MongoDB, PostgreSQL, or MySQL"
→ treat as alternative database options; do not automatically
classify all three as required.

"PostgreSQL or equivalent"
→ PostgreSQL is required; the unspecified equivalent is not a technology
that can be added to the output.

"experience with A, B, C"
→ these may be required if the surrounding sentence clearly makes
the entire list required.

"technologies such as A, B, C"
→ do not automatically assume every technology is individually required.
Use the surrounding context.

"familiarity with A, B, C"
→ normally classify these as nice-to-have unless the surrounding
description clearly establishes them as core requirements.

"some of the following are valuable"
→ classify the listed technologies as nice-to-have.

"bonus", "good to have", "nice to have", "preferred", "plus"
→ nice-to-have.

A technology should be classified as required only when the job
provides reasonably strong evidence that the candidate is expected
to know or use it.

When evidence is ambiguous, prefer leaving the technology out of
required/nice_to_have rather than guessing.

IMPORTANT:

The target role's familiarity with a technology does NOT determine
whether that technology is required or nice-to-have.

The job description determines the bucket.

The deterministic scoring system will later determine how familiar
those technologies are to the candidate.

COMPANY:

20. company.stage_label must be one of:
   - "pre-seed"
   - "seed"
   - "early-stage"
   - "growth"
   - "enterprise"
   - "unknown"

21. company.size_label must be one of:
   - "1-10"
   - "11-50"
   - "51-200"
   - "201-500"
   - "501-1000"
   - "1001+"
   - "unknown"

22. Only assign a company stage or size when supported by evidence
    in the job posting.

23. Do not infer exact company size from vague language.

24. If the job says "early-stage", that is valid evidence for
    stage_label = "early-stage".

25. If company size is not stated or supported, use "unknown".

26. Do not calculate company.score.

27. company.score must NOT appear in the output.

COMPANY EVIDENCE RULE

Company stage and company size MUST be determined exclusively from
the JOB text.

NEVER use the TARGET ROLE to infer company stage or company size.

For example, if the target role says "early-stage startups", that
does NOT mean the job's company is early-stage.

If the job itself does not provide evidence for company stage,
return:

"stage_label": "unknown"

Likewise, do not infer early-stage merely because the company:
- builds AI products
- has founders
- has a small-looking team
- is hiring an early employee
- works on a new product
- uses phrases like "fast-moving"
- appears to be a startup

Only explicit or strong evidence in the job posting should be used.


GENERAL:

28. Reasons must be concise and based on evidence from the job.

29. Return JSON only.

30. No markdown.

31. No explanation outside JSON.

OUTPUT FORMAT:

{
  "role": {
    "label": "direct",
    "reason": "..."
  },
  "technology": {
    "labels": [],
    "required": [],
    "nice_to_have": [],
    "reason": "..."
  },
  "company": {
    "size_label": "unknown",
    "stage_label": "unknown",
    "reason": "..."
  }
}
`;
}

module.exports = {
  buildAnalyzePrompt,
};
