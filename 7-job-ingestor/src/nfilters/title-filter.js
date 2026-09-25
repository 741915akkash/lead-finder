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

    // intern
    /\bintern\b/,

    //operations
    /\boperations\b/,
    /\bops\b/,

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
    /\bsales engineer\b/,
    /\baccount executive\b/,
    /\baccount manager\b/,
    /\bsales manager\b/,
    /\bsales director\b/,
    /\bhead of sales\b/,
    /\bvp of sales\b/,
    /\bcommercial\b/,

    // Member of Staff
    /\bmember of staff\b/,
    /\bmember of technical staff\b/,
    /\bstaff\b/,

    // Client
    /\bclient\b/,
    /\binstallation\b/,

    // Recruiting / Talent Acquisition
    /\bsourcer\b/,
    /\brecruiter\b/,
    /\brecruiting\b/,
    /\btalent acquisition\b/,
    /\btechnical recruiter\b/,
    /\btechnical recruiting\b/,
    /\btalent sourcer\b/,
    /\brecruiting manager\b/,
    /\bhead of recruiting\b/,
    /\bhead of talent acquisition\b/,

    // Marketing titles / keywords
    /\bmarketing\b/,
    /\bmarketing associate\b/,
    /\bmarketing specialist\b/,
    /\bmarketing coordinator\b/,
    /\bmarketing executive\b/,
    /\bmarketing manager\b/,
    /\bmarketing director\b/,
    /\bhead of marketing\b/,
    /\bchief marketing officer\b/,
    /\bcmo\b/,

    // Growth Marketing
    /\bgrowth marketing\b/,
    /\bgrowth marketer\b/,
    /\bgrowth manager\b/,
    /\bgrowth lead\b/,
    /\bhead of growth\b/,
    /\bvp of growth\b/,
    /\bgrowth hacker\b/,
    /\bperformance marketing\b/,
    /\bperformance marketer\b/,
    /\bacquisition marketing\b/,
    /\bcustomer acquisition\b/,

    // Digital Marketing
    /\bdigital marketing\b/,
    /\bdigital marketer\b/,
    /\bdigital marketing specialist\b/,
    /\bdigital marketing manager\b/,
    /\bonline marketing\b/,
    /\binternet marketing\b/,

    // Content Marketing
    /\bcontent marketing\b/,
    /\bcontent marketer\b/,
    /\bcontent marketing manager\b/,
    /\bcontent strategist\b/,
    /\bcontent lead\b/,
    /\bhead of content\b/,
    /\bsocial media marketing\b/,
    /\bsocial media manager\b/,
    /\bsocial media specialist\b/,
    /\bsocial media strategist\b/,

    // SEO / SEM
    /\bseo\b/,
    /\bseo specialist\b/,
    /\bseo manager\b/,
    /\bseo lead\b/,
    /\bhead of seo\b/,
    /\bsem\b/,
    /\bsearch engine marketing\b/,
    /\bsearch marketing\b/,

    // Product Marketing
    /\bproduct marketing\b/,
    /\bproduct marketer\b/,
    /\bproduct marketing manager\b/,
    /\bproduct marketing lead\b/,
    /\bhead of product marketing\b/,
    /\bvp of product marketing\b/,

    // Brand / Communications / PR
    /\bbrand marketing\b/,
    /\bbrand manager\b/,
    /\bbrand strategist\b/,
    /\bbrand director\b/,
    /\bcommunications manager\b/,
    /\bmarketing communications\b/,
    /\bpublic relations\b/,
    /\bpr manager\b/,
    /\bpr specialist\b/,
    /\bmarketing communications manager\b/,

    // Demand Generation / Marketing Ops
    /\bdemand generation\b/,
    /\bdemand gen\b/,
    /\bdemand generation manager\b/,
    /\bdemand generation specialist\b/,
    /\bdemand gen manager\b/,
    /\blifecycle marketing\b/,
    /\bemail marketing\b/,
    /\bmarketing operations\b/,
    /\bmarketing ops\b/,
    /\bmarketing operations manager\b/,
    /\bmarketing automation\b/,
    /\bmarketing automation manager\b/,

    // Partnerships / Field Marketing
    /\bpartner marketing\b/,
    /\bpartnerships marketing\b/,
    /\bchannel marketing\b/,
    /\bfield marketing\b/,
    /\bfield marketing manager\b/,
    /\becosystem marketing\b/,

    // Marketing Leadership
    /\bchief growth officer\b/,
    /\bcgo\b/,
    /\bchief brand officer\b/,
    /\bmarketing lead\b/,
    /\bglobal marketing manager\b/,
    /\binternational marketing manager\b/,
  ];

  return !excludedPatterns.some((pattern) => pattern.test(title));
}

module.exports = {
  isTargetJob,
};
