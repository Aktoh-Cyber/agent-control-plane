#!/usr/bin/env node

/**
 * NPM User Package Statistics
 * Fetch and display statistics for all packages owned by a user
 */

const https = require('https');

// Get username from command line or environment
const username = process.argv[2] || process.env.NPM_USERNAME;

if (!username) {
  console.error('Usage: node npm-user-stats.js <username>');
  console.error('   or: NPM_USERNAME=<username> node npm-user-stats.js');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         NPM User Package Statistics                           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`👤 User: ${username}\n`);

/**
 * Fetch data from NPM registry
 */
function fetchNPMData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Get download stats for a package
 */
async function getDownloadStats(packageName) {
  try {
    const data = await fetchNPMData(
      `https://api.npmjs.org/downloads/point/last-month/${packageName}`
    );
    return data.downloads || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Search for user's packages
 */
async function getUserPackages() {
  try {
    const searchUrl = `https://registry.npmjs.org/-/v1/search?text=maintainer:${username}&size=250`;
    const data = await fetchNPMData(searchUrl);
    return data.objects || [];
  } catch (e) {
    console.error('❌ Error fetching packages:', e.message);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Searching for packages...\n');

  const packages = await getUserPackages();

  if (packages.length === 0) {
    console.log('No packages found for this user.');
    return;
  }

  console.log(`📦 Found ${packages.length} package(s)\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let totalDownloads = 0;
  const stats = [];

  for (const pkg of packages) {
    const packageName = pkg.package.name;
    const version = pkg.package.version;
    const description = pkg.package.description || 'No description';

    console.log(`\n📦 ${packageName}`);
    console.log(`   Version: ${version}`);
    console.log(`   ${description}`);

    // Get download stats
    const downloads = await getDownloadStats(packageName);
    totalDownloads += downloads;

    console.log(`   Downloads (last month): ${downloads.toLocaleString()}`);

    stats.push({
      name: packageName,
      version,
      downloads,
    });

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Summary Statistics:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Packages:      ${packages.length}`);
  console.log(`Total Downloads:     ${totalDownloads.toLocaleString()} (last month)`);
  console.log(
    `Average per Package: ${Math.round(totalDownloads / packages.length).toLocaleString()}`
  );

  // Top 5 packages
  console.log('\n🏆 Top 5 Packages by Downloads:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  stats.sort((a, b) => b.downloads - a.downloads);
  stats.slice(0, 5).forEach((pkg, i) => {
    console.log(`${i + 1}. ${pkg.name}`);
    console.log(`   ${pkg.downloads.toLocaleString()} downloads`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔗 Profile Links:');
  console.log(`   NPM Profile: https://www.npmjs.com/~${username}`);
  console.log(`   Search:      https://www.npmjs.com/search?q=maintainer:${username}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
