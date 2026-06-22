function buildPrompt(post) {
  return `
Analyze this Reddit post.

Return ONLY valid JSON.

{
 "pain_cluster":"",
 "icp":"",
 "confidence":0,
 "summary":""
}

Title:
${post.title}

Subreddit:
${post.subreddit}
`;
}

module.exports = {
  buildPrompt,
};
