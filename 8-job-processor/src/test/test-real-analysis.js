require('dotenv').config();

const { analyzeJob } = require('../ai/analyze-job');
const { calculateTechnologyScore } = require('../ai/technology-score');
const { calculateCompanyScore } = require('../ai/company-score');
const { calculateSalaryScore } = require('../normalizers/salary-score');
const { TARGET_ROLE } = require('../config/target-role');

const jobs = [
  {
    id: 101,
    test_type: 'EXPLICIT REQUIRED / NICE-TO-HAVE',
    title: 'Full Stack Developer',
    company: 'India Tech Engine',
    location: 'Thane, Maharashtra / Hybrid',
    employment_type: 'full-time',
    workplace_type: 'hybrid',

    salary_min: 2000000,
    salary_max: 3000000,
    salary_currency: 'USD',

    description: `
Job Title: Full Stack Developer (React.js + Node.js)

About India Tech Engine

India Tech Engine is a full-stack development company helping businesses
with digital transformation through custom software development,
web and mobile applications, automation solutions, and scalable
technology products.

We are looking for a Full Stack Developer who can contribute to
building high-quality web and mobile applications for our clients
and internal products.

Responsibilities

Develop and maintain responsive web applications using modern
JavaScript frameworks.

Build scalable backend services and REST APIs.

Work on frontend architecture, UI components, and application
performance.

Design and integrate APIs with frontend and mobile applications.

Work with databases, authentication, third-party integrations,
and cloud services.

Required Skills

Strong proficiency in JavaScript / TypeScript.

Hands-on experience with React.js / Next.js.

Experience with Node.js and Express.js.

Good understanding of REST APIs.

Experience with databases such as MongoDB, PostgreSQL, or MySQL.

Familiarity with Git and version control systems.

Understanding of responsive design and frontend best practices.

Good To Have

Experience with React Native mobile application development.

Experience with cloud platforms like AWS, Azure, or Google Cloud.

Knowledge of CI/CD processes.

Experience working on SaaS, enterprise applications, or client projects.

Understanding of UI/UX principles.

Experience working in an agile development environment.
`,
  },

  {
    id: 102,
    test_type: 'TECHNOLOGIES SPRINKLED THROUGHOUT',
    title: 'Founding Full Stack Engineering',
    company: 'Vantrix Ventures',
    location: 'Bengaluru',
    employment_type: 'full-time',
    workplace_type: null,

    salary_min: 300000,
    salary_max: 500000,
    salary_currency: 'INR',

    description: `
Founding Full Stack Engineer

Vantrix Screen is building an AI-native technical assessment platform
that helps companies identify exceptional engineering talent through
practical evaluations, structured interviews, and intelligent automation.

We're still early, moving fast, and building the company from first principles.

The Opportunity

We're looking for a Founding Engineering Lead to work directly with
the founder in building the engineering foundation of Vantrix Screen.

This isn't a traditional engineering management role.

You'll write code.
You'll design systems.
You'll influence product.
You'll speak with customers.
You'll shape engineering culture.

What You'll Do

Build core platform capabilities end-to-end.

Design scalable backend and frontend architecture.

Ship product rapidly with high engineering standards.

Participate in product strategy and roadmap discussions.

Work closely with customers to understand pain points.

Own technical decisions across the platform.

Bonus Points

Startup experience.

Built products from scratch.

Experience with AI/LLM-based products.

Tech Stack

We're pragmatic rather than opinionated.

You'll help shape our stack, but familiarity with some of the following
is valuable:

TypeScript
React
Next.js
Node.js
Python
PostgreSQL
Docker
AWS
AI APIs / LLMs
`,
  },

  {
    id: 103,
    test_type: 'VAGUE / SPARSE TECHNOLOGY INFORMATION',
    title: 'Full-Stack Engineer (AI Agents)',
    company: 'Goma AI',
    location: 'Singapore',
    employment_type: 'full-time',
    workplace_type: 'onsite or remote',

    salary_min: null,
    salary_max: null,
    salary_currency: 'SGD',

    description: `
Build AI Products

Develop and maintain AI-powered WhatsApp agents.

Build full-stack features using modern web technologies.

Integrate APIs, CRMs, payment systems, and third-party business tools.

Design workflows that combine LLMs, retrieval, and automation.

Debug production issues and continuously improve reliability.

Work Directly with Customers

Join customer onboarding and discovery calls.

Understand business workflows and translate them into AI solutions.

Configure, customize, and deploy AI agents for clients.

Gather feedback and rapidly iterate on product features.

Occasionally travel for enterprise meetings or demos when required.

Shape the Product

Work closely with the founders on product strategy.

Prioritize features based on customer impact.

Own projects end-to-end from idea to deployment.

Help establish engineering best practices as the team grows.

Location

Singapore

Remote work policy

Onsite or remote

Hires remotely

Everywhere

Job type

Full Time

Experience

4+ years

Skills

AI
TypeScript
postgres
`,
  },
];

function calculateFinalScore(technologyScore, companyScore, salaryScore) {
  if (technologyScore == null || companyScore == null || salaryScore == null) {
    return null;
  }

  return technologyScore * 0.5 + companyScore * 0.25 + salaryScore * 0.25;
}

async function analyzeOneJob(job) {
  console.log();
  console.log('======================================');
  console.log(`${job.test_type}`);
  console.log('======================================');
  console.log();

  console.log('Job:', job.id);
  console.log('Title:', job.title);
  console.log('Company:', job.company);
  console.log();

  const result = await analyzeJob(job, TARGET_ROLE);

  console.log('QWEN OUTPUT:');
  console.log(JSON.stringify(result, null, 2));

  console.log();
  console.log('======================================');
  console.log('DETERMINISTIC SCORING');
  console.log('======================================');
  console.log();

  const technologyResult = calculateTechnologyScore(result.technology);

  const companyResult = calculateCompanyScore(result.company);

  const salaryResult = calculateSalaryScore(job.salary_min);

  const finalScore = calculateFinalScore(technologyResult.score, companyResult.score, salaryResult.score);

  console.log('Role:', result.role.label);

  console.log('Technology score:', technologyResult.score);

  console.log('Technology label:', technologyResult.label);

  console.log('Company score:', companyResult.score);

  console.log('Company label:', companyResult.label);

  console.log('Salary score:', salaryResult.score);

  console.log('Salary label:', salaryResult.label);

  console.log('FINAL SCORE:', finalScore);

  console.log();
  console.log('SUMMARY');
  console.log();

  console.log({
    job_id: job.id,
    test_type: job.test_type,
    company: job.company,

    role_label: result.role.label,

    technology_score: technologyResult.score,
    technology_label: technologyResult.label,

    company_score: companyResult.score,
    company_label: companyResult.label,

    salary_score: salaryResult.score,
    salary_label: salaryResult.label,

    final_score: finalScore,
  });

  console.log();
  console.log('Database was NOT modified.');
}

async function run() {
  console.log('======================================');
  console.log('STAGE 2 MULTI-JOB ANALYSIS TEST');
  console.log('======================================');
  console.log();

  console.log('Testing:', jobs.length, 'different job-description structures');

  console.log();
  console.log('1. Explicit required / nice-to-have');
  console.log('2. Technologies sprinkled throughout');
  console.log('3. Vague / sparse technology information');

  for (const job of jobs) {
    await analyzeOneJob(job);
  }

  console.log();
  console.log('======================================');
  console.log('ALL JOBS COMPLETED');
  console.log('======================================');
}

run().catch((error) => {
  console.error();
  console.error('✗ Analysis failed');
  console.error(error);
  process.exit(1);
});
