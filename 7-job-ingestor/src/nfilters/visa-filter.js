function hasNoVisaSponsorship(description) {
  if (!description || typeof description !== 'string') {
    return false;
  }

  return /no visa sponsorship available|must be a us citizen/i.test(description);
}

module.exports = {
  hasNoVisaSponsorship,
};
