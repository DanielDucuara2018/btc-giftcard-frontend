#!/bin/bash

# Google Cloud Storage deployment script for btc-giftcard-frontend
# Builds static assets via Docker and syncs them to a GCS bucket.

set -e

# ── Usage ────────────────────────────────────────────────────────────────────
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --project PROJECT      GCP project ID (auto-fetches bucket from Terraform)"
    echo "  -b, --bucket BUCKET        GCS bucket name (required if not using -p)"
    echo "  --api-url URL              API URL (defaults from Terraform or env)"
    echo "  -t, --terraform-dir DIR    Path to Terraform directory (default: ../../btc-giftcard-infrastructure)"
    echo "  --skip-build               Skip Docker build and use existing build-output/"
    echo "  --no-cleanup               Keep build-output/ after deployment"
    echo "  --no-auto-fetch            Don't auto-fetch config from Terraform"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -p my-gcp-project                   # Auto-fetch bucket from Terraform"
    echo "  $0 -b btc-giftcard-frontend-prod        # Manual bucket name"
    echo "  $0 -b my-bucket --api-url https://api.gifter.com"
    echo "  $0 -b my-bucket --skip-build            # Use existing build-output/"
}

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# ── Defaults ─────────────────────────────────────────────────────────────────
DOCKER_IMAGE="btc-giftcard-frontend"
CONTAINER_NAME="btc-giftcard-temp-build"
PROJECT_ID=""
BUCKET=""
SKIP_BUILD=false
NO_CLEANUP=false
AUTO_FETCH_CONFIG=true
TERRAFORM_DIR="${REPO_ROOT}/../btc-giftcard-infrastructure"

# API configuration — can be overridden by flags or Terraform
API_URL="${VITE_BTC_GIFTCARD_API_URL_ENV:-}"

# ── Argument parsing ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -b|--bucket)
            BUCKET="$2"
            shift 2
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        -t|--terraform-dir)
            TERRAFORM_DIR="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-cleanup)
            NO_CLEANUP=true
            shift
            ;;
        --no-auto-fetch)
            AUTO_FETCH_CONFIG=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# ── Terraform auto-fetch (optional) ──────────────────────────────────────────
if [[ -n "$PROJECT_ID" && "$AUTO_FETCH_CONFIG" == "true" ]]; then
    echo "🔍 Fetching configuration from Terraform..."

    if [[ ! -d "$TERRAFORM_DIR" ]]; then
        echo "⚠️  Terraform directory not found at $TERRAFORM_DIR"
        echo "   Use -t to specify the correct path, or provide -b manually"
    else
        CURRENT_DIR=$(pwd)
        cd "$TERRAFORM_DIR"

        if terraform show &> /dev/null; then
            # Bucket name
            if [[ -z "$BUCKET" ]]; then
                BUCKET=$(terraform output -raw frontend_bucket_name 2>/dev/null || true)
                if [[ -n "$BUCKET" && "$BUCKET" != "null" ]]; then
                    echo "   ✅ Bucket: $BUCKET"
                else
                    echo "   ⚠️  Could not fetch bucket name from Terraform"
                    BUCKET=""
                fi
            fi

            # API URL
            if [[ -z "$API_URL" ]]; then
                API_SUBDOMAIN=$(grep 'api_subdomain' terraform.tfvars 2>/dev/null | cut -d'"' -f2 || true)
                if [[ -n "$API_SUBDOMAIN" ]]; then
                    API_URL="https://${API_SUBDOMAIN}"
                    echo "   ✅ API URL: $API_URL"
                fi
            fi
        else
            echo "   ⚠️  No Terraform state found in $TERRAFORM_DIR"
            echo "   Run 'terraform apply' first, or provide -b manually"
        fi

        cd "$CURRENT_DIR"
    fi
fi

# ── Defaults for missing values ───────────────────────────────────────────────
if [[ -z "$API_URL" ]]; then
    API_URL="https://api.gifter.danobhub.com"
    echo "   Using default API URL: $API_URL"
fi

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$BUCKET" ]]; then
    echo "❌ Bucket name is required."
    echo "   Provide -p PROJECT_ID (auto-fetch from Terraform) or -b BUCKET_NAME"
    show_usage
    exit 1
fi

if ! command -v gsutil &> /dev/null; then
    echo "❌ Google Cloud SDK (gsutil) is not installed."
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# ── Build ─────────────────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
    echo ""
    echo "🏗️  Building optimized assets for GCS deployment..."
    echo "   Repo root:  ${REPO_ROOT}"
    echo "   API URL:    ${API_URL}"
    echo "   Bucket:     ${BUCKET}"

    PUBLIC_URL="https://storage.googleapis.com/${BUCKET}"

    cd "$REPO_ROOT"
    docker build -f Dockerfile.cloud \
        --build-arg VITE_BTC_GIFTCARD_API_URL_ENV="${API_URL}" \
        --build-arg PUBLIC_URL="${PUBLIC_URL}" \
        -t "${DOCKER_IMAGE}:cloud" \
        .

    echo "📦 Extracting build artifacts..."
    docker create --name "${CONTAINER_NAME}" "${DOCKER_IMAGE}:cloud"
    docker cp "${CONTAINER_NAME}:/build" "${REPO_ROOT}/build-output"
    docker rm "${CONTAINER_NAME}"
else
    echo "⏭️  Skipping build — using existing build-output/..."
    if [[ ! -d "${REPO_ROOT}/build-output" ]]; then
        echo "❌ build-output/ not found. Run without --skip-build first."
        exit 1
    fi
fi

echo "✅ Build artifacts ready in ${REPO_ROOT}/build-output/"

# ── Deploy to GCS ─────────────────────────────────────────────────────────────
echo ""
echo "☁️  Deploying to Google Cloud Storage bucket: ${BUCKET}..."

# Sync all files (delete removed files from bucket)
gsutil -m rsync -r -d "${REPO_ROOT}/build-output" "gs://${BUCKET}"

# Configure bucket for SPA routing (React Router — 404 → index.html)
echo "🔧 Configuring SPA routing..."
gsutil web set -m index.html -e index.html "gs://${BUCKET}"

# Set cache-control headers
echo "🔧 Setting cache headers..."
# Hashed static assets: cache indefinitely
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
    "gs://${BUCKET}/assets/**" 2>/dev/null || true
# HTML entry points: short cache so users always get latest
gsutil -m setmeta -h "Cache-Control:public, max-age=300, must-revalidate" \
    "gs://${BUCKET}/*.html" 2>/dev/null || true

echo ""
echo "✅ GCS deployment complete!"
echo "📁 Files deployed to: gs://${BUCKET}"
echo "🌐 Bucket URL:        https://storage.googleapis.com/${BUCKET}/index.html"

# ── Cleanup ───────────────────────────────────────────────────────────────────
if [[ "$NO_CLEANUP" == false ]]; then
    echo "🧹 Cleaning up..."
    [[ "$SKIP_BUILD" == false ]] && docker rmi "${DOCKER_IMAGE}:cloud" 2>/dev/null || true
    rm -rf "${REPO_ROOT}/build-output"
else
    echo "⚠️  Skipping cleanup — build-output/ preserved at ${REPO_ROOT}/build-output"
fi

echo "✨ Done!"
