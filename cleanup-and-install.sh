#!/usr/bin/env bash
# Kabab Kitchen - galat jagah padi files hatao.
# Repo ke root folder se chalao:  bash cleanup-and-install.sh
set -e

echo "Galat jagah padi files hata rahe hain..."
for f in page.tsx menu.ts route.ts tsconfig.tsbuildinfo; do
  if [ -f "$f" ]; then git rm -q --cached "$f" 2>/dev/null || true; rm -f "$f"; echo "  hataya: $f"; fi
done
for d in mnt app/menu; do
  if [ -d "$d" ]; then git rm -rq --cached "$d" 2>/dev/null || true; rm -rf "$d"; echo "  hataya: $d/"; fi
done

echo
echo "Ye files sahi jagah honi chahiye:"
for f in app/admin/page.tsx app/admin/settings/page.tsx app/api/admin/settings/route.ts \
         app/api/admin/upload/route.ts app/api/menu/route.ts lib/menu-overrides.ts \
         hooks/use-menu.ts types/menu.ts components/dish-card.tsx components/category-tabs.tsx; do
  [ -f "$f" ] && echo "  OK   $f" || echo "  NAHI $f   <-- ye daalo"
done

echo
echo "Ab chalao:  npm install && npm run build"
