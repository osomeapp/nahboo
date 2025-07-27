#!/bin/bash

# Deployment script for Magical Learning Platform
# Supports Vercel, Railway, and Docker deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.local"

# Functions
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

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if .env.local exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error ".env.local file not found. Please create it from .env.local.example"
        exit 1
    fi
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 18 ]]; then
        log_error "Node.js 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

install_dependencies() {
    log_info "Installing dependencies..."
    cd "$PROJECT_ROOT"
    npm ci
    log_success "Dependencies installed"
}

run_tests() {
    log_info "Running tests and checks..."
    cd "$PROJECT_ROOT"
    
    # Type check
    log_info "Running TypeScript checks..."
    npx tsc --noEmit
    
    # Linting
    log_info "Running ESLint..."
    npm run lint
    
    # Build test
    log_info "Testing build..."
    npm run build
    
    log_success "All tests passed"
}

deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel@latest
    fi
    
    cd "$PROJECT_ROOT"
    
    # Production deployment
    if [[ "$1" == "production" ]]; then
        log_info "Deploying to production..."
        vercel --prod
    else
        log_info "Deploying preview..."
        vercel
    fi
    
    log_success "Vercel deployment completed"
}

deploy_railway() {
    log_info "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI not found. Install it from: https://railway.app/cli"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check if logged in
    if ! railway whoami &> /dev/null; then
        log_info "Please log in to Railway first:"
        railway login
    fi
    
    # Deploy
    railway up
    
    log_success "Railway deployment completed"
}

deploy_docker() {
    log_info "Building and deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Build image
    log_info "Building Docker image..."
    docker build -t magical-learning-platform:latest \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$(grep NEXT_PUBLIC_SUPABASE_URL $ENV_FILE | cut -d '=' -f2)" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY $ENV_FILE | cut -d '=' -f2)" \
        --build-arg SUPABASE_SERVICE_ROLE_KEY="$(grep SUPABASE_SERVICE_ROLE_KEY $ENV_FILE | cut -d '=' -f2)" \
        --build-arg OPENAI_API_KEY="$(grep OPENAI_API_KEY $ENV_FILE | cut -d '=' -f2)" \
        --build-arg NEXT_PUBLIC_APP_URL="$(grep NEXT_PUBLIC_APP_URL $ENV_FILE | cut -d '=' -f2)" \
        .
    
    # Run container
    if [[ "$1" == "run" ]]; then
        log_info "Starting Docker container..."
        docker run -p 3000:3000 --env-file "$ENV_FILE" magical-learning-platform:latest
    fi
    
    log_success "Docker deployment completed"
}

deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Start services
    docker-compose up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Application is running at http://localhost:3000"
    else
        log_error "Health check failed"
        docker-compose logs app
        exit 1
    fi
    
    log_success "Docker Compose deployment completed"
}

show_help() {
    echo "Magical Learning Platform Deployment Script"
    echo ""
    echo "Usage: $0 [PLATFORM] [OPTIONS]"
    echo ""
    echo "Platforms:"
    echo "  vercel [production]    Deploy to Vercel (production flag for prod deployment)"
    echo "  railway               Deploy to Railway"
    echo "  docker [run]          Build Docker image (run flag to start container)"
    echo "  docker-compose        Deploy with Docker Compose"
    echo ""
    echo "Options:"
    echo "  --skip-tests         Skip running tests before deployment"
    echo "  --skip-deps          Skip dependency installation"
    echo "  --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 vercel                    # Deploy preview to Vercel"
    echo "  $0 vercel production         # Deploy to Vercel production"
    echo "  $0 railway                   # Deploy to Railway"
    echo "  $0 docker run                # Build and run Docker container"
    echo "  $0 docker-compose            # Start with Docker Compose"
}

# Main execution
main() {
    log_info "Starting deployment for Magical Learning Platform..."
    
    # Parse arguments
    PLATFORM=""
    SKIP_TESTS=false
    SKIP_DEPS=false
    
    for arg in "$@"; do
        case $arg in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            vercel|railway|docker|docker-compose)
                PLATFORM="$arg"
                shift
                ;;
        esac
    done
    
    if [[ -z "$PLATFORM" ]]; then
        log_error "Please specify a deployment platform"
        show_help
        exit 1
    fi
    
    # Run deployment steps
    check_requirements
    
    if [[ "$SKIP_DEPS" != true ]]; then
        install_dependencies
    fi
    
    if [[ "$SKIP_TESTS" != true ]]; then
        run_tests
    fi
    
    # Deploy to specified platform
    case $PLATFORM in
        vercel)
            deploy_vercel "$2"
            ;;
        railway)
            deploy_railway
            ;;
        docker)
            deploy_docker "$2"
            ;;
        docker-compose)
            deploy_docker_compose
            ;;
        *)
            log_error "Unknown platform: $PLATFORM"
            show_help
            exit 1
            ;;
    esac
    
    log_success "Deployment completed successfully! 🚀"
}

# Run main function with all arguments
main "$@"