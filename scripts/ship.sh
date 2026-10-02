#!/usr/bin/env bash
# Локальный раннер вместо GitHub Actions: те же проверки, что CI, и та же выкатка, что CD,
# но с этой машины. Нужен, когда Actions недоступны (например, аккаунт заблокирован из-за оплаты).
#
#   scripts/ship.sh front         проверить и выкатить фронт (loal.kg и кабинеты)
#   scripts/ship.sh back          проверить и выкатить бэкенд (loal.promconsult.pro)
#   scripts/ship.sh all           сначала бэкенд, потом фронт
#
#   --skip-checks   не гонять тесты и сборку локально (только если они уже прошли на этом коммите)
#   --yes           не спрашивать подтверждение перед выкаткой
#   --dry-run       всё проверить, на сервер не ходить
#
# Настройки — переменные окружения или файл ~/.config/loal/deploy.env (в репозиторий не кладём):
#   DEPLOY_HOST     адрес сервера (обязательно)
#   DEPLOY_USER     пользователь SSH, по умолчанию root
#   DEPLOY_PORT     порт SSH, по умолчанию 22
#   DEPLOY_SSH_KEY  путь к закрытому ключу; по умолчанию — ssh-agent и ~/.ssh
#   FRONT_PATH      папка фронта на сервере, по умолчанию /var/www/cashup-landing
#   BACK_PATH       папка бэкенда на сервере, по умолчанию /var/www/cashup_platform
#   BACK_REPO       локальный репозиторий бэкенда, по умолчанию ../cashup_platform
#
# Выкатывается только закоммиченный и запушенный код: сервер фронта сам забирает коммит
# с GitHub, бэкенд едет архивом ровно этого коммита (git archive), без локальных правок.
set -euo pipefail

FRONT_REPO="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="${LOAL_DEPLOY_CONFIG:-$HOME/.config/loal/deploy.env}"
# shellcheck disable=SC1090
[ -f "$CONFIG" ] && set -a && . "$CONFIG" && set +a

DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
FRONT_PATH="${FRONT_PATH:-/var/www/cashup-landing}"
BACK_PATH="${BACK_PATH:-/var/www/cashup_platform}"
BACK_REPO="${BACK_REPO:-$FRONT_REPO/../cashup_platform}"

