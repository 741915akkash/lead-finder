function getLocationText(job) {
  const parts = [];

  if (job?.location) {
    parts.push(job.location);
  }

  if (Array.isArray(job?.secondaryLocations)) {
    for (const location of job.secondaryLocations) {
      if (typeof location === 'string') {
        parts.push(location);
      } else if (location?.location) {
        parts.push(location.location);
      }
    }
  }

  if (job?.address?.postalAddress) {
    const address = job.address.postalAddress;

    parts.push(address.addressLocality, address.addressRegion, address.addressCountry);
  }

  return parts.filter(Boolean).join(' ').toLowerCase();
}

function isBangalore(job) {
  const text = getLocationText(job);

  return /\bbangalore\b/i.test(text) || /\bbengaluru\b/i.test(text);
}

function isSanFranciscoBayArea(job) {
  const text = getLocationText(job);

  return (
    /\bsan francisco\b/i.test(text) ||
    /\bbay area\b/i.test(text) ||
    /\bsan mateo\b/i.test(text) ||
    /\bsanta clara\b/i.test(text) ||
    /\bmountain view\b/i.test(text) ||
    /\bpalo alto\b/i.test(text) ||
    /\bsunnyvale\b/i.test(text) ||
    /\bmenlo park\b/i.test(text) ||
    /\bcupertino\b/i.test(text)
  );
}

function isIndiaRemote(job) {
  const text = getLocationText(job);

  const remote = job?.isRemote === true || /remote/i.test(job?.workplaceType || '') || /\bremote\b/i.test(text);

  const india =
    /\bindia\b/i.test(text) ||
    /\bbangalore\b/i.test(text) ||
    /\bbengaluru\b/i.test(text) ||
    /\bmumbai\b/i.test(text) ||
    /\bdelhi\b/i.test(text) ||
    /\bgurgaon\b/i.test(text) ||
    /\bgurugram\b/i.test(text) ||
    /\bhyderabad\b/i.test(text) ||
    /\bpune\b/i.test(text) ||
    /\bchennai\b/i.test(text) ||
    /\bnoida\b/i.test(text);

  return remote && india;
}

function isUSRemote(job) {
  const text = getLocationText(job);

  const remote = job?.isRemote === true || /remote/i.test(job?.workplaceType || '') || /\bremote\b/i.test(text);

  const us =
    /\bunited states\b/i.test(text) ||
    /\busa\b/i.test(text) ||
    /\bu\.s\.\b/i.test(text) ||
    /\bunited states of america\b/i.test(text);

  return remote && us;
}

function getJobLocationTypes(job) {
  const locations = [];

  if (isBangalore(job)) {
    locations.push('bangalore');
  }

  if (isSanFranciscoBayArea(job)) {
    locations.push('sf_bay_area');
  }

  if (isIndiaRemote(job)) {
    locations.push('india_remote');
  }

  if (isUSRemote(job)) {
    locations.push('us_remote');
  }

  return locations;
}

function isTargetLocation(job) {
  return getJobLocationTypes(job).length > 0;
}

module.exports = {
  isBangalore,
  isSanFranciscoBayArea,
  isIndiaRemote,
  isUSRemote,
  getJobLocationTypes,
  isTargetLocation,
};
