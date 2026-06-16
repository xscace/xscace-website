#!/bin/bash
# XSCACE Sanity Backup Script
# Run: bash backup.sh
# Creates timestamped backup on Desktop

TIMESTAMP=$(date +%Y%m%d-%H%M)
BACKUP_DIR="$HOME/Desktop/xscace-backup-$TIMESTAMP"
STUDIO_DIR="$HOME/Documents/XSCACEApp/xscace-monorepo/studio"

mkdir -p "$BACKUP_DIR"

echo "═══════════════════════════════════════"
echo "XSCACE Sanity Backup — $TIMESTAMP"
echo "═══════════════════════════════════════"

# 1. Export full dataset (all documents + asset references)
echo ""
echo "Step 1: Exporting dataset..."
cd "$STUDIO_DIR"
npx sanity dataset export production "$BACKUP_DIR/dataset.tar.gz" --overwrite

if [ $? -eq 0 ]; then
  echo "✓ Dataset exported to $BACKUP_DIR/dataset.tar.gz"
else
  echo "✗ Dataset export failed"
  exit 1
fi

# 2. Save asset CDN URLs to JSON for reference
echo ""
echo "Step 2: Saving asset URLs..."
node << 'JSEOF'
const fs = require('fs')

const PROJECT = '7r0kq57d'
const DATASET = 'production'
const BACKUP_DIR = process.env.BACKUP_DIR

async function getAssets() {
  const token = process.env.SANITY_TOKEN
  if (!token) { console.log('No SANITY_TOKEN — skipping asset URL export'); return }

  const headers = { Authorization: `Bearer ${token}` }

  // Fetch all image assets
  const imgRes = await fetch(
    `https://${PROJECT}.api.sanity.io/v2021-06-07/data/query/${DATASET}?query=*[_type=="sanity.imageAsset"]{_id,url,originalFilename,size}`,
    { headers }
  )
  const { result: images } = await imgRes.json()

  // Fetch all file assets
  const fileRes = await fetch(
    `https://${PROJECT}.api.sanity.io/v2021-06-07/data/query/${DATASET}?query=*[_type=="sanity.fileAsset"]{_id,url,originalFilename,size}`,
    { headers }
  )
  const { result: files } = await fileRes.json()

  const output = {
    exportedAt: new Date().toISOString(),
    project: PROJECT,
    dataset: DATASET,
    images: images || [],
    files: files || [],
    note: 'Asset binaries live on Sanity CDN and are safe as long as the project exists. These URLs let you re-download them if needed.'
  }

  fs.writeFileSync(`${BACKUP_DIR}/asset-urls.json`, JSON.stringify(output, null, 2))
  console.log(`✓ Saved ${(images||[]).length} image URLs and ${(files||[]).length} file URLs`)
}

getAssets().catch(e => console.log('Asset URL export skipped:', e.message))
JSEOF

echo ""
echo "═══════════════════════════════════════"
echo "Backup complete: $BACKUP_DIR"
echo ""
echo "Contents:"
ls -lh "$BACKUP_DIR"
echo ""
echo "To restore if needed:"
echo "  cd $STUDIO_DIR"
echo "  npx sanity dataset import $BACKUP_DIR/dataset.tar.gz production --replace"
echo "═══════════════════════════════════════"
