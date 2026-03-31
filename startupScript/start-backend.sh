#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export JAVA_HOME="/Users/aswin-20182/.gradle/jdks/eclipse_adoptium-21-aarch64-os_x/jdk-21.0.8+9/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

JAVA="$JAVA_HOME/bin/java"
MVNW="$PROJECT_DIR/mvnw"
JAR="$PROJECT_DIR/target/moneymanager-0.0.1-SNAPSHOT.jar"

echo "=== Money Manager — Backend ==="

# Build only if the jar does not exist yet
if [ ! -f "$JAR" ]; then
  echo "Building backend (first run)..."
  "$MVNW" -f "$PROJECT_DIR/pom.xml" package -DskipTests -q
  echo "Build complete."
fi

echo "Starting backend on http://localhost:8080 ..."
exec "$JAVA" -jar "$JAR"
