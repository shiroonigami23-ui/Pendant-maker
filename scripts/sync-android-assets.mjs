import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = globalThis.process.cwd();
const source = resolve(root, 'dist');
const target = resolve(root, 'android-app', 'app', 'src', 'main', 'assets', 'web');

async function syncAssets() {
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
  globalThis.console.log(`Synced web assets:\n- from: ${source}\n- to:   ${target}`);
}

syncAssets().catch((error) => {
  globalThis.console.error('Failed to sync Android assets:', error);
  globalThis.process.exit(1);
});
