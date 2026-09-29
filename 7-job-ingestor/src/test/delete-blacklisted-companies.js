require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { supabase } = require('../db/db');

async function deleteBlacklistedCompanies() {
  const filePath = path.join(__dirname, '../../data/company-not-to-take.txt');

  if (!fs.existsSync(filePath)) {
    console.log('❌ Blacklist file not found:', filePath);
    return;
  }

  // ----------------------------------
  // READ BLACKLIST
  // ----------------------------------

  const excludedCompanies = new Set(
    fs
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line && !line.startsWith('#')),
  );

  console.log('\nBlacklist:');
  console.log([...excludedCompanies]);

  // ----------------------------------
  // GET COMPANIES
  // ----------------------------------

  const { data: companies, error: fetchError } = await supabase
    .from('companies')
    .select('id, name, domain, ats_board_name');

  if (fetchError) {
    throw fetchError;
  }

  console.log(`\nFound ${companies.length} companies`);

  // ----------------------------------
  // FIND MATCHES
  // ----------------------------------

  const blacklisted = companies.filter((company) => {
    const name = (company.name || '').trim().toLowerCase();
    const domain = (company.domain || '').trim().toLowerCase();
    const boardName = (company.ats_board_name || '').trim().toLowerCase();

    return excludedCompanies.has(name) || excludedCompanies.has(domain) || excludedCompanies.has(boardName);
  });

  console.log(`\nBlacklisted matches: ${blacklisted.length}`);

  if (!blacklisted.length) {
    console.log('Nothing to delete.');
    return;
  }

  // ----------------------------------
  // DELETE
  // ----------------------------------

  for (const company of blacklisted) {
    console.log(`🗑 Deleting: ${company.id} | ${company.name} | ${company.domain} | ${company.ats_board_name}`);

    const { data, error } = await supabase.from('companies').delete().eq('id', company.id).select();

    if (error) {
      console.error(`❌ Failed to delete ${company.name}:`, error.message);
      continue;
    }

    console.log(`✅ Deleted: ${company.name}`);
    console.log('Deleted rows:', data);
  }

  console.log('\nDone.');
}

deleteBlacklistedCompanies().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
