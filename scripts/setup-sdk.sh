#!/usr/bin/env bash
# Android SDK minimal kurulum (cmdline-tools üzerinden)
# Hedef: $HOME/.android/Sdk
set -e

SDK_DIR="$HOME/.android/Sdk"
CMDLINE_VER="11076708"  # commandlinetools-linux-11076708_latest.zip
URL="https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_VER}_latest.zip"

echo "▸ Hedef: $SDK_DIR"

# Eski kurulumu temizle (sadece bu dizini)
if [ -d "$SDK_DIR" ]; then
  echo "  Mevcut kurulum temizleniyor..."
  rm -rf "$SDK_DIR"
fi

mkdir -p "$SDK_DIR/cmdline-tools"

# cmdline-tools indir
echo "▸ cmdline-tools indiriliyor..."
cd "$SDK_DIR/cmdline-tools"
if command -v curl >/dev/null 2>&1; then
  curl -L -o tools.zip "$URL"
elif command -v wget >/dev/null 2>&1; then
  wget -O tools.zip "$URL"
else
  echo "✗ curl veya wget gerekli" >&2
  exit 1
fi

# Aç ve 'cmdline-tools' adını 'latest' yap (sdkmanager beklentisi)
unzip -q tools.zip
rm tools.zip
rm -rf latest
mv cmdline-tools latest
cd "$SDK_DIR/cmdline-tools/latest"

# JAVA_HOME gerekli
if [ -z "${JAVA_HOME:-}" ]; then
  if [ -d "/usr/lib/jvm/java-17-openjdk" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk"
  elif [ -d "/usr/lib/jvm/java-21-openjdk" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
  elif command -v java >/dev/null 2>&1; then
    export JAVA_HOME="$(dirname "$(dirname "$(command -v java)")")"
  else
    echo "✗ Java bulunamadı. JAVA_HOME ayarla veya java'yı PATH'e ekle." >&2
    exit 1
  fi
fi
echo "▸ JAVA_HOME=$JAVA_HOME"

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$JAVA_HOME/bin:$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$PATH"

# Lisansları kabul et
echo "▸ Lisanslar kabul ediliyor..."
yes | sdkmanager --licenses >/dev/null 2>&1 || true

# Platform 36 + build-tools 36 (Aurora projesi compileSdk 36 kullanıyor)
echo "▸ Platform 36 ve build-tools 36.0.0 kuruluyor..."
sdkmanager --install "platforms;android-36" "build-tools;36.0.0" "platform-tools" 2>&1 | tail -10

echo
echo "✓ Android SDK hazır: $SDK_DIR"
echo "  Ortam değişkenlerini ayarla:"
echo "    export ANDROID_HOME=$SDK_DIR"
echo "    export ANDROID_SDK_ROOT=$SDK_DIR"
echo "    export PATH=\$JAVA_HOME/bin:$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:\$PATH"