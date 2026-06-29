import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TraceController } from './trace.controller';
import { TraceService } from './trace.service';

@Module({
  imports: [AuthModule],
  controllers: [TraceController],
  providers: [TraceService],
  exports: [TraceService],
})
export class TraceModule {}
