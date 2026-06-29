import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('api/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('user:view', 'user:manage')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('user:view', 'user:manage')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @RequirePermissions('user:create', 'user:manage')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @RequirePermissions('user:update', 'user:manage')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('user:delete', 'user:manage')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}