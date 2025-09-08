#!/bin/bash

# RYTHM Health Monitor - Monitors and restarts servers automatically
# This script runs as a daemon and keeps servers healthy

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/logs/health-monitor.pid"
LOG_FILE="$PROJECT_ROOT/logs/health-monitor.log"

# Configuration
API_PORT=3001
FRONTEND_PORT=3000
CHECK_INTERVAL=15
MAX_FAILURES=3

# Create logs directory
mkdir -p "$(dirname "$PID_FILE")"

# Logging function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if server is healthy
check_health() {
    local port=$1
    local name=$2
    
    if curl -s --max-time 5 "http://localhost:$port" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Restart server
restart_server() {
    local port=$1
    local name=$2
    local start_command=$3
    
    log_message "Restarting $name server on port $port..."
    
    # Kill existing process
    if lsof -ti:$port > /dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 3
    fi
    
    # Start new process
    eval "$start_command" &
    local pid=$!
    
    # Wait for startup
    sleep 8
    
    # Verify restart
    if check_health $port "$name"; then
        log_message "$name server restarted successfully (PID: $pid)"
        return 0
    else
        log_message "Failed to restart $name server"
        return 1
    fi
}

# Main monitoring loop
monitor_loop() {
    local api_failures=0
    local frontend_failures=0
    
    log_message "Health monitor started (PID: $$)"
    
    while true; do
        # Check API server
        if ! check_health $API_PORT "API"; then
            ((api_failures++))
            log_message "API server health check failed ($api_failures/$MAX_FAILURES)"
            
            if [ $api_failures -ge $MAX_FAILURES ]; then
                restart_server $API_PORT "API" "cd '$PROJECT_ROOT/apps/api' && node src/simple-server.js > '$PROJECT_ROOT/logs/api.log' 2>&1"
                api_failures=0
            fi
        else
            if [ $api_failures -gt 0 ]; then
                log_message "API server recovered"
                api_failures=0
            fi
        fi
        
        # Check Frontend server
        if ! check_health $FRONTEND_PORT "Frontend"; then
            ((frontend_failures++))
            log_message "Frontend server health check failed ($frontend_failures/$MAX_FAILURES)"
            
            if [ $frontend_failures -ge $MAX_FAILURES ]; then
                restart_server $FRONTEND_PORT "Frontend" "cd '$PROJECT_ROOT/apps/mobile' && npm run dev > '$PROJECT_ROOT/logs/frontend.log' 2>&1"
                frontend_failures=0
            fi
        else
            if [ $frontend_failures -gt 0 ]; then
                log_message "Frontend server recovered"
                frontend_failures=0
            fi
        fi
        
        # Wait before next check
        sleep $CHECK_INTERVAL
    done
}

# Start monitoring
start_monitor() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Health monitor is already running (PID: $(cat "$PID_FILE"))"
        exit 1
    fi
    
    echo "Starting health monitor..."
    monitor_loop &
    echo $! > "$PID_FILE"
    echo "Health monitor started (PID: $!)"
    echo "Logs: tail -f $LOG_FILE"
}

# Stop monitoring
stop_monitor() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm -f "$PID_FILE"
            log_message "Health monitor stopped"
            echo "Health monitor stopped"
        else
            echo "Health monitor is not running"
            rm -f "$PID_FILE"
        fi
    else
        echo "Health monitor is not running"
    fi
}

# Show status
show_status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Health monitor is running (PID: $(cat "$PID_FILE"))"
        
        # Check server status
        if check_health $API_PORT "API"; then
            echo "✅ API server (port $API_PORT): Healthy"
        else
            echo "❌ API server (port $API_PORT): Unhealthy"
        fi
        
        if check_health $FRONTEND_PORT "Frontend"; then
            echo "✅ Frontend server (port $FRONTEND_PORT): Healthy"
        else
            echo "❌ Frontend server (port $FRONTEND_PORT): Unhealthy"
        fi
    else
        echo "Health monitor is not running"
    fi
}

# Usage
case "${1:-status}" in
    "start")
        start_monitor
        ;;
    "stop")
        stop_monitor
        ;;
    "restart")
        stop_monitor
        sleep 2
        start_monitor
        ;;
    "status")
        show_status
        ;;
    "logs")
        tail -f "$LOG_FILE"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the health monitor daemon"
        echo "  stop    - Stop the health monitor daemon"
        echo "  restart - Restart the health monitor daemon"
        echo "  status  - Show current status"
        echo "  logs    - Follow the health monitor logs"
        exit 1
        ;;
esac