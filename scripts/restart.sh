#!/bin/bash

# Quick restart script for RYTHM development servers
# Usage: ./scripts/restart.sh [api|frontend|both]

set -e

API_PORT=3001
FRONTEND_PORT=3000
API_DIR="/Users/lars-olofallerhed/Code/Azure/RYTHM/apps/api"
FRONTEND_DIR="/Users/lars-olofallerhed/Code/Azure/RYTHM/apps/mobile"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

restart_api() {
    print_status "Restarting API server..."
    lsof -ti:$API_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
    cd "$API_DIR"
    nohup node src/simple-server.js > /dev/null 2>&1 &
    sleep 3
    if curl -s http://localhost:$API_PORT > /dev/null 2>&1; then
        print_success "API server restarted on port $API_PORT"
    else
        echo "Failed to restart API server"
        exit 1
    fi
}

restart_frontend() {
    print_status "Restarting Frontend server..."
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    sleep 2
    cd "$FRONTEND_DIR" 
    nohup npm run dev > /dev/null 2>&1 &
    sleep 8
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        print_success "Frontend server restarted on port $FRONTEND_PORT"
    else
        echo "Failed to restart Frontend server"
        exit 1
    fi
}

case "${1:-both}" in
    "api")
        restart_api
        ;;
    "frontend")
        restart_frontend
        ;;
    "both")
        restart_api
        restart_frontend
        ;;
    *)
        echo "Usage: $0 [api|frontend|both]"
        exit 1
        ;;
esac

print_success "Restart completed!"