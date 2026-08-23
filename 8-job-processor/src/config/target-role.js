const TARGET_ROLE_VERSION = 2;

const TARGET_ROLE = `
I am looking for early-stage startup roles where I can work as
a full-stack/product engineer and take significant ownership.

Preferred work:
- Build MVPs and production features
- Full-stack JavaScript/Node.js
- Vue/Nuxt
- PostgreSQL
- AI/LLM integrations
- Work directly with founders
- Product + engineering ownership
- Early-stage startups

Not primarily looking for:
- Pure frontend roles
- Pure backend infrastructure roles
- QA/testing roles
- Highly specialized enterprise roles
- Roles with little product ownership

Technology selection is a hard requirement for job evaluation.

A job should only proceed to normal fit scoring when its required
technology stack is compatible with my technology policy.

If a required core technology is explicitly excluded, the job must
receive a fit score of 0.

Technologies that I am already familiar with are preferred.

Technologies that I can learn quickly are acceptable for the role
and should not prevent the job from proceeding to fit scoring.

Technologies that are excluded should not be pursued when they are
required/core to the role.
`;

const TECHNOLOGY_POLICY = {
  /*
   * Technologies I already know and can work with immediately.
   */
  familiar: [
    'JavaScript',
    'Node.js',
    'Express.js',
    'REST APIs',

    'Vue.js',
    'Nuxt.js',

    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Supabase',

    'Docker',
    'AWS',
    'Railway',
    'Vercel',

    'Git',
    'GitHub',
    'GitHub Actions',
    'Linux',

    'OpenAI API',
    'Ollama',
    'LLM APIs',
    'RAG',
    'Vector databases',
    'pgvector',
    'AI agents',
    'Embeddings',
  ],

  /*
   * Technologies that are close enough to the existing stack
   * that I am willing to learn them for a role.
   */
  learn_quickly: [
    'React',
    'Next.js',
    'TypeScript',
    'Redis',
    'Prisma',
    'Drizzle ORM',
    'GraphQL',
    'NestJS',
    'Jest',
    'Playwright',
    'WebSockets',
    'Socket.IO',
  ],

  /*
   * Technologies I do not want to learn/pursue for this
   * job search.
   *
   * If one of these is a required/core technology for a job,
   * the job fails the technology gate and receives fit_score = 0.
   */
  excluded: [
    'Angular',
    'Python',
    'Django',
    'FastAPI',
    'Java',
    'Spring Boot',
    'C#',
    '.NET',
    'Ruby',
    'Rails',
    'PHP',
    'Laravel',
    'Go',
    'Rust',
    'Kotlin',
    'Swift',
    'Kubernetes',
  ],
};

const SALARY_TARGET = {
  currency: 'INR',
  minimum: 600000,
  desired: 1000000,
};

const TECHNOLOGY_ALIASES = {
  MERN: ['MongoDB', 'Express.js', 'React', 'Node.js'],
  MEVN: ['MongoDB', 'Express.js', 'Vue.js', 'Node.js'],
  PERN: ['PostgreSQL', 'Express.js', 'React', 'Node.js'],
};

module.exports = {
  TARGET_ROLE_VERSION,
  TARGET_ROLE,
  SALARY_TARGET,
  TECHNOLOGY_POLICY,
  TECHNOLOGY_ALIASES,
};
