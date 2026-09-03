const fs = require('fs');
const path = require('path');

const { fetchNextEligibleJob, savePackets } = require('../repositories/job-posting-repository');

const { buildApplicationPacket } = require('../packets/application-packet');

const { buildNetworkingPacket } = require('../packets/networking-packet');

const MASTER_RESUME_PATH = path.join(__dirname, '..', 'master-resume', 'master-resume.md');

function loadMasterResume() {
  if (!fs.existsSync(MASTER_RESUME_PATH)) {
    throw new Error(`Master resume not found: ${MASTER_RESUME_PATH}`);
  }

  const masterResume = fs.readFileSync(MASTER_RESUME_PATH, 'utf8').trim();

  if (!masterResume) {
    throw new Error('Master resume is empty.');
  }

  return masterResume;
}

async function processNextJob() {
  const job = await fetchNextEligibleJob();

  if (!job) {
    return false;
  }

  console.log('--------------------------------------');
  console.log('PROCESSING APPLICATION PACKET');
  console.log('--------------------------------------');
  console.log(`Job ID: ${job.id}`);
  console.log(`Company: ${job.company || 'Unknown'}`);
  console.log(`Title: ${job.title || 'Unknown'}`);
  console.log(`Fit score: ${job.fit_score}`);
  console.log('');

  if (!job.description) {
    throw new Error(`Job ${job.id} has no description.`);
  }

  const masterResume = loadMasterResume();

  console.log('Building application packet...');

  const applicationPacket = buildApplicationPacket({
    job,
    masterResume,
  });

  console.log(`Application packet: ${applicationPacket.length} characters`);

  console.log('Building networking packet...');

  const networkingPacket = buildNetworkingPacket({
    job,
    masterResume,
  });

  console.log(`Networking packet: ${networkingPacket.length} characters`);

  console.log('Saving packets to Supabase...');

  await savePackets({
    jobId: job.id,
    applicationPacket,
    networkingPacket,
  });

  console.log(`✓ Packets saved for job ${job.id}`);

  return true;
}

module.exports = {
  processNextJob,
};
