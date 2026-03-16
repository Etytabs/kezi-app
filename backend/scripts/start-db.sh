#!/bin/bash

DB_DIR="postgres-data"
SOCKET_DIR="$DB_DIR/socket"

echo "Checking PostgreSQL..."

if pg_ctl -D $DB_DIR status > /dev/null 2>&1; then
  echo "PostgreSQL already running"
else
  echo "Starting PostgreSQL..."
  mkdir -p $SOCKET_DIR
  pg_ctl -D $DB_DIR -o "-k $(pwd)/$SOCKET_DIR" start
fi