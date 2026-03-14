#!/bin/bash

echo "🚀 Starting PostgreSQL..."

cd backend

if [ ! -d "postgres-data" ]; then
  echo "📦 Initializing database..."
  initdb -D postgres-data
fi

pg_ctl -D postgres-data -l logfile -o "-k $PWD" start

echo "✅ PostgreSQL started"