const { execSync } = require('child_process');
try {
  console.log('--- GIT STATUS ---');
  console.log(execSync('git status').toString());
  console.log('--- GIT LOG ---');
  console.log(execSync('git log -n 3').toString());
  console.log('--- GIT DIFF HEAD~1 ---');
  console.log(execSync('git diff HEAD~1 --name-only').toString());
} catch (e) {
  console.error(e.toString());
}
