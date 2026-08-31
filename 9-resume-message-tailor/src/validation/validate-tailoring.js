const REQUIRED_SECTIONS = ['## Summary', '## Experience', '## Projects', '## Technologies', '## Education'];

const FORBIDDEN_EXPERIENCE_ROLES = ['Email Copywriter — AWAI', 'Blogger — Digiluck.net'];

const TECHNOLOGY_ALIASES = {
  'react native': ['react native'],
  react: ['react'],
  'next.js': ['next.js', 'nextjs'],
  express: ['express.js', 'express'],
  'express.js': ['express.js', 'express'],
  mongodb: ['mongodb', 'mongo db'],
  postgresql: ['postgresql', 'postgres'],
  aws: ['aws'],
  docker: ['docker'],
  terraform: ['terraform'],
  vue: ['vue.js', 'vue'],
  nuxt: ['nuxt.js', 'nuxt'],
  'openai api': ['openai api', 'openai'],
  ollama: ['ollama'],
  supabase: ['supabase'],
  pgvector: ['pgvector'],
  n8n: ['n8n'],
  pm2: ['pm2'],
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function countOccurrences(text, value) {
  const normalizedText = normalize(text);
  const normalizedValue = normalize(value);

  if (!normalizedValue) {
    return 0;
  }

  let count = 0;
  let start = 0;

  while (true) {
    const index = normalizedText.indexOf(normalizedValue, start);

    if (index === -1) {
      break;
    }

    count += 1;
    start = index + normalizedValue.length;
  }

  return count;
}

function extractSection(text, heading) {
  const normalizedText = String(text || '');

  const start = normalizedText.indexOf(heading);

  if (start === -1) {
    return '';
  }

  const afterHeading = normalizedText.slice(start + heading.length);

  const nextSection = afterHeading.search(/\n##\s+/);

  if (nextSection === -1) {
    return afterHeading;
  }

  return afterHeading.slice(0, nextSection);
}

function validateRequiredSections(resume) {
  const errors = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!resume.includes(section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  return errors;
}

function validateSectionOrder(resume) {
  const errors = [];

  let previousIndex = -1;

  for (const section of REQUIRED_SECTIONS) {
    const index = resume.indexOf(section);

    if (index === -1) {
      continue;
    }

    if (index <= previousIndex) {
      errors.push(`Incorrect section order: ${section} must appear after the previous required section.`);
    }

    previousIndex = index;
  }

  return errors;
}

function validateDuplicateSections(resume) {
  const errors = [];

  for (const section of REQUIRED_SECTIONS) {
    const count = countOccurrences(resume, section);

    if (count > 1) {
      errors.push(`Duplicate section: ${section}`);
    }
  }

  return errors;
}

function validateEmptySections(resume) {
  const errors = [];

  for (const section of REQUIRED_SECTIONS) {
    const content = extractSection(resume, section)
      .replace(/[#*\-_[\]()]/g, ' ')
      .trim();

    if (!content) {
      errors.push(`Empty section: ${section}`);
    }
  }

  return errors;
}

function validateForbiddenExperience(resume, job) {
  const errors = [];

  const isTechnicalRole = isTechnicalJob(job);

  if (!isTechnicalRole) {
    return errors;
  }

  const experience = extractSection(resume, '## Experience');

  for (const role of FORBIDDEN_EXPERIENCE_ROLES) {
    if (normalize(experience).includes(normalize(role))) {
      errors.push(`Irrelevant non-technical experience included: ${role}`);
    }
  }

  return errors;
}

function isTechnicalJob(job) {
  const title = normalize(job?.title);
  const description = normalize(job?.description);

  const technicalTerms = [
    'software engineer',
    'software developer',
    'full stack',
    'full-stack',
    'frontend',
    'front-end',
    'backend',
    'back-end',
    'developer',
    'engineering',
    'devops',
    'developer',
    'javascript',
    'typescript',
    'node.js',
    'react',
    'vue',
    'python',
    'api',
    'database',
    'cloud',
    'infrastructure',
  ];

  return technicalTerms.some((term) => title.includes(term) || description.includes(term));
}

function extractMasterTechnologies(masterResume) {
  const technologiesSection = extractSection(masterResume, '## Technologies');

  const technologies = [];

  for (const [canonical, aliases] of Object.entries(TECHNOLOGY_ALIASES)) {
    const supported = aliases.some((alias) => normalize(technologiesSection).includes(normalize(alias)));

    if (supported) {
      technologies.push(canonical);
    }
  }

  return technologies;
}

function validateUnsupportedTechnologies(resume, masterResume) {
  const errors = [];

  const masterTechnologies = extractMasterTechnologies(masterResume);

  const technologiesSection = extractSection(resume, '## Technologies');

  const normalizedResumeTechnologies = normalize(technologiesSection);

  for (const [canonical, aliases] of Object.entries(TECHNOLOGY_ALIASES)) {
    const mentionedInResume = aliases.some((alias) => normalizedResumeTechnologies.includes(normalize(alias)));

    if (!mentionedInResume) {
      continue;
    }

    if (!masterTechnologies.includes(canonical)) {
      errors.push(`Unsupported technology in Technologies section: ${canonical}`);
    }
  }

  return errors;
}

function validateForbiddenTechnologyClaims(resume, masterResume) {
  const errors = [];

  const normalizedResume = normalize(resume);
  const normalizedMaster = normalize(masterResume);

  const protectedTechnologies = [
    'react native',
    'react',
    'next.js',
    'nextjs',
    'express.js',
    'mongodb',
    'postgresql',
    'aws',
    'docker',
    'terraform',
  ];

  for (const technology of protectedTechnologies) {
    const resumeHasTechnology = normalizedResume.includes(normalize(technology));

    const masterHasTechnology = normalizedMaster.includes(normalize(technology));

    if (resumeHasTechnology && !masterHasTechnology) {
      errors.push(`Resume contains unsupported technology claim: ${technology}`);
    }
  }

  return errors;
}

function validateResumeLength(resume) {
  const errors = [];

  const wordCount = normalize(resume).split(/\s+/).filter(Boolean).length;

  /*
   * This is intentionally a warning threshold rather than a hard
   * one-page guarantee. Actual page count depends on rendering,
   * font, margins, spacing, etc.
   */
  if (wordCount > 850) {
    errors.push(`Resume is probably too long for one page: approximately ${wordCount} words.`);
  }

  return errors;
}

function validateMarkdown(resume) {
  const errors = [];

  if (resume.includes('```')) {
    errors.push('Resume contains Markdown code fences.');
  }

  if (/\*\*#\s+/.test(resume)) {
    errors.push('Resume headings are incorrectly wrapped in bold Markdown.');
  }

  if (/\*\*##\s+/.test(resume)) {
    errors.push('Resume section headings are incorrectly wrapped in bold Markdown.');
  }

  if (/\*\*###\s+/.test(resume)) {
    errors.push('Resume subsection headings are incorrectly wrapped in bold Markdown.');
  }

  return errors;
}

function validateTailoredResume({ tailoredResume, masterResume, job }) {
  if (!tailoredResume || typeof tailoredResume !== 'string') {
    throw new Error('Missing tailored resume.');
  }

  if (!masterResume || typeof masterResume !== 'string') {
    throw new Error('Missing master resume.');
  }

  if (!job) {
    throw new Error('Missing job.');
  }

  const resume = tailoredResume.trim();

  const errors = [
    ...validateRequiredSections(resume),
    ...validateSectionOrder(resume),
    ...validateDuplicateSections(resume),
    ...validateEmptySections(resume),
    ...validateForbiddenExperience(resume, job),
    ...validateUnsupportedTechnologies(resume, masterResume),
    ...validateForbiddenTechnologyClaims(resume, masterResume),
    ...validateResumeLength(resume),
    ...validateMarkdown(resume),
  ];

  return {
    valid: errors.length === 0,
    errors,
    wordCount: normalize(resume).split(/\s+/).filter(Boolean).length,
  };
}

module.exports = {
  REQUIRED_SECTIONS,
  validateTailoredResume,
};
