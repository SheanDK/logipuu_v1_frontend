/** @type {import('next').NextConfig} */

// --- FIX 1: Import the PWA plugin ---
const withPWA = require('next-pwa')({
  dest: 'public', // Service worker එක build කරන ස්ථානය
  //disable: process.env.NODE_ENV === 'development', // Development වලදී PWA අක්‍රීය කරන්න
  register: true, // Service worker එක register කරන්න
  skipWaiting: true, // Service worker එක වහාම සක්‍රීය කරන්න
  buildExcludes: [/middleware-manifest\.json$/], // middleware manifest files බැහැර කරන්න
});

const nextConfig = {
  // Add other Next.js config settings if you have them...
  // example: output: 'standalone',
  // example: webpack: (config) => { ... }
};

// --- FIX 2: Export the wrapped config ---
// The middleware logic needs to be checked carefully here for Next.js 16/15 compatibility.
module.exports = withPWA(nextConfig);