#!/bin/bash
# PWAアイコン生成スクリプト
# SVGからPNGアイコンを生成します
# 必要: ImageMagick (brew install imagemagick)

SIZES="72 96 128 144 152 192 384 512"
SOURCE="public/icons/icon.svg"
OUTPUT_DIR="public/icons"

for size in $SIZES; do
  echo "Generating ${size}x${size} icon..."
  convert -background none -resize ${size}x${size} $SOURCE "${OUTPUT_DIR}/icon-${size}.png"
done

echo "Done! Icons generated in ${OUTPUT_DIR}"
