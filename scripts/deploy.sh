#!/usr/bin/env bash
# ==============================================================================
# SIGAP - VPS Deployment & Update Automation Script
# Menjalankan orkestrasi pembaruan aplikasi di server/VPS secara terpadu.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "${PROJECT_ROOT}"

echo "=================================================="
echo " [SIGAP] Memulai Skrip Deployment Otomatis di VPS"
echo " Waktu: $(date)"
echo " Direktori: ${PROJECT_ROOT}"
echo "=================================================="

# 1. Pastikan file konfigurasi .env ada
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "⚠️ .env tidak ditemukan, membuat salinan dari .env.example..."
    cp .env.example .env
    echo "❗ Mohon sesuaikan variabel rahasia di .env sebelum menjalankan di production!"
  else
    echo "❌ Error: File .env dan .env.example tidak ditemukan!" >&2
    exit 1
  fi
fi

# 2. Update dependensi node packages
echo "📦 Memeriksa dan menginstal dependencies..."
npm ci --prefer-offline --no-audit

# 3. Jalankan infrastruktur container Docker (PostgreSQL & Redis)
echo "🐳 Menjalankan kontainer database & cache via Docker Compose..."
if command -v docker &> /dev/null; then
  docker compose up -d
else
  echo "⚠️ Perintah 'docker' tidak ditemukan di environment ini. Melewati start docker."
fi

# 4. Jalankan migrasi schema Prisma (PRD TC-DB-08: prisma migrate deploy di VPS)
echo "🗄️ Menjalankan migrasi database PostgreSQL via Prisma..."
npx prisma generate
npx prisma db push --skip-generate

# 5. Build aplikasi Next.js untuk production
echo "⚡ Mengompilasi aplikasi Next.js (production build)..."
npm run build

echo "=================================================="
echo "✅ Deployment SIGAP selesai dengan sukses!"
echo "Aplikasi siap dijalankan dengan: npm run start"
echo "Atau dikelola via process manager: pm2 restart sigap"
echo "=================================================="
