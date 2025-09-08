#!/bin/bash

# RYTHM Development Servers Auto-Restart Script
# This script starts both API and Frontend servers with auto-restart functionality

set -e

# Configuration
API_PORT=3001
FRONTEND_PORT=3000
API_DIR="/Users/lars-olofallerhed/Code/Azure/RYTHM/apps/api"
FRONTEND_DIR="/Users/lars-olofallerhed/Code/Azure/RYTHM/apps/mobile"
LOG_DIR="/Users/lars-olofallerhed/Code/Azure/RYTHM/logs"
MAX_RETRIES=5
RETRY_DELAY=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to kill existing processes
cleanup_processes() {
    print_status "Cleaning up existing processes..."
    
    # Kill processes on specific ports
    if lsof -ti:$API_PORT >/dev/null 2>&1; then
        print_status "Killing existing API server on port $API_PORT"
        lsof -ti:$API_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    if lsof -ti:$FRONTEND_PORT >/dev/null 2>&1; then
        print_status "Killing existing frontend server on port $FRONTEND_PORT"
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill any remaining node processes related to our apps
    pkill -f "node.*simple-server" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    
    sleep 2
    print_success "Cleanup completed"
}

# Function to check if port is available
is_port_available() {
    local port=$1
    ! lsof -i:$port >/dev/null 2>&1
}

# Function to check if server is responding
is_server_healthy() {
    local port=$1
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        ((attempt++))
    done
    return 1
}

# Function to start API server with retry logic
start_api_server() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        print_status "Starting API server (attempt $((retries + 1))/$MAX_RETRIES)..."
        
        if ! is_port_available $API_PORT; then
            print_warning "Port $API_PORT is occupied, cleaning up..."
            lsof -ti:$API_PORT | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
        
        # Start API server in background
        cd "$API_DIR"
        nohup node src/simple-server.js > "$LOG_DIR/api.log" 2>&1 &
        local api_pid=$!
        
        # Wait a moment for server to start
        sleep 3
        
        # Check if API server is healthy
        if is_server_healthy $API_PORT; then
            print_success "API server started successfully (PID: $api_pid)"
            echo $api_pid > "$LOG_DIR/api.pid"
            return 0
        else
            print_error "API server failed to start or respond"
            kill $api_pid 2>/dev/null || true
            ((retries++))
            
            if [ $retries -lt $MAX_RETRIES ]; then
                print_status "Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    print_error "Failed to start API server after $MAX_RETRIES attempts"
    return 1
}

# Function to start frontend server with retry logic
start_frontend_server() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        print_status "Starting Frontend server (attempt $((retries + 1))/$MAX_RETRIES)..."
        
        if ! is_port_available $FRONTEND_PORT; then
            print_warning "Port $FRONTEND_PORT is occupied, cleaning up..."
            lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
        
        # Start frontend server in background
        cd "$FRONTEND_DIR"
        nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
        local frontend_pid=$!
        
        # Wait for Next.js to compile and start
        sleep 10
        
        # Check if frontend server is healthy
        if is_server_healthy $FRONTEND_PORT; then
            print_success "Frontend server started successfully (PID: $frontend_pid)"
            echo $frontend_pid > "$LOG_DIR/frontend.pid"
            return 0
        else
            print_error "Frontend server failed to start or respond"
            kill $frontend_pid 2>/dev/null || true
            ((retries++))
            
            if [ $retries -lt $MAX_RETRIES ]; then
                print_status "Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    print_error "Failed to start Frontend server after $MAX_RETRIES attempts"
    return 1
}

# Function to monitor and restart servers
monitor_servers() {
    print_status "Starting server monitoring..."
    
    while true; do
        # Check API server
        if ! is_server_healthy $API_PORT; then
            print_warning "API server is not responding, restarting..."
            if [ -f "$LOG_DIR/api.pid" ]; then
                kill "$(cat $LOG_DIR/api.pid)" 2>/dev/null || true
                rm -f "$LOG_DIR/api.pid"
            fi
            start_api_server
        fi
        
        # Check Frontend server
        if ! is_server_healthy $FRONTEND_PORT; then
            print_warning "Frontend server is not responding, restarting..."
            if [ -f "$LOG_DIR/frontend.pid" ]; then
                kill "$(cat $LOG_DIR/frontend.pid)" 2>/dev/null || true
                rm -f "$LOG_DIR/frontend.pid"
            fi
            start_frontend_server
        fi
        
        # Wait before next check
        sleep 30
    done
}

# Trap for cleanup on script exit
cleanup_on_exit() {
    print_status "Shutting down servers..."
    
    if [ -f "$LOG_DIR/api.pid" ]; then
        kill "$(cat $LOG_DIR/api.pid)" 2>/dev/null || true
        rm -f "$LOG_DIR/api.pid"
    fi
    
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        kill "$(cat $LOG_DIR/frontend.pid)" 2>/dev/null || true
        rm -f "$LOG_DIR/frontend.pid"
    fi
    
    cleanup_processes
    print_success "Cleanup completed"
    exit 0
}

trap cleanup_on_exit SIGINT SIGTERM

# Main execution
main() {
    print_status "Starting RYTHM Development Servers with Auto-Restart"
    print_status "API Port: $API_PORT | Frontend Port: $FRONTEND_PORT"
    print_status "Logs Directory: $LOG_DIR"
    print_status "Press Ctrl+C to stop all servers"
    echo ""
    
    # Cleanup any existing processes
    cleanup_processes
    
    # Start servers
    if start_api_server && start_frontend_server; then
        print_success "Both servers started successfully!"
        print_status "API: http://localhost:$API_PORT"
        print_status "Frontend: http://localhost:$FRONTEND_PORT"
        print_status "Logs: tail -f $LOG_DIR/api.log $LOG_DIR/frontend.log"
        echo ""
        
        # Start monitoring
        monitor_servers
    else
        print_error "Failed to start one or more servers"
        cleanup_on_exit
        exit 1
    fi
}

# Check if running as main script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi