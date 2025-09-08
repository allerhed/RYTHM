# Migration script for Windows PowerShell

Write-Host "Starting database migrations..."

# Check if required environment variables are set
if (-not $env:POSTGRES_HOST -or -not $env:POSTGRES_DATABASE -or -not $env:POSTGRES_ADMIN_LOGIN -or -not $env:POSTGRES_ADMIN_PASSWORD) {
    Write-Error "Required environment variables not set"
    Write-Host "Please ensure POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_ADMIN_LOGIN, and POSTGRES_ADMIN_PASSWORD are set"
    exit 1
}

# Set PostgreSQL environment variables
$env:PGPASSWORD = $env:POSTGRES_ADMIN_PASSWORD
$env:PGHOST = $env:POSTGRES_HOST
$env:PGPORT = "5432"
$env:PGUSER = $env:POSTGRES_ADMIN_LOGIN
$env:PGDATABASE = $env:POSTGRES_DATABASE

Write-Host "Connecting to PostgreSQL server: $env:POSTGRES_HOST"

# Check if psql is available
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql not found. Please install PostgreSQL client tools."
    exit 1
}

# Test connection
try {
    psql -c "SELECT 1;" | Out-Null
    Write-Host "Connected successfully!"
}
catch {
    Write-Error "Could not connect to database"
    exit 1
}

# Run migrations in order
$migrationFiles = Get-ChildItem -Path "packages/db/migrations/*.sql" | Sort-Object Name

foreach ($migrationFile in $migrationFiles) {
    if (Test-Path $migrationFile.FullName) {
        Write-Host "Running migration: $($migrationFile.Name)"
        try {
            psql -f $migrationFile.FullName
            Write-Host "✓ Migration $($migrationFile.Name) completed successfully" -ForegroundColor Green
        }
        catch {
            Write-Error "✗ Migration $($migrationFile.Name) failed"
            exit 1
        }
    }
}

Write-Host "All migrations completed successfully!" -ForegroundColor Green