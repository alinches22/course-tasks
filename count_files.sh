#!/bin/bash

# Підрахунок кількості файлів, ігноруючи проблемні директорії
file_count=$(find /etc -type f -not -path "/etc/polkit-1/*" -not -path "/etc/credstore/*" -not -path "/etc/ssl/private/*" 2>/dev/null | wc -l)

echo "Кількість звичайних файлів у /etc: $file_count"


