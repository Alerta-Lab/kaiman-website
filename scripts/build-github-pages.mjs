/**
 * Static GitHub Pages build: parks SSR-only routes, builds with GITHUB_PAGES=true,
 * writes dist/.nojekyll, then restores the parked folders.
 */
import { existsSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const stash = path.join(root, '.pages-stash');
const apiFrom = path.join(root, 'src/pages/api');
const adminFrom = path.join(root, 'src/pages/admin');
const apiTo = path.join(stash, 'api');
const adminTo = path.join(stash, 'admin');

async function move(from, to) {
	if (!existsSync(from)) return;
	await mkdir(path.dirname(to), { recursive: true });
	await rename(from, to);
}

function runBuild() {
	return new Promise((resolve, reject) => {
		const child = spawn('pnpm', ['exec', 'astro', 'build'], {
			cwd: root,
			stdio: 'inherit',
			env: {
				...process.env,
				GITHUB_PAGES: 'true',
			},
			shell: process.platform === 'win32',
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`astro build exited with code ${code}`));
		});
	});
}

let parked = false;
try {
	await mkdir(stash, { recursive: true });
	await move(apiFrom, apiTo);
	await move(adminFrom, adminTo);
	parked = true;
	await runBuild();
	await writeFile(path.join(root, 'dist/.nojekyll'), '');
	console.log('GitHub Pages build ready in dist/');
} finally {
	if (parked) {
		await move(apiTo, apiFrom);
		await move(adminTo, adminFrom);
	}
}
