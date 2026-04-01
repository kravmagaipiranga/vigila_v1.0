const { execSync } = require('child_process');
try {
  execSync('git restore src/services/geminiService.ts');
  console.log('Restored geminiService.ts');
} catch (e) {
  console.error(e.toString());
}
