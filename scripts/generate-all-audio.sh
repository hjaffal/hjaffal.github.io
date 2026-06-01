#!/bin/bash
# Generate TTS audio for all vocabulary categories
# Run from project root: bash scripts/generate-all-audio.sh

CATEGORIES=(
  "starter-verbs"
  "introductions"
  "articles-pronouns"
  "numbers-dates"
  "fillers-connectors"
  "question-words"
  "locators"
  "describe-objects"
  "describe-people"
  "adjective-declension"
  "prepositions"
  "sport"
  "wunnen"
  "transport"
  "hobbyen"
  "vakanz"
  "gesondheet"
  "medien-technologien"
  "sproochen"
  "kaddoen"
  "summer-wanter"
  "aarbecht"
  "stot-maachen"
  "family"
  "frequent-verbs"
  "irregular-verbs"
  "simple-past"
  "truly-luxembourgish"
)

echo "=== Generating audio for ${#CATEGORIES[@]} categories ==="
echo ""

for cat in "${CATEGORIES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ Starting: $cat"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  node scripts/generate-audio.cjs "$cat"
  echo ""
done

echo "=== All categories complete ==="
du -sh assets/audio/vocab/
