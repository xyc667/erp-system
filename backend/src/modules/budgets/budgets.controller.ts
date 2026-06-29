import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('api/finance/budgets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get()
  @RequirePermissions('finance:budget')
  findAll() {
    return this.budgetsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('finance:budget')
  findById(@Param('id') id: string) {
    return this.budgetsService.findById(id);
  }

  @Post()
  @RequirePermissions('finance:budget')
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('finance:budget')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('finance:budget')
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(id);
  }
}