TARGET="${1:-}"; shift || true
SKIP_CHECKS=0; YES=0; DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --skip-checks) SKIP_CHECKS=1 ;;
    --yes) YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "Неизвестный флаг: $arg" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[32m✓ %s\033[0m\n' "$*"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

ssh_opts=(-p "$DEPLOY_PORT" -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=30)
[ -n "${DEPLOY_SSH_KEY:-}" ] && ssh_opts+=(-i "$DEPLOY_SSH_KEY")
remote() { ssh "${ssh_opts[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "$@"; }

need_server() {
  [ -n "${DEPLOY_HOST:-}" ] || die "Не задан DEPLOY_HOST. Создайте $CONFIG (см. начало скрипта)."
  remote true 2>/dev/null || die "Не удаётся зайти по SSH на $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PORT. Проверьте ключ (ssh-add) и адрес."
}

# Коммит, который выкатываем: текущий HEAD, без незакоммиченных правок и уже на GitHub
pick_commit() {
  local repo="$1" branch="$2"
  git -C "$repo" diff --quiet && git -C "$repo" diff --cached --quiet \
    || die "В $(basename "$repo") есть незакоммиченные правки. Закоммитьте и запушьте — выкатывается только коммит."
  git -C "$repo" fetch --quiet origin "$branch"
  local sha; sha="$(git -C "$repo" rev-parse HEAD)"
  git -C "$repo" merge-base --is-ancestor "$sha" "origin/$branch" \
    || die "Коммит ${sha:0:7} ещё не в origin/$branch. Сначала git push."
  echo "$sha"
}

confirm() {
  [ "$YES" = 1 ] && return 0
  read -r -p "$1 [y/N] " answer
  [[ "$answer" =~ ^[yYдД]$ ]] || die "Отменено."
}

wait_url() {
  local url="$1" code=000
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url" || echo 000)"
    [ "$code" = 200 ] && { ok "$url → 200"; return 0; }
    sleep 5
  done
  die "$url отвечает $code"
}

ship_front() {
  step "Фронт: коммит"
  local sha; sha="$(pick_commit "$FRONT_REPO" main)"
  echo "  $(git -C "$FRONT_REPO" log --oneline -1 "$sha")"

  if [ "$SKIP_CHECKS" = 0 ]; then
    step "Фронт: проверки как в CI"
    (cd "$FRONT_REPO" && pnpm install --frozen-lockfile && pnpm test:integration-ui && pnpm -r --filter "./apps/*" build)
    ok "Тесты и сборка всех приложений прошли"
  fi

  [ "$DRY_RUN" = 1 ] && { ok "dry-run: на сервер не ходим"; return 0; }
  need_server
  confirm "Выкатить фронт ${sha:0:7} на $DEPLOY_HOST?"

  step "Фронт: сборка и запуск на сервере"
  # Тот же сценарий, что в .github/workflows/cd.yml; flock не даёт двум выкаткам идти разом
  remote "SHA='$sha' APP_DIR='$FRONT_PATH' flock -w 600 /tmp/loal-front-deploy.lock bash -s" <<'REMOTE'
set -euo pipefail
cd "$APP_DIR"
echo "Код: $SHA"
git fetch --quiet origin main
git reset --hard "$SHA"
# По одному образу: пять сборок разом на небольшом сервере съедают всю память (было — OOM и падение Traefik)
for service in $(docker compose -f infra/docker-compose.yml config --services); do
  echo "Сборка: $service"
  docker compose -f infra/docker-compose.yml build "$service"
done
docker compose -f infra/docker-compose.yml up -d --remove-orphans
docker image prune -f > /dev/null
docker compose -f infra/docker-compose.yml ps
REMOTE

  step "Фронт: сайты отвечают"
  for url in https://loal.kg/ https://partner.loal.kg/ https://client.loal.kg/ https://admin.loal.kg/ https://cashier.loal.kg/; do
    wait_url "$url"
  done
  ok "Фронт ${sha:0:7} выкачен"
}

ship_back() {
  [ -d "$BACK_REPO/.git" ] || die "Не найден репозиторий бэкенда: $BACK_REPO (задайте BACK_REPO)"
  step "Бэкенд: коммит"
  local sha; sha="$(pick_commit "$BACK_REPO" master)"
  echo "  $(git -C "$BACK_REPO" log --oneline -1 "$sha")"

  if [ "$SKIP_CHECKS" = 0 ]; then
    step "Бэкенд: проверки как в CI (сборка, типы, юнит-тесты)"
    (cd "$BACK_REPO" && pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm test)
    ok "Сборка, типы и тесты прошли"
    echo "  Интеграционный прогон CI (миграции на чистой базе и smoke через шлюз) локально не запускается."
  fi

  [ "$DRY_RUN" = 1 ] && { ok "dry-run: на сервер не ходим"; return 0; }
  need_server

  step "Бэкенд: настройки на сервере"
  # Секрета ENV из GitHub здесь нет — переиспользуем infra/.env, который положил последний CD.
  # Проверяем только наличие ключей, значения не читаем и не выводим.
  remote "APP_DIR='$BACK_PATH' bash -s" <<'REMOTE'
set -euo pipefail
env_file="$APP_DIR/infra/.env"
[ -s "$env_file" ] || { echo "На сервере нет $env_file — первый деплой должен пройти через GitHub CD"; exit 1; }
missing=""
for key in POSTGRES_PASSWORD JWT_SECRET SECRETS_ENCRYPTION_KEY whatsappId \
           OCTOPAY_API_KEY_ID OCTOPAY_PRIVATE_KEY OCTOPAY_WEBHOOK_SECRET OCTOPAY_BANK_ID OCTOPAY_BONUS_API_SECRET \
           APNS_KEY_ID APNS_TEAM_ID; do
  grep -q "^${key}=." "$env_file" || missing="$missing $key"
done
[ -z "$missing" ] || { echo "В $env_file нет ключей:$missing"; exit 1; }
echo "infra/.env на месте, обязательные ключи есть"
REMOTE

  confirm "Выкатить бэкенд ${sha:0:7} на $DEPLOY_HOST?"

  step "Бэкенд: архив коммита"
  local archive="${TMPDIR:-/tmp}/loal-back-${sha:0:7}.tgz"
  git -C "$BACK_REPO" archive --format=tar.gz -o "$archive" "$sha"
  scp -P "$DEPLOY_PORT" ${DEPLOY_SSH_KEY:+-i "$DEPLOY_SSH_KEY"} -o BatchMode=yes -q "$archive" "$DEPLOY_USER@$DEPLOY_HOST:/tmp/loal-back.tgz"
  rm -f "$archive"

  step "Бэкенд: распаковка, сборка и запуск"
  # Как в cashup_platform/.github/workflows/cd.yml, но infra/.env сохраняем и возвращаем на место
  remote "APP_DIR='$BACK_PATH' flock -w 600 /tmp/loal-back-deploy.lock bash -s" <<'REMOTE'
set -euo pipefail
case "$APP_DIR" in ""|"/"|"/root"|"/home") echo "Опасный BACK_PATH: $APP_DIR"; exit 1;; esac
# Копия .env закрыта для всех, кроме владельца; код распаковывается с обычными правами
keep="$(umask 077 && mktemp)"
cp "$APP_DIR/infra/.env" "$keep"
find "$APP_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar xzf /tmp/loal-back.tgz -C "$APP_DIR"
rm -f /tmp/loal-back.tgz
install -m 600 "$keep" "$APP_DIR/infra/.env"
rm -f "$keep"
cd "$APP_DIR/infra"
df -h / | tail -1
docker builder prune -af > /dev/null
docker image prune -af > /dev/null
# По одному образу — чтобы сборка не вытеснила из памяти работающие сервисы
for service in $(docker compose -f docker-compose.prod.yml config --services); do
  echo "Сборка: $service"
  docker compose -f docker-compose.prod.yml build "$service"
done
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -af > /dev/null
docker compose -f docker-compose.prod.yml ps
for i in $(seq 1 30); do
  code=$(curl -k -s -o /dev/null -w '%{http_code}' --resolve loal.promconsult.pro:443:127.0.0.1 --max-time 5 https://loal.promconsult.pro/health || echo 000)
  [ "$code" = 200 ] && { echo "Шлюз отвечает на сервере"; exit 0; }
  sleep 2
done
docker compose -f docker-compose.prod.yml logs --tail=40 gateway card-service core-service
exit 1
REMOTE

  step "Бэкенд: шлюз отвечает снаружи"
  wait_url https://loal.promconsult.pro/health
  ok "Бэкенд ${sha:0:7} выкачен"
}

case "$TARGET" in
  front) ship_front ;;
  back) ship_back ;;
  all) ship_back; ship_front ;;
  *) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
