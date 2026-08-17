const { resolvePostedAt } = require('./normalizers/posted-at');

const discoveredAt = '2026-08-16T05:37:52.000Z';

console.log('5 days ago:', resolvePostedAt('5 days ago', discoveredAt));

console.log('1 day ago:', resolvePostedAt('1 day ago', discoveredAt));

console.log('yesterday:', resolvePostedAt('yesterday', discoveredAt));

console.log('3 hours ago:', resolvePostedAt('3 hours ago', discoveredAt));

console.log('20 minutes ago:', resolvePostedAt('20 minutes ago', discoveredAt));

console.log('August 12, 2026:', resolvePostedAt('August 12, 2026', discoveredAt));

console.log('recently:', resolvePostedAt('recently', discoveredAt));

console.log('2 weeks ago:', resolvePostedAt('2 weeks ago', discoveredAt));

console.log('1 week ago:', resolvePostedAt('1 week ago', discoveredAt));