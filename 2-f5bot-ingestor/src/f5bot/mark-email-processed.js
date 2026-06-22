const { supabase } = require('../db/db');

async function markEmailProcessed(messageId) {
  const { error } = await supabase.from('processed_emails').upsert({
    gmail_message_id: messageId,
  });

  if (error) {
    throw error;
  }
}

module.exports = {
  markEmailProcessed,
};
