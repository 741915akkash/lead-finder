function getBoardToken(atsUrl) {
  const url = new URL(atsUrl);

  const boardToken = url.pathname.split('/').filter(Boolean)[0];

  if (!boardToken) {
    throw new Error(`Invalid Greenhouse ATS URL: ${atsUrl}`);
  }

  return boardToken;
}

async function fetchJobs(atsUrl) {
  const boardToken = getBoardToken(atsUrl);

  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;

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
