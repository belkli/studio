@echo off
REM Warmup script: pre-compiles all key routes after starting dev server
REM Usage: npm run dev (in one terminal), then run this in another terminal

set BASE=http://localhost:9002
if not "%1"=="" set BASE=%1

echo Warming up %BASE% ...

set /a i=0
set /a total=38

for %%r in (
  /
  /en
  /ar
  /ru
  /login
  /about
  /contact
  /privacy
  /accessibility
  /register
  /playing-school
  /available-now
  /donate
  /help
  /dashboard
  /dashboard/admin
  /dashboard/teacher
  /dashboard/ministry
  /dashboard/schedule
  /dashboard/schedule/book
  /dashboard/billing
  /dashboard/settings
  /dashboard/practice
  /dashboard/messages
  /dashboard/notifications
  /dashboard/events
  /dashboard/forms
  /dashboard/approvals
  /dashboard/users
  /dashboard/announcements
  /dashboard/reports
  /dashboard/master-schedule
  /dashboard/makeups
  /dashboard/ministry/repertoire
  /dashboard/admin/payroll
  /dashboard/admin/form-builder
  /en/dashboard
  /ar/dashboard
) do (
  set /a i+=1
  curl -s -o NUL -w "%%{http_code} %%r" %BASE%%%r 2>NUL
  echo.
)

echo Done! All routes pre-compiled.
