import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FieldMobileVersionInfo {
  versionCode: number;
  versionName: string;
  minVersionCode: number;
  forceUpdate: boolean;
  releaseNotes: string;
  /** Install / update URL (APK, TestFlight, App Store) */
  downloadUrl: string;
  /** @deprecated use downloadUrl — kept for Android clients */
  apkUrl?: string;
}

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getFieldAndroidLatest(): FieldMobileVersionInfo {
    return this.getFieldMobileLatest('ANDROID', {
      downloadPathKey: 'FIELD_ANDROID_APK_PATH',
      downloadPathDefault: '/apk/erp-field-latest.apk',
    });
  }

  getFieldIosLatest(): FieldMobileVersionInfo {
    return this.getFieldMobileLatest('IOS', {
      downloadPathKey: 'FIELD_IOS_DOWNLOAD_URL',
      downloadPathDefault: '',
    });
  }

  private getFieldMobileLatest(
    platform: 'ANDROID' | 'IOS',
    opts: { downloadPathKey: string; downloadPathDefault: string },
  ): FieldMobileVersionInfo {
    const prefix = `FIELD_${platform}`;
    const versionCode = this.parseInt(`${prefix}_VERSION_CODE`, 1);
    const minVersionCode = this.parseInt(`${prefix}_MIN_VERSION_CODE`, versionCode);
    const versionName = this.config.get<string>(`${prefix}_VERSION_NAME`, '1.0.0');
    const forceUpdate = this.config.get<string>(`${prefix}_FORCE_UPDATE`, 'false') === 'true';
    const releaseNotes = this.config.get<string>(
      `${prefix}_RELEASE_NOTES`,
      platform === 'IOS' ? 'iOS 外勤版更新' : '修复问题并优化外勤体验',
    );

    const downloadPath = this.config.get<string>(opts.downloadPathKey, opts.downloadPathDefault);
    const publicBase = this.config.get<string>('APP_PUBLIC_URL', 'http://localhost:3000');
    let downloadUrl = downloadPath;
    if (downloadPath && !downloadPath.startsWith('http')) {
      downloadUrl = `${publicBase.replace(/\/$/, '')}${downloadPath}`;
    }

    const info: FieldMobileVersionInfo = {
      versionCode,
      versionName,
      minVersionCode,
      forceUpdate,
      releaseNotes,
      downloadUrl,
    };
    if (platform === 'ANDROID') {
      info.apkUrl = downloadUrl;
    }
    return info;
  }

  private parseInt(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    const n = raw ? parseInt(raw, 10) : fallback;
    return Number.isFinite(n) ? n : fallback;
  }
}
