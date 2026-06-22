const { supabase } = require('../db/db');

async function isEmailProcessed(messageId) {
  const { data, error } = await supabase
    .from('processed_emails')
    .select('gmail_message_id')
    .eq('gmail_message_id', messageId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}

module.exports = {
  isEmailProcessed,
};
