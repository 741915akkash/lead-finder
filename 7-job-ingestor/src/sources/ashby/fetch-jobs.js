async function fetchJobs(boardName) {
  const url =
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}` + '?includeCompensation=true';

  console.log('Fetching Ashby:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Ashby API returned ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data.jobs || [];
}

module.exports = {
  fetchJobs,
};
