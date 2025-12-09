#!/bin/bash

# Guest Pass System Release Script
# Comprehensive release management with versioning, tagging, and deployment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION_FILE="$PROJECT_ROOT/VERSION"
PACKAGE_JSON="$PROJECT_ROOT/package.json"
CHANGELOG_FILE="$PROJECT_ROOT/CHANGELOG.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Check git status
check_git_status() {
    log_info "Checking git status..."
    
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        log_error "Not a git repository"
        exit 1
    fi
    
    local git_status=$(git status --porcelain)
    if [ -n "$git_status" ]; then
        log_warning "Working directory has uncommitted changes:"
        echo "$git_status"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Release cancelled by user"
            exit 0
        fi
    fi
    
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        log_warning "Current branch is '$current_branch', not 'main' or 'master'"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Release cancelled by user"
            exit 0
        fi
    fi
    
    log_success "Git status check passed"
}

# Get version from user
get_version() {
    local current_version=$(node "$SCRIPT_DIR/version-manager.js" current 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "1.0.0")
    
    echo
    log_info "Current version: $current_version"
    echo
    echo "Version bump options:"
    echo "  1) major (${current_version} -> $(node "$SCRIPT_DIR/version-manager.js" bump major 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "?.?.?"))"
    echo "  2) minor (${current_version} -> $(node "$SCRIPT_DIR/version-manager.js" bump minor 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "?.?.?"))"
    echo "  3) patch (${current_version} -> $(node "$SCRIPT_DIR/version-manager.js" bump patch 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "?.?.?"))"
    echo "  4) prerelease (${current_version} -> $(node "$SCRIPT_DIR/version-manager.js" bump prerelease 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "?.?.?"))"
    echo "  5) custom version"
    echo
    
    read -p "Select version bump (1-5) or enter custom version: " version_choice
    
    case $version_choice in
        1)
            NEW_VERSION=$(node "$SCRIPT_DIR/version-manager.js" bump major 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "1.0.0")
            ;;
        2)
            NEW_VERSION=$(node "$SCRIPT_DIR/version-manager.js" bump minor 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "1.0.0")
            ;;
        3)
            NEW_VERSION=$(node "$SCRIPT_DIR/version-manager.js" bump patch 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "1.0.0")
            ;;
        4)
            NEW_VERSION=$(node "$SCRIPT_DIR/version-manager.js" bump prerelease 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+.*' || echo "1.0.0")
            ;;
        5)
            read -p "Enter custom version (e.g., 1.2.3): " custom_version
            NEW_VERSION=$custom_version
            ;;
        *)
            if [[ $version_choice =~ ^[0-9]+\.[0-9]+\.[0-9]+(-.+)?$ ]]; then
                NEW_VERSION=$version_choice
            else
                log_error "Invalid version format"
                exit 1
            fi
            ;;
    esac
    
    log_info "Selected version: $NEW_VERSION"
}

# Get release notes
get_release_notes() {
    log_info "Enter release notes (press Ctrl+D when done):"
    RELEASE_NOTES=$(cat << 'EOF'
$(cat)
EOF
)
    
    if [ -z "$RELEASE_NOTES" ]; then
        RELEASE_NOTES="- Version bump to $NEW_VERSION"
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        if npm run test --silent 2>/dev/null; then
            log_success "Tests passed"
        else
            log_warning "Tests failed or no test script found"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_warning "No package.json found, skipping tests"
    fi
}

# Build project
build_project() {
    log_info "Building project..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "package.json" ]; then
        if npm run build --silent 2>/dev/null; then
            log_success "Build completed successfully"
        else
            log_error "Build failed"
            exit 1
        fi
    else
        log_info "No build script found, using default build process"
        "$SCRIPT_DIR/build.sh"
    fi
}

# Create release
create_release() {
    log_info "Creating release $NEW_VERSION..."
    
    cd "$PROJECT_ROOT"
    
    # Run version manager release
    node "$SCRIPT_DIR/version-manager.js" release "$NEW_VERSION" $(echo "$RELEASE_NOTES" | tr '\n' ' ') || {
        log_error "Version manager release failed"
        exit 1
    }
    
    log_success "Release created successfully"
}

# Generate checksums
generate_checksums() {
    log_info "Generating checksums..."
    
    local dist_dir="$PROJECT_ROOT/dist"
    local checksums_file="$PROJECT_ROOT/checksums.txt"
    
    if [ -d "$dist_dir" ]; then
        cd "$dist_dir"
        find . -type f -exec sha256sum {} \; > "$checksums_file"
        log_success "Checksums generated: $checksums_file"
    else
        log_warning "No dist directory found, skipping checksums"
    fi
}

# Create release package
create_package() {
    log_info "Creating release package..."
    
    local package_name="guest-pass-system-${NEW_VERSION}.tar.gz"
    local package_path="$PROJECT_ROOT/releases/$package_name"
    
    mkdir -p "$PROJECT_ROOT/releases"
    
    cd "$PROJECT_ROOT"
    
    # Create package with essential files
    tar -czf "$package_path" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='releases' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='*.tmp' \
        --exclude='dist/*.map' \
        dist/ \
        scripts/ \
        config/ \
        docs/ \
        VERSION \
        package.json \
        CHANGELOG.md \
        checksums.txt \
        README.md \
        LICENSE \
        vercel.json \
        .versionrc \
        2>/dev/null || true
    
    if [ -f "$package_path" ]; then
        log_success "Release package created: $package_path"
        
        # Generate package checksum
        local package_checksum=$(sha256sum "$package_path" | cut -d' ' -f1)
        echo "$package_checksum  $package_name" >> "$PROJECT_ROOT/checksums.txt"
        
        # Create package info file
        cat > "$PROJECT_ROOT/releases/package-info.json" << EOF
{
  "version": "$NEW_VERSION",
  "package": "$package_name",
  "checksum": "$package_checksum",
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "size": $(stat -c%s "$package_path" 2>/dev/null || stat -f%z "$package_path" 2>/dev/null || echo 0)
}
EOF
        
    else
        log_error "Failed to create release package"
        exit 1
    fi
}

# Push to remote (optional)
push_to_remote() {
    log_info "Push changes to remote repository?"
    read -p "Push to origin? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Pushing to remote..."
        
        if git push origin --tags && git push origin HEAD; then
            log_success "Changes pushed to remote successfully"
        else
            log_error "Failed to push to remote"
            exit 1
        fi
    else
        log_info "Skipping push to remote"
    fi
}

# Main release process
main() {
    echo
    log_info "🚀 Guest Pass System Release Process"
    echo "====================================="
    echo
    
    # Run all steps
    check_prerequisites
    check_git_status
    get_version
    get_release_notes
    run_tests
    build_project
    create_release
    generate_checksums
    create_package
    push_to_remote
    
    echo
    log_success "🎉 Release $NEW_VERSION completed successfully!"
    echo
    log_info "Release artifacts:"
    echo "  - Package: releases/guest-pass-system-${NEW_VERSION}.tar.gz"
    echo "  - Checksums: checksums.txt"
    echo "  - Package Info: releases/package-info.json"
    echo "  - Git Tag: v${NEW_VERSION}"
    echo
    log_info "Next steps:"
    echo "  1. Test the release package in staging environment"
    echo "  2. Deploy to production using: ./scripts/deploy.sh --version $NEW_VERSION"
    echo "  3. Monitor deployment and verify functionality"
    echo "  4. Update documentation and notify stakeholders"
    echo
}

# Handle script interruption
trap 'log_error "Release process interrupted"; exit 1' INT TERM

# Run main function
main "$@"