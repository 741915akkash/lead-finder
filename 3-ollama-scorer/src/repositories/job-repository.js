const { supabase } = require('../db/db');

async function insert(job) {
  const { data, error } = await supabase.from('jobs').insert(job).select().single();

  if (error) throw error;

  return data;
}

module.exports = {
  insert,
};
