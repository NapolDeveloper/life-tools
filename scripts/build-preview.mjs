// `npm run build:preview` — PUBLIC_ENV=preview로 빌드한 dist를 dist-preview/에 복사하고 상대경로로 변환한다.
import { execSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { relativizeTree, underscoreTopLevel } from './relativize.mjs';

execSync('npx astro build', { stdio: 'inherit', env: { ...process.env, PUBLIC_ENV: 'preview' } });
rmSync('dist-preview', { recursive: true, force: true });
cpSync('dist', 'dist-preview', { recursive: true });

const changed = relativizeTree('dist-preview');
const bad = underscoreTopLevel('dist-preview');
if (bad.length) {
  console.error(`dist-preview 최상위에 "_"로 시작하는 이름이 있어요: ${bad.join(', ')} (astro.config build.assets 확인)`);
  process.exit(1);
}
console.log(`dist-preview 준비 완료 (파일 ${changed}개 경로 변환)`);
