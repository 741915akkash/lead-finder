function isTargetJob(job) {
  const title = (job?.title || '').toLowerCase();

  const excludedPatterns = [
    // QA / Testing
    /\bqa\b/,
    /\bquality assurance\b/,
    /\bsdet\b/,
    /\btest engineer\b/,
    /\btesting\b/,

    // Support
    /\bit support\b/,
    /\btechnical support\b/,
    /\bsupport engineer\b/,

    // Security operations
    /\bsecurity operations\b/,
    /\bsoc engineer\b/,

    // Networking / hardware
    /\bnetwork engineer\b/,
    /\bwireless\b/,
    /\brf engineer\b/,
    /\bhardware engineer\b/,
    /\bfirmware engineer\b/,
    /\bembedded engineer\b/,
    /\bembedded systems\b/,
    /\bdesign verification\b/,

    // Infrastructure / operations
    /\bdevops\b/,
    /\bsite reliability\b/,
    /\bsre\b/,
    /\binfrastructure engineer\b/,

    // Data / ML / research
    /\bdata engineer\b/,
    /\bdata scientist\b/,
    /\bmachine learning engineer\b/,
    /\bml engineer\b/,
    /\bresearch engineer\b/,

    // Sales / Business Development
    /\bsales representative\b/,
    /\bsales rep\b/,
    /\bsales development\b/,
    /\bsales development representative\b/,
    /\bsdr\b/,
    /\bbusiness development\b/,
    /\bbusiness development representative\b/,
    /\bbdr\b/,
    /\baccount executive\b/,
    /\baccount manager\b/,
    /\bsales manager\b/,
    /\bsales director\b/,
    /\bhead of sales\b/,
    /\bvp of sales\b/,
    /\bcommercial\b/,
  ];

  return !excludedPatterns.some((pattern) => pattern.test(title));
}

module.exports = {
  isTargetJob,
};
