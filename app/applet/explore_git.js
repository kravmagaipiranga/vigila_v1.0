const { execSync } = require('child_process');
try {
  console.log('--- GIT STATUS ---');
  console.log(execSync('git status').toString());
  console.log('--- GIT LOG ---');
  console.log(execSync('git log -n 3').toString());
} catch (e) {
  console.error(e.toString());
}
