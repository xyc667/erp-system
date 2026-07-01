# Build Release APK (Windows: copies to ASCII temp path when project path has non-ASCII chars)
param(
  [int]$VersionCode = 1,
  [string]$VersionName = "1.0.0"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$RepoRoot = Split-Path -Parent $Root
$ApkOut = Join-Path $RepoRoot "backend\public\apk\erp-field-latest.apk"
$BuildRoot = $Root

if ($Root -match '[^\x00-\x7F]') {
  $BuildRoot = "C:\efbuild"
  if (Test-Path $BuildRoot) {
    try { Remove-Item $BuildRoot -Recurse -Force -ErrorAction Stop } catch {
      $BuildRoot = "C:\efbuild-$((Get-Date).Ticks)"
    }
  }
  Write-Host "==> Non-ASCII path; staging to $BuildRoot"
  New-Item -ItemType Directory -Force -Path $BuildRoot | Out-Null
  $exclude = @('node_modules', 'android', '.expo', 'android-signing')
  Get-ChildItem $Root -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item $_.FullName -Destination $BuildRoot -Recurse -Force
  }
  if (Test-Path (Join-Path $Root ".env")) {
    Copy-Item (Join-Path $Root ".env") (Join-Path $BuildRoot ".env") -Force
  }
  Set-Location $BuildRoot
  Write-Host "==> npm install in staging dir..."
  npm install
  if (-not (Test-Path (Join-Path $BuildRoot "node_modules"))) {
    Write-Error "npm install failed — node_modules missing"
  }
}

$KeystoreDir = Join-Path $BuildRoot "android-signing"
$KeystoreFile = Join-Path $KeystoreDir "erp-field-release.keystore"

# Reuse keystore from repo if temp build is fresh
$RepoKeystore = Join-Path $Root "android-signing\erp-field-release.keystore"
if (-not (Test-Path $KeystoreFile) -and (Test-Path $RepoKeystore)) {
  New-Item -ItemType Directory -Force -Path $KeystoreDir | Out-Null
  Copy-Item $RepoKeystore $KeystoreFile -Force
}

Write-Host "==> ERP Field Release v$VersionName (code $VersionCode)"

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Write-Error "JDK 17+ required."
}

New-Item -ItemType Directory -Force -Path $KeystoreDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $ApkOut) | Out-Null

if (-not (Test-Path $KeystoreFile)) {
  Write-Host "==> Creating keystore..."
  keytool -genkeypair -v -storetype PKCS12 -keystore $KeystoreFile `
    -alias erp-field -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass erpfield123 -keypass erpfield123 `
    -dname "CN=ERP Field, OU=IT, O=ERP, L=Shenyang, ST=LN, C=CN"
  if ($BuildRoot -ne $Root) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Root "android-signing") | Out-Null
    Copy-Item $KeystoreFile $RepoKeystore -Force
  }
}

Set-Location $BuildRoot
Write-Host "==> expo prebuild"
npx expo prebuild --platform android

$AndroidDir = Join-Path $BuildRoot "android"
$AppGradle = Join-Path $AndroidDir "app\build.gradle"
$PropsDest = Join-Path $AndroidDir "keystore.properties"
$KeystoreInApp = Join-Path $AndroidDir "app\erp-field-release.keystore"
Copy-Item $KeystoreFile $KeystoreInApp -Force

@"
storePassword=erpfield123
keyPassword=erpfield123
keyAlias=erp-field
storeFile=erp-field-release.keystore
"@ | Set-Content -Path $PropsDest -Encoding ASCII

if (Test-Path $AppGradle) {
  $g = Get-Content $AppGradle -Raw
  if ($g -notmatch 'keystorePropertiesFile') {
    $inject = @"
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

"@
    $g = $inject + $g
  }
  if ($g -notmatch 'release\s*\{[^}]*storeFile') {
    $releaseBlock = @'
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file("${rootProject.projectDir}/app/${keystoreProperties['storeFile']}")
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
'@
    $g = [regex]::Replace($g, '(signingConfigs\s*\{)', "`${1}$releaseBlock", 1)
  }
  $g = $g -replace 'versionCode\s+\d+', "versionCode $VersionCode"
  $g = $g -replace 'versionName\s+"[^"]*"', "versionName `"$VersionName`""
  if ($g -match 'buildTypes[\s\S]*release[\s\S]*signingConfig signingConfigs\.debug') {
    $g = [regex]::Replace(
      $g,
      '(buildTypes\s*\{[\s\S]*?^\s*release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug',
      '${1}signingConfig signingConfigs.release',
      1
    )
  }
  Set-Content $AppGradle $g -NoNewline
}

Write-Host "==> gradlew assembleRelease (first run downloads Gradle ~150MB)"
Set-Location $AndroidDir
$env:GRADLE_USER_HOME = "C:\gradle-home"
New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null

# Android SDK (install Android Studio, or set ANDROID_HOME)
$SdkDir = $env:ANDROID_HOME
if (-not $SdkDir -and (Test-Path "D:\SDK\platform-tools")) { $SdkDir = "D:\SDK" }
if (-not $SdkDir -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) {
  $SdkDir = "$env:LOCALAPPDATA\Android\Sdk"
}
if ($SdkDir) {
  $sdkEscaped = ($SdkDir -replace '\\', '/')
  "sdk.dir=$sdkEscaped" | Set-Content (Join-Path $AndroidDir "local.properties") -Encoding ASCII
  Write-Host "    SDK: $SdkDir"
  $btDir = Join-Path $SdkDir "build-tools"
  if (Test-Path $btDir) {
    $bt = Get-ChildItem $btDir -Directory | Where-Object {
      Test-Path (Join-Path $_.FullName "aapt.exe")
    } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
    if ($bt) {
      $GradleProps = Join-Path $AndroidDir "gradle.properties"
      $gp = if (Test-Path $GradleProps) { Get-Content $GradleProps -Raw } else { "" }
      if ($gp -notmatch 'android\.buildToolsVersion=') {
        $gp += "`nandroid.buildToolsVersion=$($bt.Name)`n"
        Set-Content $GradleProps $gp -NoNewline
        Write-Host "    build-tools: $($bt.Name)"
      }
    }
  }
} else {
  Write-Warning "ANDROID_HOME not set and no SDK at %LOCALAPPDATA%\Android\Sdk — install Android Studio first."
}
$WrapperProps = Join-Path $AndroidDir "gradle\wrapper\gradle-wrapper.properties"
if (Test-Path $WrapperProps) {
  $wp = @"
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-9.3.1-bin.zip
networkTimeout=300000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
"@
  Set-Content $WrapperProps $wp -NoNewline
}
$env:ANDROID_HOME = $SdkDir
.\gradlew.bat clean assembleRelease --no-daemon

$BuiltApk = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $BuiltApk)) { Write-Error "APK not found: $BuiltApk" }

Copy-Item $BuiltApk $ApkOut -Force
$sizeMb = [math]::Round((Get-Item $ApkOut).Length / 1MB, 1)
Write-Host ""
Write-Host "SUCCESS: $ApkOut ($sizeMb MB)"
Write-Host "Phone download: http://YOUR_LAN_IP:3001/apk/erp-field-latest.apk"
