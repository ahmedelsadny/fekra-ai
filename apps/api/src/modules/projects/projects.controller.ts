import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Priority, TaskStatus } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  budget?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  businessUnitId?: string;
}

export class CreateTaskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: Priority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateTaskStatusDto {
  @IsIn(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED'])
  status: TaskStatus;
}

@ApiTags('Projects & Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  @ApiOperation({ summary: 'List organization projects' })
  async listProjects(@CurrentUser() user: AuthUser) {
    return this.projectsService.listProjects(user.orgId);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Create a new project' })
  async createProject(@CurrentUser() user: AuthUser, @Body() body: CreateProjectDto) {
    return this.projectsService.createProject({
      organizationId: user.orgId,
      userId: user.id,
      ...body,
    });
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks (optional ?projectId=)' })
  async listTasks(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.projectsService.listTasks(user.orgId, projectId);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a task (notifies the assignee in real time)' })
  async createTask(@CurrentUser() user: AuthUser, @Body() body: CreateTaskDto) {
    return this.projectsService.createTask({
      organizationId: user.orgId,
      userId: user.id,
      ...body,
    });
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update a task status' })
  async updateTaskStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') taskId: string,
    @Body() body: UpdateTaskStatusDto,
  ) {
    return this.projectsService.updateTaskStatus({
      organizationId: user.orgId,
      userId: user.id,
      taskId,
      status: body.status,
    });
  }
}
