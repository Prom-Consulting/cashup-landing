#!/usr/bin/env bash
# Run after building images, before changing any running frontend container.
set -euo pipefail
cd "$(dirname "$0")/.."
# The short-lived probe inherits the landing labels: keep it out of Traefik.
docker compose -f infra/docker-compose.yml run --rm --no-deps --label traefik.enable=false -T landing \
  node --input-type=module < scripts/check-edge-ready.mjs
