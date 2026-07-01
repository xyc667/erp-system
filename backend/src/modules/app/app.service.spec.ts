import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

describe('AppService', () => {
  const createService = (env: Record<string, string>) => {
    const config = {
      get: (key: string, fallback?: string) => env[key] ?? fallback,
    } as ConfigService;
    return new AppService(config);
  };

  it('returns Android version info with apk url from APP_PUBLIC_URL', () => {
    const svc = createService({
      FIELD_ANDROID_VERSION_CODE: '2',
      FIELD_ANDROID_VERSION_NAME: '1.0.1',
      FIELD_ANDROID_MIN_VERSION_CODE: '1',
      FIELD_ANDROID_FORCE_UPDATE: 'true',
      APP_PUBLIC_URL: 'http://192.168.1.10:3000',
      FIELD_ANDROID_RELEASE_NOTES: '测试更新',
    });
    const info = svc.getFieldAndroidLatest();
    expect(info.versionCode).toBe(2);
    expect(info.forceUpdate).toBe(true);
    expect(info.downloadUrl).toBe('http://192.168.1.10:3000/apk/erp-field-latest.apk');
    expect(info.apkUrl).toBe(info.downloadUrl);
    expect(info.releaseNotes).toBe('测试更新');
  });

  it('uses absolute apk url when configured', () => {
    const svc = createService({
      FIELD_ANDROID_APK_PATH: 'https://cdn.example.com/erp-field.apk',
    });
    expect(svc.getFieldAndroidLatest().downloadUrl).toBe('https://cdn.example.com/erp-field.apk');
  });

  it('returns iOS version info with TestFlight download url', () => {
    const svc = createService({
      FIELD_IOS_VERSION_CODE: '3',
      FIELD_IOS_VERSION_NAME: '1.1.0',
      FIELD_IOS_DOWNLOAD_URL: 'https://testflight.apple.com/join/AbCdEfGh',
      FIELD_IOS_FORCE_UPDATE: 'false',
    });
    const info = svc.getFieldIosLatest();
    expect(info.versionCode).toBe(3);
    expect(info.downloadUrl).toBe('https://testflight.apple.com/join/AbCdEfGh');
    expect(info.apkUrl).toBeUndefined();
  });
});
