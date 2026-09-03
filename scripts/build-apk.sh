#!/usr/bin/env bash
# Aurora APK derleme
# Ön koşullar:
#   - JDK 17 veya üzeri (JAVA_HOME ayarlı olmalı ya da java PATH'te olmalı)
#   - Android SDK (ANDROID_HOME ayarlı olmalı; varsayılan: ~/Android/Sdk)
set -e
cd "$(dirname "$0")/.."

# Android SDK: ANDROID_HOME açık değilse varsayılanı dene
# (Tilde içeriyorsa açıkça çöz — bash env değişkenlerinde tilde expansion yapmaz)
ANDROID_HOME="${ANDROID_HOME:-\~}"
ANDROID_HOME="${ANDROID_HOME/#\~/$HOME}"
if [ ! -d "$ANDROID_HOME" ]; then
  # Bilinen konumları dene (sırayla)
  if [ -d "$HOME/Android/Sdk" ]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  elif [ -d "$HOME/.android/Sdk" ]; then
    export ANDROID_HOME="$HOME/.android/Sdk"
  elif [ -d "$HOME/Desktop/dashboard/android/sdk" ]; then
    export ANDROID_HOME="$HOME/Desktop/dashboard/android/sdk"
  elif [ -d "/opt/android-sdk" ]; then
    export ANDROID_HOME="/opt/android-sdk"
  elif [ -d "/usr/lib/android-sdk" ]; then
    export ANDROID_HOME="/usr/lib/android-sdk"
  # İçinde platform-tools + build-tools olan dizinleri tara
  elif found=$(find "$HOME" -maxdepth 5 -type d \( -name "platform-tools" -o -name "build-tools" \) 2>/dev/null | head -1); then
    [ -n "$found" ] && export ANDROID_HOME="$(dirname "$(dirname "$found")")"
  else
    echo "✗ Android SDK bulunamadı." >&2
    echo "" >&2
    echo "  Denenen konumlar:" >&2
    for p in "$HOME/Android/Sdk" "$HOME/.android/Sdk" "$HOME/Desktop/dashboard/android/sdk" /opt/android-sdk /usr/lib/android-sdk; do
      [ -d "$p" ] && echo "    ✓ $p" >&2 || echo "    ✗ $p" >&2
    done >&2
    echo "" >&2
    echo "  SDK'yı nereye kurduğunu hatırlamıyorsan şu komutu çalıştır:" >&2
    echo "    find / -maxdepth 5 -name 'platform-tools' -type d 2>/dev/null" >&2
    echo "    (Android SDK genellikle platform-tools + build-tools + platform dizinlerini içerir)" >&2
    echo "" >&2
    echo "  Bulduğun yolu ANDROID_HOME'a ver:" >&2
    echo "    export ANDROID_HOME=/bulduğun/yol" >&2
    exit 1
  fi
fi

# JAVA_HOME: tilde expansion yap (boşsa ya da sadece ~ ise otomatik ara)
case "${JAVA_HOME:-}" in
  "" | "~" | "\~")
    JAVA_HOME=""
    ;;
  *)
    JAVA_HOME="${JAVA_HOME/#\~/$HOME}"
    ;;
esac

# JAVA_HOME verilmiş ama geçersizse erken çık
if [ -n "$JAVA_HOME" ] && [ ! -d "$JAVA_HOME" ]; then
  echo "✗ JAVA_HOME geçersiz: $JAVA_HOME (dizin yok)" >&2
  echo "  Sistemdeki JDK dizinleri:" >&2
  ls -d /usr/lib/jvm/*/ 2>/dev/null | sed 's/^/    /' >&2
  [ -d "$HOME/jdk/jdk-21.0.12.1+1" ] && echo "    - $HOME/jdk/jdk-21.0.12.1+1/" >&2
  echo "  Geçerli yolu export JAVA_HOME=<path> ile ayarla." >&2
  exit 1
fi

# JAVA_HOME boşsa otomatik bul
if [ -z "$JAVA_HOME" ]; then
  if [ -d "$HOME/jdk/jdk-21.0.12.1+1" ]; then
    export JAVA_HOME="$HOME/jdk/jdk-21.0.12.1+1"
  elif [ -d "/usr/lib/jvm/java-21-openjdk" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
  elif command -v java >/dev/null 2>&1; then
    java_path="$(command -v java)"
    export JAVA_HOME="$(dirname "$(dirname "$java_path")")"
  else
    echo "✗ Java bulunamadı. JAVA_HOME ayarla veya java'yı PATH'e ekle." >&2
    echo "  Örn: export JAVA_HOME=/usr/lib/jvm/java-21-openjdk" >&2
    exit 1
  fi
fi

echo "▸ ANDROID_HOME=$ANDROID_HOME"
echo "▸ JAVA_HOME=$JAVA_HOME"

# cap sync Java 21'yi yeniden set eder; JDK 17 ile derlemek için override et
sed -i 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' \
  android/app/capacitor.build.gradle \
  android/capacitor-cordova-android-plugins/capacitor.build.gradle 2>/dev/null || true

# app modülünde VERSION_17 yoksa ekle
if ! grep -q "VERSION_17" android/app/build.gradle; then
  sed -i "/^android {/a\\    compileOptions { sourceCompatibility JavaVersion.VERSION_17\\n        targetCompatibility JavaVersion.VERSION_17\\n    }" android/app/build.gradle
fi

npx cap sync android
cd android
./gradlew assembleDebug

cd ..
APK_SRC="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_SRC" ]; then
  cp -f "$APK_SRC" Aurora.apk
  echo "✓ APK dashboard köküne kopyalandı: Aurora.apk"
fi

echo
echo "✓ APK hazır:"
echo "    - $APK_SRC"
echo "    - Aurora.apk  (proje kökü)"