#!/usr/bin/env bash
# Errand Boys installer for a fresh Ubuntu 22.04 / 24.04 VPS (no cPanel).
#
#   sudo bash install.sh            first install: asks a few questions, then sets everything up
#   sudo bash install.sh --update   after uploading a newer version: keeps your settings, rebuilds, restarts
#
# Before the first install: point your domain's DNS at this server and run the database script in Supabase
# (see README.md). You will need your Supabase keys and, if you have them, your Paystack key.
set -Eeuo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${EB_TARGET:-/var/www/errandboy}"
APP_USER="${EB_USER:-errandboy}"
DRY="${EB_DRY_RUN:-0}"            # 1 = only print system commands (used for testing the installer)
MODE=install; [ "${1:-}" = "--update" ] && MODE=update

say()  { printf '\n\033[1m== %s\033[0m\n' "$*"; }
note() { printf '   %s\n' "$*"; }
warn() { printf '\033[33m   ! %s\033[0m\n' "$*"; }
die()  { printf '\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }
run()  { if [ "$DRY" = 1 ]; then echo "   [dry-run] $*"; else "$@"; fi; }
as_app() { if [ "$DRY" = 1 ]; then echo "   [dry-run as $APP_USER] $*"; else sudo -u "$APP_USER" -H bash -lc "$*"; fi; }
trap 'die "Something failed near line $LINENO. Fix the problem above and run the installer again: it is safe to repeat."' ERR

# ask VAR "Question" "default" [secret]  -> uses $EB_VAR if already set
ask() {
  local var="$1" prompt="$2" def="${3:-}" secret="${4:-}" pre="EB_$1" val
  if [ -n "${!pre+x}" ]; then printf -v "$var" '%s' "${!pre}"; return; fi   # an answer given in advance (even an empty one) skips the question
  if [ "$secret" = secret ]; then read -rsp "   $prompt: " val; echo; else read -rp "   $prompt${def:+ [$def]}: " val; fi
  printf -v "$var" '%s' "${val:-$def}"
}
confirm() { local a; [ -n "${EB_ASSUME_YES:-}" ] && return 0; read -rp "   $1 [y/N]: " a; [[ "$a" =~ ^[Yy] ]]; }

# set_env FILE KEY VALUE  (safe for any characters)
set_env() {
  python3 - "$1" "$2" "$3" <<'PY'
import sys,re
f,k,v=sys.argv[1:4]
if '"' in v or '\n' in v: sys.exit('A value contains a quote or line break: not allowed.')
if re.search(r'[#\s]',v): v='"'+v+'"'
lines=open(f).read().split('\n'); done=False
for i,l in enumerate(lines):
    if re.match(r'^'+re.escape(k)+r'=',l): lines[i]=f'{k}={v}'; done=True; break
if not done: lines.append(f'{k}={v}')
open(f,'w').write('\n'.join(lines))
PY
}

preflight() {
  say "Checking this server"
  [ "$DRY" = 1 ] && { note "dry-run mode: system changes are only printed"; return; }
  [ "$(id -u)" = 0 ] || die "Run with sudo:  sudo bash install.sh"
  . /etc/os-release; [ "${ID:-}" = ubuntu ] || warn "This installer is made for Ubuntu (found ${PRETTY_NAME:-unknown}). It may not work."
  if [ -d /usr/local/cpanel ] || command -v httpd >/dev/null 2>&1; then
    die "cPanel/Apache detected. It would clash with nginx. Reinstall the VPS as plain Ubuntu (see README, section 3)."
  fi
  if ss -ltn 2>/dev/null | grep -qE ':(80|443)\s' && ! pgrep -x nginx >/dev/null; then
    die "Another program is already using port 80/443. Stop it first, or use a clean Ubuntu server."
  fi
  note "OK: Ubuntu, root access, ports free"
}

collect_answers() {
  say "A few questions (press Enter to accept a [default])"
  ask DOMAIN "Your domain, e.g. errandboys.com (no https://, no www)"
  DOMAIN="$(echo "$DOMAIN" | tr 'A-Z' 'a-z' | sed -E 's#^https?://##; s#^www\.##; s#/.*$##')"
  [[ "$DOMAIN" =~ ^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$ ]] || die "That does not look like a domain name: '$DOMAIN'"
  ask CERT_EMAIL "Your email (for HTTPS certificate notices)"
  [[ "$CERT_EMAIL" == *@*.* ]] || die "Please enter a valid email."
  ask SUPABASE_URL "Supabase project URL (https://xxxx.supabase.co)"
  [[ "$SUPABASE_URL" =~ ^https://[a-z0-9-]+\.supabase\.(co|com)/?$ ]] || die "That is not a Supabase project URL."
  ask SUPABASE_ANON_KEY "Supabase anon key" "" secret
  ask SUPABASE_SERVICE_ROLE_KEY "Supabase service_role key (secret)" "" secret
  [ -n "$SUPABASE_ANON_KEY" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] || die "Both Supabase keys are required."
  ask PAYSTACK_SECRET_KEY "Paystack secret key (sk_test_... for testing; Enter to add later)" "" secret
  ask FALLBACK_EMAIL "Email Paystack can use when a customer gave none" "$CERT_EMAIL"
  ask ALERT_EMAIL "Email for 'payment received' alerts" "$CERT_EMAIL"
}

install_packages() {
  say "Installing server software (nginx, Node.js 20, pm2, HTTPS tools)"
  run apt-get update -y
  run apt-get install -y nginx certbot python3-certbot-nginx ufw curl ca-certificates python3
  if [ "$DRY" = 1 ] || ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
    run bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -'
    run apt-get install -y nodejs
  fi
  command -v pm2 >/dev/null 2>&1 || run npm install -g pm2
  local mem swap
  mem=$(awk '/MemTotal/{print $2}' /proc/meminfo 2>/dev/null || echo 9999999); swap=$(awk '/SwapTotal/{print $2}' /proc/meminfo 2>/dev/null || echo 0)
  if [ "$mem" -lt 1800000 ] && [ "$swap" -eq 0 ] && [ "$DRY" != 1 ]; then
    warn "Only $((mem/1024)) MB of memory: building the dashboard may fail without swap."
    if confirm "Create a 2 GB swap file now?"; then
      fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
      grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
  fi
}

copy_project() {
  say "Copying the project to $TARGET"
  id "$APP_USER" >/dev/null 2>&1 || run useradd -m -s /bin/bash "$APP_USER"
  mkdir -p "$TARGET"
  local excl=(--exclude=node_modules --exclude=.next --exclude=.env --exclude=.env.local)
  [ "$MODE" = update ] && excl+=(--exclude=customer/dist/config.js --exclude=customer/public/config.js --exclude=customer/dist/catalog.json --exclude=customer/public/catalog.json)   # keep your own settings and shop on update
  (cd "$SRC" && tar cf - "${excl[@]}" customer admin) | (cd "$TARGET" && tar xf -)
  # the process file must point at the real install folder
  sed -i "s|^const base = .*|const base = '$TARGET/admin';|" "$TARGET/admin/deploy/ecosystem.config.cjs"
  run chown -R "$APP_USER:$APP_USER" "$TARGET"
}

write_settings() {
  say "Writing your settings (private files are readable only by the app)"
  local api="$TARGET/admin/api/.env" dash="$TARGET/admin/dashboard/.env.local" cfg="$TARGET/customer/dist/config.js" cfg2="$TARGET/customer/public/config.js"
  ( umask 077; cp "$TARGET/admin/api/.env.example" "$api"; cp "$TARGET/admin/dashboard/.env.local.example" "$dash" )
  set_env "$api" PORT 4000
  set_env "$api" SUPABASE_URL "${SUPABASE_URL%/}"
  set_env "$api" SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"
  set_env "$api" SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
  set_env "$api" CORS_ORIGINS "https://$DOMAIN,https://www.$DOMAIN,https://admin.$DOMAIN"
  set_env "$api" CUSTOMER_SITE_URL "https://$DOMAIN"
  set_env "$api" DASHBOARD_URL "https://admin.$DOMAIN"
  set_env "$api" PAYMENT_PROVIDER paystack
  set_env "$api" PAYSTACK_SECRET_KEY "$PAYSTACK_SECRET_KEY"
  set_env "$api" PAYMENT_CALLBACK_URL "https://$DOMAIN/#/paid"
  set_env "$api" PAYMENT_FALLBACK_EMAIL "$FALLBACK_EMAIL"
  set_env "$api" ADMIN_ALERT_EMAIL "$ALERT_EMAIL"
  set_env "$dash" NEXT_PUBLIC_API_URL "https://api.$DOMAIN"
  set_env "$dash" NEXT_PUBLIC_SITE_URL "https://$DOMAIN"
  sed -i "s|API_URL: '[^']*'|API_URL: 'https://api.$DOMAIN'|" "$cfg" "$cfg2"
  chmod 600 "$api" "$dash"
  run chown "$APP_USER:$APP_USER" "$api" "$dash" "$cfg" "$cfg2"
  [ -n "$PAYSTACK_SECRET_KEY" ] || warn "No Paystack key yet: quotes will save but no payment links will be created until you add it to $api and run: sudo -u $APP_USER pm2 restart errandboy-api"
}

build_apps() {
  say "Installing dependencies and building (this takes a few minutes)"
  as_app "cd '$TARGET/admin/api' && if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi"
  as_app "cd '$TARGET/admin/dashboard' && if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm run build"
}

setup_nginx() {
  say "Configuring the web server"
  local conf=/etc/nginx/sites-available
  for pair in "customer:$TARGET/customer/nginx-customer.conf" "api:$TARGET/admin/deploy/nginx-api.conf" "dashboard:$TARGET/admin/deploy/nginx-dashboard.conf"; do
    local name="${pair%%:*}" file="${pair#*:}"
    if [ "$DRY" = 1 ]; then sed "s/yourdomain\.com/$DOMAIN/g" "$file" > "$TARGET/.nginx-$name.preview"; else sed "s/yourdomain\.com/$DOMAIN/g" "$file" > "$conf/errandboy-$name"; ln -sf "$conf/errandboy-$name" "/etc/nginx/sites-enabled/errandboy-$name"; fi
  done
  run rm -f /etc/nginx/sites-enabled/default
  run nginx -t
  run systemctl reload nginx
}

setup_firewall() {
  say "Firewall"
  local sshp=22
  [ "$DRY" = 1 ] || sshp=$(ss -tlnp 2>/dev/null | awk '/sshd/{n=split($4,a,":"); print a[n]; exit}'); sshp="${sshp:-22}"
  if confirm "Turn on the firewall (allows SSH on port $sshp, web 80/443, blocks the rest)?"; then
    run ufw allow "$sshp/tcp"; run ufw allow 'Nginx Full'; run ufw --force enable
  else warn "Firewall left off. Consider enabling it later."; fi
}

start_apps() {
  say "Starting the apps (they restart automatically after a reboot)"
  as_app "pm2 delete errandboy-api errandboy-dashboard >/dev/null 2>&1 || true; pm2 start '$TARGET/admin/deploy/ecosystem.config.cjs' && pm2 save"
  run env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
  [ "$DRY" = 1 ] || { sleep 6; curl -fsS http://127.0.0.1:4000/health >/dev/null && note "API is running." || warn "API did not answer. See: sudo -u $APP_USER pm2 logs errandboy-api"; }
}

setup_https() {
  say "HTTPS certificates"
  [ "$DRY" = 1 ] && { run certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN" -d "admin.$DOMAIN" -m "$CERT_EMAIL" --agree-tos --non-interactive --redirect; return; }
  local ip names=() n; ip=$(curl -4 -fsS --max-time 8 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
  for n in "$DOMAIN" "www.$DOMAIN" "api.$DOMAIN" "admin.$DOMAIN"; do
    if [ "$(getent ahostsv4 "$n" | awk 'NR==1{print $1}')" = "$ip" ]; then names+=(-d "$n"); else warn "$n does not point to this server ($ip) yet: skipped"; fi
  done
  if [ "${#names[@]}" -eq 0 ]; then warn "No domain points here yet. Fix your DNS, then run:  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN -d admin.$DOMAIN"; return; fi
  certbot --nginx "${names[@]}" -m "$CERT_EMAIL" --agree-tos --non-interactive --redirect || warn "Certificate request failed. Check your DNS, then run it again: sudo bash install.sh"
}

summary() {
  say "Done"
  cat <<EOF
   Website:          https://$DOMAIN
   Admin dashboard:  https://admin.$DOMAIN        (agents: https://admin.$DOMAIN/agent)
   API:              https://api.$DOMAIN/health

   Still to do by hand:
   1. Supabase: create your admin login and run admin/database/create-staff-users.sql (see README).
   2. Paystack dashboard > Settings > API Keys & Webhooks: webhook URL
          https://api.$DOMAIN/api/webhooks/payment
   3. Run the test in README (section 6, step 11) with your Paystack TEST key before going live.
   4. Edit $TARGET/customer/dist/config.js if your WhatsApp number, phone or email differ, and
      $TARGET/customer/dist/catalog.json to change what the shop sells (placeholders for now).

   Useful:   sudo -u $APP_USER pm2 status      sudo -u $APP_USER pm2 logs
   Update:   upload the new folder, then  sudo bash install.sh --update
EOF
}

update_only() {
  say "Update mode: keeping your settings"
  [ -f "$TARGET/admin/api/.env" ] || die "No existing install found at $TARGET. Run without --update first."
  copy_project; build_apps; start_apps; say "Updated"
}

if [ "$MODE" = update ]; then preflight; update_only; exit 0; fi
preflight; collect_answers; install_packages; copy_project; write_settings; build_apps; setup_nginx; setup_firewall; start_apps; setup_https; summary
