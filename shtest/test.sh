#!/bin/bash

# Define the log file path
LOG_FILE="mylibgitlog.log"

# Get the current date and time
CURRENT_TIME=$(date +"%Y-%m-%d %H:%M:%S")

# Write a log entry
echo "Script called at $CURRENT_TIME" >> "$LOG_FILE"

# Optionally, include any additional commands or actions here
