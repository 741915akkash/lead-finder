const { supabase } = require('./db');

async function updateScore(id, result) {
  const { error } = await supabase
    .from('reddit_posts')
    .update({
      score: result.score,

      score_reason: result.score_reason,

      status: 'scored',

      scored_at: new Date().toISOString(),
    })
    .eq('id', id);

  console.log('in ollama-scorer/db/update-score.js updating for post id:', id);

  if (error) throw error;
}

module.exports = {
  updateScore,
};
