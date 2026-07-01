# ERP 外勤 App（Android / iOS）

> **用户使用说明（安装、操作、FAQ）：** [docs/FIELD_APP_USER_GUIDE.md](../docs/FIELD_APP_USER_GUIDE.md)  
> **iOS 云部署方案：** [docs/FIELD_APP_IOS_SETUP.md](../docs/FIELD_APP_IOS_SETUP.md)  
> Web ERP 说明：[docs/USER_MANUAL.md](../docs/USER_MANUAL.md)

销售外勤移动端（Android 已发布，iOS 通过 EAS + TestFlight）：**公海领取（含批量）**、**我的线索**、**联系上报（上传录音）**、**我的上报**、**上报审核**（主管）、**消息通知**、**地图导航**、**离线上报暂存**、**版本更新**。

## 真机联调

### 1. 准备

1. 电脑与手机同一 WiFi
2. 查电脑局域网 IP：`ipconfig` → 本机 **192.168.3.4**（以太网）
3. 后端默认 **PORT=3001**，监听全部网卡

### 2. 配置（已写入，改 IP 时同步两处）

**backend/.env**

```env
APP_PUBLIC_URL=http://192.168.3.4:3001
FIELD_ANDROID_VERSION_CODE=4
FIELD_ANDROID_VERSION_NAME=1.1.0
PORT=3001
```

**mobile-field/.env**

```env
EXPO_PUBLIC_API_URL=http://192.168.3.4:3001/api
```

> 修改 `backend/.env` 后需 **重启后端**，版本接口的 `apkUrl` 才会更新。

### 3. 启动

```bash
# 终端 1
npm run start:backend

# 终端 2 — 开发调试（Expo Go 或 dev client）
cd mobile-field && npm run android
```

## 构建 Release APK

```bash
cd mobile-field
npm run build:apk
# 或项目根目录
npm run build:field-apk
```

**Windows 注意：**

1. 项目路径含中文时，脚本会自动复制到 `C:\efbuild` 再构建（Expo prebuild 限制）
2. 首次构建需下载 Gradle（约 100MB），请保持网络畅通
3. 需 **Android SDK**（示例 `D:\SDK`），设置 `ANDROID_HOME`
4. 构建脚本会自动检测 `build-tools` 版本并配置签名

产物：`backend/public/apk/erp-field-latest.apk`

手机浏览器打开 **http://192.168.3.4:3001/apk/erp-field-latest.apk** 下载安装。

### 演示账号

| 项 | 值 |
|----|-----|
| 租户 | `default` |
| 销售 | `sales_clerk` |
| 主管 | `sales_director` |
| 密码 | `backend/.env` → `SEED_DEMO_PASSWORD` |

## 版本更新机制

| 接口 | `GET /api/app/field-android/latest`（无需登录） |
|------|--------------------------------------------------|
| 强制更新 | `FIELD_ANDROID_FORCE_UPDATE=true` 且服务端 `versionCode` > 客户端 |
| 最低版本 | 客户端 < `minVersionCode` 时强制更新 |
| 可选更新 | 有新版本时弹窗「立即更新 / 稍后」 |

**发布新版本流程：**

1. 修改 `mobile-field/app.config.ts` 的 `version` / `android.versionCode`
2. `powershell -File scripts/build-release.ps1 -VersionCode 5 -VersionName 1.1.1`
3. 更新 `backend/.env` 中 `FIELD_ANDROID_VERSION_CODE` / `VERSION_NAME`
4. 重启后端

```bash
npm run docs:verify:field-version   # 冒烟版本接口
```

## API 地址

| 场景 | EXPO_PUBLIC_API_URL |
|------|---------------------|
| Android 模拟器 | `http://10.0.2.2:3001/api` |
| 真机（本机） | `http://192.168.3.4:3001/api` |

## 签名说明

首次 `build:apk` 会在 `mobile-field/android-signing/` 生成 keystore（密码见 `scripts/build-release.ps1`）。  
**请备份 keystore**，后续更新须用同一证书签名。

## 项目结构

```
src/
  api/           # auth, leads, notifications, app version
  screens/       # Login, Pool, Mine, MyReports, Review, Notifications, Report
  hooks/         # useAudioPicker, useVersionCheck, usePermissions, useOfflineSync
  components/    # VersionGate, LeadCard, OfflineBanner
  utils/         # openMapNavigation, offlineReportQueue
```

## 功能与 Web 分工

| 功能 | App | Web |
|------|-----|-----|
| 公海 / 批量领取 | ✅ | ✅ |
| 联系上报 + 上传录音 | ✅ | ✅ |
| 我的上报 / 审核 | ✅ | ✅ |
| 消息通知 | ✅ | ✅ |
| 地图导航 | ✅ | — |
| 离线上报暂存 | ✅ | — |
| 联系统计 / 报价订单 | — | ✅ |

## iOS（EAS + TestFlight）

业务代码与 Android 共用；**无需 Mac** 即可云构建。

```bash
npm install -g eas-cli
cd mobile-field
eas login
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

完整步骤见 **[docs/FIELD_APP_IOS_SETUP.md](../docs/FIELD_APP_IOS_SETUP.md)**。

| 接口 | `GET /api/app/field-ios/latest` |
|------|----------------------------------|
| 安装方式 | TestFlight 链接（`FIELD_IOS_DOWNLOAD_URL`） |
| buildNumber | `app.config.ts` → `ios.buildNumber` 对应 `FIELD_IOS_VERSION_CODE` |
