#!/usr/bin/env bash
set -euo pipefail

# Script to update mobile app UI theme from blue/purple to dark orange
# Applies systematic replacements across all page files

echo "🎨 Starting Mobile App UI Theme Update..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MOBILE_DIR="apps/mobile/src"

# Color replacement patterns
declare -A REPLACEMENTS=(
  # Backgrounds
  ["bg-gradient-to-br from-blue-50"]="bg-dark-primary"
  ["bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"]="bg-dark-primary"
  ["bg-gradient-to-br from-blue-50 to-indigo-100"]="bg-dark-primary"
  ["dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900"]=""
  ["dark:from-gray-900 dark:to-gray-800"]=""
  ["dark:from-gray-900 dark:via-purple-900 dark:to-blue-900"]=""
  ["bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"]="bg-dark-card"
  ["bg-gray-50 dark:bg-gray-800"]="bg-dark-card"
  ["bg-gray-100 dark:bg-gray-700"]="bg-dark-elevated"
  
  # Gradients
  ["from-blue-600 to-purple-600"]="from-orange-primary to-orange-hover"
  ["from-blue-500 to-blue-600"]="from-orange-primary to-orange-hover"
  ["from-blue-700 to-purple-700"]="from-orange-dark to-orange-primary"
  
  # Borders
  ["border-gray-200/50 dark:border-gray-700/50"]="border-dark-border"
  ["border-gray-200 dark:border-gray-700"]="border-dark-border"
  ["border-gray-300 dark:border-gray-600"]="border-dark-border"
  
  # Text colors
  ["text-gray-900 dark:text-gray-100"]="text-text-primary"
  ["text-gray-600 dark:text-gray-400"]="text-text-secondary"
  ["text-gray-500 dark:text-gray-500"]="text-text-tertiary"
  ["dark:text-gray-400"]="text-text-secondary"
  ["dark:text-gray-300"]="text-text-primary"
  
  # Blue to Orange accent replacements
  ["text-blue-600 dark:text-blue-400"]="text-orange-primary"
  ["text-blue-600"]="text-orange-primary"
  ["hover:text-blue-700 dark:hover:text-blue-300"]="hover:text-orange-hover"
  ["hover:text-blue-700"]="hover:text-orange-hover"
  ["text-blue-600"]="text-orange-primary"
  
  # Checkbox/radio colors
  ["text-blue-600 border-gray-300"]="text-orange-primary border-dark-border"
  ["focus:ring-blue-500"]="focus:ring-orange-primary"
  
  # Hover states
  ["hover:bg-white dark:hover:bg-gray-800"]="hover:bg-dark-elevated hover:border-orange-primary/30"
  ["hover:bg-gray-50 dark:hover:bg-gray-700"]="hover:bg-dark-elevated"
  
  # Icon backgrounds
  ["bg-blue-100 dark:bg-blue-900"]="bg-dark-elevated border border-dark-border"
  ["bg-green-100 dark:bg-green-900"]="bg-dark-elevated border border-dark-border"
  ["bg-purple-100 dark:bg-purple-900"]="bg-dark-elevated border border-dark-border"
  
  # Shadow and effects
  ["shadow-xl"]="shadow-card"
  ["shadow-lg"]="shadow-glow-orange"
)

# Function to apply replacements to a file
update_file() {
  local file=$1
  local temp_file="${file}.tmp"
  local modified=false
  
  cp "$file" "$temp_file"
  
  for pattern in "${!REPLACEMENTS[@]}"; do
    replacement="${REPLACEMENTS[$pattern]}"
    if grep -q "$pattern" "$temp_file" 2>/dev/null; then
      sed -i '' "s|${pattern}|${replacement}|g" "$temp_file"
      modified=true
    fi
  done
  
  if [ "$modified" = true ]; then
    mv "$temp_file" "$file"
    echo "  ✓ Updated: $file"
    return 0
  else
    rm "$temp_file"
    return 1
  fi
}

# Find and update all relevant files
echo ""
echo "📝 Updating page files..."
updated_count=0

while IFS= read -r file; do
  if update_file "$file"; then
    ((updated_count++))
  fi
done < <(find "$MOBILE_DIR/app" -name "page.tsx" -type f)

echo ""
echo "📦 Updating component files..."

while IFS= read -r file; do
  if update_file "$file"; then
    ((updated_count++))
  fi
done < <(find "$MOBILE_DIR/components" -name "*.tsx" -type f)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Theme update complete!"
echo "📊 Updated $updated_count files"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test the app: npm run dev"
echo "  3. Commit changes: git add -A && git commit"
echo ""
