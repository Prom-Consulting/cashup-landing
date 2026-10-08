#!/usr/bin/env bash
# Run after building images, before changing any running frontend container.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f infra/docker-compose.yml run --rm --no-deps -T landing \
  node --input-type=module < scripts/check-edge-ready.mjs
