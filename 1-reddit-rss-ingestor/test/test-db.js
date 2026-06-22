require('dotenv').config();

const { supabase } = require('../src/db/db');

async function run() {
  const { count, error } = await supabase.from('reddit_posts').select('*', {
    count: 'exact',
    head: true,
  });

  if (error) {
    console.error(error);
    return;
  }

  console.log('Connected');
  console.log('Rows:', count);
}

run();
