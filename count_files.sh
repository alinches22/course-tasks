#!/bin/bash

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

usage() {
    echo "Usage: $0 --check_dir=<directory>"
    exit 1
}

if [ "$#" -ne 1 ]; then
    usage
fi

if [[ $1 =~ ^--check_dir=(.*) ]]; then
    DIRECTORY="${BASH_REMATCH[1]}"
else
    usage
fi

if [ ! -d "$DIRECTORY" ]; then
    echo "The directory $DIRECTORY does not exist."
    exit 2
fi

FILE_COUNT=$(find "$DIRECTORY" -type f | wc -l)
echo "Number of files in $DIRECTORY: $FILE_COUNT"





