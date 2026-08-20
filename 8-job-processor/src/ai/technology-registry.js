const TECHNOLOGY_REGISTRY = {
  // JavaScript / full-stack stacks

  MERN: ['mern'],

  MEVN: ['mevn'],

  PERN: ['pern'],

  Nuxt: ['nuxt', 'nuxt.js'],

  'Node.js': ['node.js', 'nodejs', 'node'],

  'Express.js': ['express.js', 'expressjs', 'express'],

  'REST APIs': [
    'rest api',
    'rest apis',
    'restful api',
    'restful apis',
  ],

  // Databases

  PostgreSQL: ['postgresql', 'postgres'],

  MySQL: ['mysql'],

  MongoDB: ['mongodb', 'mongo'],

  Supabase: ['supabase'],

  // AI / LLM

  'OpenAI API': [
    'openai api',
    'openai apis',
  ],

  Ollama: ['ollama'],

  'LLM APIs': [
    'llm',
    'llms',
    'llm api',
    'llm apis',
    'large language model',
    'large language models',
    'ai/llm',
    'ai/llm api',
    'ai/llm apis',
  ],

  RAG: [
    'rag',
    'retrieval augmented generation',
    'retrieval-augmented generation',
  ],

  'Vector databases': [
    'vector database',
    'vector databases',
  ],

  pgvector: ['pgvector'],

  'AI agents': [
    'ai agent',
    'ai agents',
  ],

  Embeddings: [
    'embedding',
    'embeddings',
  ],

  // Infrastructure / deployment

  AWS: [
    'aws',
    'amazon web services',
  ],

  Docker: ['docker'],

  Railway: ['railway'],

  Vercel: ['vercel'],

  // Development tools

  Git: ['git'],

  GitHub: ['github'],

  'GitHub Actions': ['github actions'],

  Linux: ['linux'],

  // Common technologies we need to recognize
  // even though they are not in the familiar stack

  React: ['react'],

  'Next.js': [
    'next.js',
    'nextjs',
    'next',
  ],

  TypeScript: [
    'typescript',
    'ts',
  ],

  Python: ['python'],

  FastAPI: ['fastapi'],

  Kubernetes: [
    'kubernetes',
    'k8s',
  ],

  Celery: ['celery'],

  Ray: ['ray'],

  Dask: ['dask'],

  NumPy: ['numpy'],

  SciPy: ['scipy'],

  pandas: ['pandas'],

  'React Flow': ['react flow'],

  D3: [
    'd3.js',
    'd3',
  ],

  WebGL: ['webgl'],
};

const FAMILIAR_TECHNOLOGIES = new Set([
  'MERN',
  'MEVN',
  'PERN',
  'Nuxt',
  'Node.js',
  'Express.js',
  'REST APIs',

  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Supabase',

  'OpenAI API',
  'Ollama',
  'LLM APIs',
  'RAG',
  'Vector databases',
  'pgvector',
  'AI agents',
  'Embeddings',

  'AWS',
  'Docker',
  'Railway',
  'Vercel',

  'Git',
  'GitHub',
  'GitHub Actions',
  'Linux',
]);

module.exports = {
  TECHNOLOGY_REGISTRY,
  FAMILIAR_TECHNOLOGIES,
};