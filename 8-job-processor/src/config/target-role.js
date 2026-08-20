const TARGET_ROLE_VERSION = 1;

const TARGET_ROLE = `
I am looking for early-stage startup roles where I can work as
a full-stack/product engineer and take significant ownership.

Preferred work:
- Build MVPs and production features
- Full-stack JavaScript/Node.js
- Vue/Nuxt or similar frontend frameworks
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
`;

const FAMILIAR_TECHNOLOGIES = {
  core: [
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
  ],

  ai: ['OpenAI API', 'Ollama', 'LLM APIs', 'RAG', 'Vector databases', 'pgvector', 'AI agents', 'Embeddings'],

  stacks: ['MEVN', 'PERN', 'Nuxt + Node.js'],
};

const SALARY_TARGET = {
  currency: 'INR',
  minimum: 600000,
  desired: 1000000,
};

module.exports = {
  TARGET_ROLE_VERSION,
  TARGET_ROLE,
  SALARY_TARGET,
  FAMILIAR_TECHNOLOGIES,
};
