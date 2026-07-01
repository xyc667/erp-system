import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** 外勤 Android 客户端版本检查（无需登录） */
  @Get('field-android/latest')
  getFieldAndroidLatest() {
    return this.appService.getFieldAndroidLatest();
  }

  /** 外勤 iOS 客户端版本检查（无需登录） */
  @Get('field-ios/latest')
  getFieldIosLatest() {
    return this.appService.getFieldIosLatest();
  }
}
