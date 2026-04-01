const { execSync } = require('child_process');
try {
  execSync('git restore .');
  execSync('rm -rf src/components/ui src/lib explore_git.cjs explore_git.js workspace app');
  console.log('Restored successfully');
} catch (e) {
  console.error(e.toString());
}
