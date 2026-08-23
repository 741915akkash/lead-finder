require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { analyzeJob } = require('./analyze-job');
const { TARGET_ROLE } = require('../config/target-role');

const OUTPUT_DIR = path.join(__dirname, '../../test-results');

const JOBS = [
  {
    id: 104,
    title: 'Full Stack Software Engineer',
    company: 'Gridbricks',
    description: `We're an early-stage team building a 0-to-1 product for the next-gen power systems.

You'll be part of small top-notch team. That means working with high ownership and autonomy in an intense startup environment.

What we're looking for
2+ years building full stack products.
Strong React. Comfortable with complex client-side state, performance work, and interfaces that go well beyond CRUD forms.
Strong Python FastAPI or an equivalent async framework. You know how to design an API that ages well.
Real rigour. You write tests, review carefully, and think about edge cases before production finds them for you.
Engineering discipline. Version control hygiene, CI, code review, documentation, observability. Best practices as habit.
Ownership instinct. You chase down ambiguity instead of waiting for a spec.

Nice to have
Distributed job execution and orchestration — Celery, Ray, Dask, Kubernetes, or equivalents
Scientific or numerical computing at scale (NumPy, SciPy, pandas)
Rich interactive UI work — canvas rendering, graph editing, custom visualization (React Flow, D3, WebGL)
Building on LLM APIs beyond prototypes: evals, structured outputs, retrieval, cost and latency control
Any background in engineering, physics, or optimization

How we work
We move fast at high intensity. Short cycles, direct feedback, and a high bar for quality.

Impact
Build tools that help the world navigate the energy transition intelligently
Direct influence on architecture and product direction
A genuinely hard technical problem in an impactful space`,
  },

  {
    id: 99,
    title: 'Full Stack Engineer (MERN + AI Agents)',
    company: 'Mytimeline',
    description: `We're a small, fast-moving team (1–10 people) building the next generation of intelligent, agentic applications.

We're looking for a Full Stack Engineer who can bridge robust MERN architecture with cutting-edge AI agent workflows.

You'll own the end-to-end development of AI-powered features across our platform.

Must-Haves

2+ years of production experience with the MERN stack (MongoDB, Express, React, Node.js)
Solid understanding of asynchronous JavaScript/TypeScript, REST/GraphQL API design, and NoSQL data modeling
Hands-on experience building with LLM APIs (OpenAI, Anthropic, or Gemini) beyond basic prompt engineering
Familiarity with at least one AI orchestration framework (LangChain, LlamaIndex, or custom agent loops)
Experience with vector databases and embedding strategies for semantic search or RAG
Comfort with Git, CI/CD, and cloud deployment basics (AWS, GCP, or Vercel/Railway)
Strong problem-solving skills and ability to work independently in a remote-first, early-stage environment

Nice-to-Have

Experience with agent frameworks like LangGraph, CrewAI, or AutoGen
Background in fine-tuning or deploying open-source models via Ollama, vLLM, or HuggingFace
Familiarity with multi-agent systems, planning algorithms, or tool-use patterns
DevOps experience: Kubernetes, Terraform, or advanced AWS architecture
Open-source contributions or side projects in the AI/LLM space
Previous startup experience—you've shipped 0→1 products before`,
  },

  {
    id: 111,
    title: 'Full Stack Developer',
    company: 'Momentum India',
    description: `We are looking for a Full Stack Developer specializing with Angular JS and NodeJS.

Must Have Skills: NodeJS, AngularJS, and working knowledge of MySQL.

5+ years of Full Stack Application development experience is a must.

Deep understanding of client-side development, coding in HTML5 CSS3 JavaScript ES6 and jQuery.

Experience with Git.

Experience with handling Services, RESTful, APIs.

Knowledge of frontend CSS frameworks like Bootstrap, Material UI and preprocessors like SASS and LESS.`,
  },

  {
    id: 97,
    title: 'Full Stack Developer',
    company: 'Billcit',
    description: `We are hiring Full Stack MERN developers to build modern, responsive web applications using React, Next.js, Node.js, and TypeScript.

Build responsive, reusable UI components using React.js and Next.js.
Design and develop REST APIs using Node.js and Express.js.
Work with SQL or NoSQL databases (PostgreSQL, MySQL, MongoDB).

Requirements

Strong understanding of modern JavaScript (ES6+) and TypeScript
Hands-on experience with React.js and Next.js
Experience building REST APIs with Node.js and Express.js
Familiarity with HTML5, CSS3, and Tailwind CSS or Bootstrap
Understanding of asynchronous programming and state management
Experience with Git and GitHub`,
  },

  {
    id: 107,
    title: 'Full Stack Engineer',
    company: 'MIRIAN AI',
    description: `MIRIAN AI is building the agentic financial operating system for PE-backed mid-market companies.

We're looking for a Founding AI Engineer who can design and build production agentic systems from scratch.

This is a true full-stack role, balanced across Go and TypeScript.

Stack: Golang, PostgreSQL, Message Queues, Next.js, React, Typescript, NodeJS, Docker, Terraform

You should have:
4+ years building and shipping production web applications end-to-end.
Strong backend skills in a statically typed language — Go preferred.
Strong frontend skills with React and TypeScript, and a modern framework (Next.js or equivalent).
Solid relational database fundamentals — PostgreSQL preferred.
Experience with API contracts and codegen.
Familiarity with event-driven / async systems.
A habit of testing across the stack.

Bonus points:
Fintech, accounting, or ERP domain knowledge
Prior 0→1 startup experience`,
  },

  {
    id: 106,
    title: 'Full Stack Engineer',
    company: 'GreenChoice',
    description: `GreenChoice is looking for a Full Stack Engineer.

As a Full Stack Engineer, you will design, build, and maintain end-to-end solutions.

You'll work across the stack—developing web and mobile experiences with React.js and React Native, while also architecting APIs, services, and data pipelines with Node.js and modern databases.

Backend:
Design, implement, and maintain RESTful and GraphQL APIs using Node.js/Express.

Databases:
SQL (MySQL/PostgreSQL) and NoSQL (MongoDB/Redis).

Required Skills:
Strong proficiency in React.js, React Native, JavaScript.
Node.js (Express or similar frameworks).
REST/GraphQL APIs.
SQL (MySQL/PostgreSQL) and NoSQL (MongoDB/Redis).
Git.

Nice to Have:
TypeScript.
Testing frameworks.
AWS, DigitalOcean, GCP.
Docker, Kubernetes.
CI/CD.
Elasticsearch.`,
  },

  {
    id: 98,
    title: 'Tech Lead – AI & Full-Stack Platform Engineering',
    company: 'Omnifi',
    description: `Omnifi is building an AI-native platform.

This is an early-stage build. You would be one of the first engineering hires.

We're hiring a hands-on Tech Lead to architect and build our AI-enabled finance operations platform.

Cloud & Infrastructure:
Design and manage infrastructure on Google Cloud Platform.

Full-Stack Application Development:
Build backend services in Node.js and frontend applications in React/TypeScript.

Database:
Work with PostgreSQL/MySQL, and Redis.

AI & Agentic Systems:
Design and build AI-agent workflows.
Integrate LLMs into operational workflows.
Work with RAG architectures and vector databases.

What We're Looking For

Required:
10+ years of software engineering experience.
Hands-on production experience with GCP.
Strong Node.js/React/TypeScript background.
Real experience building AI-enabled applications or agentic workflows.
Comfort operating with an unfinished roadmap.`,
  },

  {
    id: 90,
    title: 'Full Stack Developer (React.js + Node.js)',
    company: 'India Tech Engine',
    description: `We are looking for a Full Stack Developer.

Responsibilities:
Develop responsive web applications using modern JavaScript frameworks.
Build scalable backend services and REST APIs.
Work on frontend architecture and UI components.
Work with databases, authentication, third-party integrations, and cloud services.

Required Skills:
Strong proficiency in JavaScript / TypeScript.
Hands-on experience with React.js / Next.js.
Experience with Node.js and Express.js.
Good understanding of REST APIs.
Experience with databases such as MongoDB, PostgreSQL, or MySQL.
Familiarity with Git.

Good To Have:
React Native.
AWS, Azure, or Google Cloud.
CI/CD.
SaaS applications.
UI/UX.`,
  },

  {
    id: 110,
    title: 'Full Stack Engineer- MERN',
    company: 'Spenza',
    description: `Spenza is looking for software engineers to build and run a SaaS product.

Key Responsibilities:
Build, scale, and optimize applications using the MERN stack (MongoDB, Express, React, Node.js/Nest.js).
Deploy, monitor, and manage applications on AWS cloud services.
Integrate payment gateways.
Build reporting and analytics dashboards.
Build and maintain data pipelines.
Integrate AI tools and services.
Collaborate with product, design, and business teams.
Take ownership of features end-to-end.

Qualifications:
Minimum of 2 years in a startup environment.
Strong hands-on experience with MERN stack development.
Experience with AWS cloud services.
Familiarity with payment systems.
Knowledge of data pipelines.
Exposure to or experience with AI tools, APIs, or frameworks.
Strong debugging and problem-solving skills.`,
  },
];

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const model = process.env.OLLAMA_MODEL || 'unknown';

  const results = [];

  const totalStartedAt = Date.now();

  console.log('======================================');
  console.log('TECHNOLOGY CLASSIFICATION TEST');
  console.log('======================================');
  console.log('');
  console.log(`Model: ${model}`);
  console.log(`Jobs: ${JOBS.length}`);
  console.log('');

  for (const job of JOBS) {
    console.log(`Analyzing ${job.id}: ${job.title}`);

    const startedAt = Date.now();

    try {
      const analysis = await analyzeJob(job, TARGET_ROLE);

      const elapsedMs = Date.now() - startedAt;
      const elapsedSeconds = elapsedMs / 1000;

      results.push({
        job_id: job.id,
        title: job.title,
        company: job.company,
        elapsed_ms: elapsedMs,
        elapsed_seconds: Number(elapsedSeconds.toFixed(2)),
        success: true,
        analysis,
      });

      console.log(`✓ ${job.id} completed in ${elapsedSeconds.toFixed(2)}s`);
      console.log(`  role: ${analysis.role?.label}`);
      console.log(`  required: ${JSON.stringify(analysis.technology?.required || [])}`);
      console.log(`  nice_to_have: ${JSON.stringify(analysis.technology?.nice_to_have || [])}`);
      console.log('');
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      const elapsedSeconds = elapsedMs / 1000;

      results.push({
        job_id: job.id,
        title: job.title,
        company: job.company,
        elapsed_ms: elapsedMs,
        elapsed_seconds: Number(elapsedSeconds.toFixed(2)),
        success: false,
        error: error.message,
      });

      console.error(`✗ ${job.id} failed after ${elapsedSeconds.toFixed(2)}s: ${error.message}`);
      console.log('');
    }
  }

  const totalElapsedMs = Date.now() - totalStartedAt;
  const totalElapsedSeconds = totalElapsedMs / 1000;

  const successfulResults = results.filter((result) => result.success);

  const averageElapsedMs =
    successfulResults.length > 0
      ? successfulResults.reduce((total, result) => total + result.elapsed_ms, 0) / successfulResults.length
      : 0;

  const output = {
    generated_at: new Date().toISOString(),

    model,

    target_role_version: 1,

    job_count: JOBS.length,

    successful_jobs: successfulResults.length,

    failed_jobs: results.length - successfulResults.length,

    total_elapsed_ms: totalElapsedMs,

    total_elapsed_seconds: Number(totalElapsedSeconds.toFixed(2)),

    average_job_elapsed_ms: Math.round(averageElapsedMs),

    average_job_elapsed_seconds: Number((averageElapsedMs / 1000).toFixed(2)),

    results,
  };

  const safeModel = model.replace(/[^a-zA-Z0-9._-]/g, '_');

  const outputPath = path.join(OUTPUT_DIR, `technology-test-${safeModel}.json`);

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  console.log('======================================');
  console.log('TEST COMPLETE');
  console.log('======================================');
  console.log('');
  console.log(`Successful: ${successfulResults.length}/${JOBS.length}`);
  console.log(`Total time: ${totalElapsedSeconds.toFixed(2)}s`);
  console.log(`Average/job: ${(averageElapsedMs / 1000).toFixed(2)}s`);
  console.log('');
  console.log(`Results: ${outputPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
