#!/bin/bash

OUTPUT="give-files-from-path.txt"

FILES=(
app/pages/index.vue
app/components/table/DataTable.vue
app/components/table/TableFilters.vue
app/components/table/Pagination.vue
server/api/jobs.get.js
server/api/filters.get.js
server/utils/supabase.js

)

> "$OUTPUT"

echo "# Review Files" >> "$OUTPUT"
echo "" >> "$OUTPUT"

for FILE in "${FILES[@]}"; do
    echo "============================================================" >> "$OUTPUT"
    echo "FILE: $FILE" >> "$OUTPUT"
    echo "============================================================" >> "$OUTPUT"
    echo "" >> "$OUTPUT"

    if [ -f "$FILE" ]; then
        cat "$FILE" >> "$OUTPUT"
    else
        echo "FILE NOT FOUND" >> "$OUTPUT"
    fi

    echo "" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done

echo "Created $OUTPUT"