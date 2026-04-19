# CD 설정

## 구조

- `CI` 성공 후 `CD` 실행
- GitHub-hosted runner가 아니라 **EC2 내부 self-hosted runner** 사용
- 배포 명령은 서버 안에서 직접 실행

## 배포 순서

1. `/var/www/wwt-be` 이동
2. `git pull --ff-only origin main`
3. `pnpm install --frozen-lockfile`
4. `pnpm build`
5. `pm2 restart wwt-be`
6. `pm2 save`

## 파일

- 워크플로우: [cd.yml](../.github/workflows/cd.yml)
- 배포 스크립트: [deploy.sh](../scripts/deploy.sh)
- 수동 롤백 워크플로우: [rollback.yml](../.github/workflows/rollback.yml)
- 수동 롤백 스크립트: [rollback.sh](../scripts/rollback.sh)

## self-hosted runner 설치 시 주의

- **EC2에서 `ubuntu` 사용자로 runner를 설치하는 쪽이 맞다.**
- 현재 앱 디렉토리와 PM2 프로세스가 `ubuntu` 기준이기 때문이다.
- runner labels는 기본값인 `self-hosted`, `linux`, `x64`를 사용한다.

## EC2에서 해야 할 것

1. GitHub 레포 `Settings -> Actions -> Runners -> New self-hosted runner`
2. Linux / x64 선택
3. 안내된 명령을 **EC2의 `ubuntu` 사용자**로 실행
4. runner 등록 후 서비스로 실행

## 배포 트리거

- `main` 브랜치에서 `CI`가 성공하면 `CD`가 자동 실행된다.

## 롤백

### 자동 롤백

- `deploy.sh`는 배포 시작 전에 현재 commit SHA를 기억한다.
- `git pull`, `pnpm install`, `pnpm build`, `pm2 restart` 중 하나라도 실패하면:
  1. 배포 전 commit으로 `git reset --hard`
  2. `pnpm install --frozen-lockfile`
  3. `pnpm build`
  4. `pm2 restart wwt-be`
  5. `pm2 save`

### 수동 롤백

GitHub Actions에서 `Rollback` 워크플로우를 직접 실행할 수 있다.

- `target_commit`을 비워두면 이전 성공 배포 commit으로 되돌린다.
- `target_commit`에 SHA를 넣으면 해당 commit으로 되돌린다.

배포 기록 파일:

- `/var/www/wwt-be/.deploy/last_successful_commit`
- `/var/www/wwt-be/.deploy/previous_successful_commit`
