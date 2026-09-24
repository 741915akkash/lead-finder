function hasNoVisaSponsorship(description) {
  if (!description || typeof description !== 'string') {
    return false;
  }

  return /no visa sponsorship available/i.test(description);
}

module.exports = {
  hasNoVisaSponsorship,
};
