const { supabase } = require('../../db/db');

async function saveKeywordStats(stats) {
  for (const row of stats) {
    const { error } = await supabase.from('keyword_stats').upsert(row, {
      onConflict: 'keyword',
    });

    if (error) {
      throw error;
    }
  }
}

module.exports = {
  saveKeywordStats,
};
