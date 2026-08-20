const { extractTechnologies } = require('./ai/extract-technologies');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(result, technology) {
  assert(result.includes(technology), `Expected technologies to include "${technology}"`);
}

function assertNotIncludes(result, technology) {
  assert(!result.includes(technology), `Expected technologies NOT to include "${technology}"`);
}

function testJob104() {
  const description = `
We're an early-stage team building a 0-to-1 product.

What we're looking for
2+ years building full stack products.
Strong React.
Strong Python FastAPI.

Nice to have
Distributed job execution and orchestration — Celery, Ray, Dask, Kubernetes.
Scientific or numerical computing at scale (NumPy, SciPy, pandas).
Rich interactive UI work — React Flow, D3, WebGL.
Building on LLM APIs beyond prototypes.
`;

  const result = extractTechnologies(description);

  assertIncludes(result, 'React');
  assertIncludes(result, 'Python');
  assertIncludes(result, 'FastAPI');

  assertIncludes(result, 'Celery');
  assertIncludes(result, 'Ray');
  assertIncludes(result, 'Dask');
  assertIncludes(result, 'Kubernetes');

  assertIncludes(result, 'NumPy');
  assertIncludes(result, 'SciPy');
  assertIncludes(result, 'pandas');

  assertIncludes(result, 'React Flow');
  assertIncludes(result, 'D3');
  assertIncludes(result, 'WebGL');

  assertIncludes(result, 'LLM APIs');

  assertNotIncludes(result, 'Distributed job execution');
  assertNotIncludes(result, 'Scientific computing');
  assertNotIncludes(result, 'Interactive UI');
  assertNotIncludes(result, 'GitHub Actions');
  assertNotIncludes(result, 'Node.js');
  assertNotIncludes(result, 'PostgreSQL');

  console.log('✓ Job 104 technology extraction passed');
}

function testCaseInsensitive() {
  const result = extractTechnologies(`
    NODE.JS
    POSTGRESQL
    Docker
    AWS
  `);

  assertIncludes(result, 'Node.js');
  assertIncludes(result, 'PostgreSQL');
  assertIncludes(result, 'Docker');
  assertIncludes(result, 'AWS');

  console.log('✓ Case-insensitive extraction passed');
}

function testAliases() {
  const result = extractTechnologies(`
    Node
    NodeJS
    Postgres
    Mongo
    K8s
  `);

  assertIncludes(result, 'Node.js');
  assertIncludes(result, 'MongoDB');
  assertIncludes(result, 'Kubernetes');

  console.log('✓ Technology aliases passed');
}

function testNoFalseRayMatch() {
  const result = extractTechnologies(`
    This application uses arrays extensively.
    The team works with array processing.
  `);

  assertNotIncludes(result, 'Ray');

  console.log('✓ False "Ray" match test passed');
}

function testEmptyInput() {
  assert(Array.isArray(extractTechnologies(null)), 'Null input should return an array');

  assert(extractTechnologies(null).length === 0, 'Null input should return an empty array');

  assert(extractTechnologies('').length === 0, 'Empty input should return an empty array');

  console.log('✓ Empty input test passed');
}

function run() {
  console.log('Testing technology extraction...\n');

  testJob104();
  testCaseInsensitive();
  testAliases();
  testNoFalseRayMatch();
  testEmptyInput();

  console.log('\n✓ All technology extraction tests passed');
}

try {
  run();
} catch (error) {
  console.error('\n✗ Test failed');
  console.error(error);
  process.exit(1);
}
