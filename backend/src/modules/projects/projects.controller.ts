import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('api/projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('project:manage', 'report:center')
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('project:manage', 'report:center')
  findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  @RequirePermissions('project:manage')
  create(@Body() dto: CreateProjectDto, @Request() req: { user: { userId: string } }) {
    return this.projectsService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @RequirePermissions('project:manage')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Post(':id/activate')
  @RequirePermissions('project:manage')
  activate(@Param('id') id: string) {
    return this.projectsService.activate(id);
  }

  @Post(':id/complete')
  @RequirePermissions('project:manage')
  complete(@Param('id') id: string) {
    return this.projectsService.complete(id);
  }

  @Delete(':id')
  @RequirePermissions('project:manage')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
