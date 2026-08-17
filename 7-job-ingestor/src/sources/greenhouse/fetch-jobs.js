async function fetchJobs(boardToken) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;

  console.log('Fetching Greenhouse:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Greenhouse API returned ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data.jobs || [];
}

module.exports = {
  fetchJobs,
};
