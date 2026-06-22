const { validateJob } = require('./validate-job');

async function enqueueJob(repository, { jobType, payload, priority = 50 }) {
  validateJob({
    jobType,
    payload,
    priority,
  });

  return repository.insert({
    job_type: jobType,
    payload,
    priority,
    status: 'pending',
  });
}

module.exports = {
  enqueueJob,
};
