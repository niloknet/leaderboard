#!/usr/bin/env bash
# Functions/DB 배포 (discovery 타임아웃 60초로 확대)
# 사용: ./scripts/deploy-functions.sh

set -e
cd "$(dirname "$0")/.."

export FUNCTIONS_DISCOVERY_TIMEOUT=60000
firebase deploy --only functions,database "$@"
