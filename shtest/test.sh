#!/bin/bash

LOG_FILE="/path/to/logfile.log"

CURRENT_TIME=$(date +"%Y-%m-%d %H:%M:%S")

cd ~/mylib

sudo git pull

echo "[$CURRENT_TIME] Pulled latest changes from Git repository" >> "$LOG_FILE"
