import { spawnSync } from 'node:child_process';
// PYTHON is an executable path, not a shell command. No shell interpolation.
const executable = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const result = spawnSync(executable, ['factory/product_factory.py', 'render-catalog'], { stdio: 'inherit', shell: false });
if (result.error || result.status !== 0) {
  console.error('Catalog generation failed. Install Python 3.11+ or set PYTHON to its executable path.');
  process.exit(result.status || 1);
}
