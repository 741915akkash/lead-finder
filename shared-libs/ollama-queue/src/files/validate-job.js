function validateJob({ jobType, payload, priority }) {
  if (!jobType) {
    throw new Error('jobType required');
  }

  if (payload === undefined) {
    throw new Error('payload required');
  }

  if (priority !== undefined && typeof priority !== 'number') {
    throw new Error('priority must be number');
  }
}

module.exports = {
  validateJob,
};
