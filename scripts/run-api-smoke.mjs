import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(root, '.env') });

process.env.MEDUSA_BASE_URL ??= 'https://ec-medusa-app.onrender.com';

if (!process.env.MEDUSA_PUBLISHABLE_API_KEY) {
  console.error(
    'MEDUSA_PUBLISHABLE_API_KEY is not set. Add the hosted store key to .env, then run npm run test:smoke.',
  );
  process.exit(1);
}

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code, signal) => {
      resolve(signal ? 1 : (code ?? 1));
    });
  });
}

const waitCode = await run(['scripts/wait-for-medusa.mjs']);
if (waitCode !== 0) {
  process.exit(waitCode);
}

const testCode = await run([
  'node_modules/@playwright/test/cli.js',
  'test',
  'tests/medusa/api/store-smoke.spec.ts',
]);

process.exit(testCode);
