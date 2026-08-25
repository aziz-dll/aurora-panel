#!/usr/bin/env bash
# Aurora APK derleme
# Ön koşullar: JDK 21 (~/.jdk/jdk-21) + Android SDK (~/Android/Sdk)
set -e
cd "$(dirname "$0")/.."

export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME="$HOME/jdk/jdk-21.0.12.1+1"

npx cap sync android
cd android
./gradlew assembleDebug

echo
echo "✓ APK hazır: android/app/build/outputs/apk/debug/app-debug.apk"
