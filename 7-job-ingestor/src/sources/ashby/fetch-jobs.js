function getBoardName(atsUrl) {
  const url = new URL(atsUrl);

  const boardName = url.pathname.split('/').filter(Boolean)[0];

  if (!boardName) {
    throw new Error(`Invalid Ashby ATS URL: ${atsUrl}`);
  }

  return boardName;
}

async function fetchJobs(atsUrl) {
  const boardName = getBoardName(atsUrl);

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
