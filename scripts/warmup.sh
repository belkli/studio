#!/usr/bin/env bash
# Warmup script: pre-compiles all key routes after starting dev server
# Usage: npm run dev & sleep 5 && bash scripts/warmup.sh

BASE=${1:-http://localhost:9002}
echo "Warming up $BASE ..."

ROUTES=(
  "/" "/en" "/ar" "/ru"
  "/login" "/about" "/contact" "/privacy" "/accessibility" "/register"
  "/playing-school" "/available-now" "/donate" "/help"
  "/dashboard" "/dashboard/admin" "/dashboard/teacher" "/dashboard/ministry"
  "/dashboard/schedule" "/dashboard/schedule/book" "/dashboard/billing"
  "/dashboard/settings" "/dashboard/practice" "/dashboard/messages"
  "/dashboard/notifications" "/dashboard/events" "/dashboard/forms"
  "/dashboard/approvals" "/dashboard/users" "/dashboard/announcements"
  "/dashboard/reports" "/dashboard/master-schedule" "/dashboard/makeups"
  "/dashboard/ministry/repertoire" "/dashboard/admin/payroll"
  "/dashboard/admin/form-builder" "/dashboard/admin/branches"
  "/en/dashboard" "/en/dashboard/settings" "/ar/dashboard" "/ru/dashboard"
)

total=${#ROUTES[@]}
i=0
for route in "${ROUTES[@]}"; do
  i=$((i+1))
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}${route}" 2>/dev/null)
  printf "[%2d/%d] %s %s\n" "$i" "$total" "$code" "$route"
done

echo "Done! All $total routes pre-compiled."
