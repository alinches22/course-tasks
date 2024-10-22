#!/bin/bash

file_count=$(find /etc -type f | wc -l)

echo "Кількість звичайних файлів у /etc: $file_count"


