# pipe 프로젝트

## 배포
- 배포 방법: GitHub main 브랜치 push → GitHub Actions 자동 빌드 → GitHub Pages 배포
- 배포 URL: https://sjidok750-creator.github.io/pipe/
- 워크플로우: `.github/workflows/deploy.yml`
- 빌드 명령: `npm run build` (출력: `dist/`)
- base path: `/pipe/` (vite.config.ts)
- "배포해줘" 요청 시 `git push origin main` 실행 (Actions가 자동으로 빌드+배포, 2~4분 소요)
