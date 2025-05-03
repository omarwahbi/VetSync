#!/bin/bash

# This script generates favicon files in various formats from favicon.svg
# Requires Inkscape and ImageMagick to be installed

# Directory where public files are stored
PUBLIC_DIR="./public"

# Check if the source favicon.svg exists
if [ ! -f "$PUBLIC_DIR/favicon.svg" ]; then
  echo "Error: $PUBLIC_DIR/favicon.svg not found!"
  exit 1
fi

echo "Generating favicon files from $PUBLIC_DIR/favicon.svg..."

# Function to generate PNG files using Inkscape
generate_png() {
  local size=$1
  local output=$2
  
  echo "Generating $output at ${size}x${size}..."
  if command -v inkscape &> /dev/null; then
    inkscape -w $size -h $size "$PUBLIC_DIR/favicon.svg" -o "$PUBLIC_DIR/$output"
  else
    echo "Warning: Inkscape not found. Using convert instead (quality may be lower)."
    convert -background none -size "${size}x${size}" "$PUBLIC_DIR/favicon.svg" "$PUBLIC_DIR/$output"
  fi
}

# Generate PNG files at different sizes
generate_png 16 "favicon-16x16.png"
generate_png 32 "favicon-32x32.png"
generate_png 48 "favicon-48x48.png"
generate_png 180 "apple-touch-icon.png"
generate_png 192 "android-chrome-192x192.png"
generate_png 512 "android-chrome-512x512.png"

# Generate favicon.ico (contains 16x16, 32x32, and 48x48)
echo "Generating favicon.ico..."
if command -v convert &> /dev/null; then
  convert "$PUBLIC_DIR/favicon-16x16.png" "$PUBLIC_DIR/favicon-32x32.png" "$PUBLIC_DIR/favicon-48x48.png" "$PUBLIC_DIR/favicon.ico"
else
  echo "Error: ImageMagick (convert) not found. Cannot generate favicon.ico."
fi

# Create Safari pinned tab icon
echo "Generating safari-pinned-tab.svg..."
cp "$PUBLIC_DIR/favicon.svg" "$PUBLIC_DIR/safari-pinned-tab.svg"

echo "Favicon generation complete!" 