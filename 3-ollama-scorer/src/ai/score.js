require('dotenv').config();

const axios = require('axios');

async function scoreLead(post) {
  const prompt = `
You are scoring Reddit posts for relevance to a Founder Operating System.

The product helps founders:

* validate startup ideas
* conduct customer discovery
* interview users
* find early adopters
* test demand
* understand customer problems
* make better product decisions
* find traction
* reach product-market fit
* avoid building products nobody wants

Your goal is to identify founders experiencing problems that this product could help solve.

Score from 0-100.

100
Founder is directly struggling with validation, customer discovery, traction, product-market fit, demand validation, customer understanding, or has evidence they may be building the wrong thing.

80
Founder is discussing startup uncertainty, prioritization, customer research, early users, feedback, product decisions, growth challenges, retention, activation, or learning what customers actually want.

60
General startup discussion that may indirectly relate to validation, customers, traction, or founder decision making.

40
Startup discussion with weak relevance.

20
Founder-related topic but unlikely to benefit from this product.

0
Not related to founders, startups, customers, products, validation, traction, or product-market fit.

Important Rules:

* Score based on founder pain, not specific features.
* Score based on the underlying problem, not keywords.
* Use both the title and the body together. The body may contain the real pain signal even when the title is generic.
* Founders who are confused, stuck, uncertain, or seeking evidence should score higher.
* Customer, traction, validation, and decision-making problems should score highest.
* Do not assume relevance from startup buzzwords.
* If the title or body suggests wasted effort, poor traction, lack of customers, conflicting feedback, unclear direction, or uncertainty, score aggressively.

Examples:

Title: We have 200 signups but only 5 people actually use the product
Score: 100

Title: Customers keep saying they want it, but nobody buys
Score: 100

Title: We've pivoted 4 times and still haven't found traction
Score: 100

Title: I spent 8 months building and nobody uses it
Score: 100

Title: How many customer interviews should I do before building?
Score: 100

Title: My mentor says build it, customers say don't
Score: 95

Title: Customers love the demo but never come back
Score: 95

Title: I have 500 users but only 3 pay
Score: 95

Title: How do you find your first 10 users?
Score: 90

Title: Not sure whether to pursue Idea A or Idea B
Score: 90

Title: How do you know which customer feedback to trust?
Score: 90

Title: We keep adding features but growth hasn't improved
Score: 90

Title: Should I bring on a cofounder?
Score: 60

Title: Is YC worth applying to?
Score: 50

Title: How do I recruit a CTO?
Score: 40

Title: How much equity should I give an advisor?
Score: 40

Title: How do I raise a pre-seed round?
Score: 30

Title: Best accounting software for startups?
Score: 10

Title: Which LLC formation service should I use?
Score: 10

Title: Show us your desk setup
Score: 0

Return ONLY valid JSON:

{
"score": 0,
"reason": ""
}

Title:
${post.title}

Body:
${post.body || ''}

`;

  const response = await axios.post(`${process.env.OLLAMA_URL}/api/generate`, {
    model: process.env.OLLAMA_MODEL,
    prompt,
    stream: false,
    format: 'json',
    think: false,
    options: {
      temperature: 0,
    },
  });

  try {
    const result = JSON.parse(response.data.response);

    return {
      ...result,
      score_reason: result.score_reason || result.reason || '',
    };
  } catch {
    return {
      score: 0,
      reason: 'invalid ai response',
      score_reason: 'invalid ai response',
    };
  }
}

module.exports = {
  scoreLead,
};
