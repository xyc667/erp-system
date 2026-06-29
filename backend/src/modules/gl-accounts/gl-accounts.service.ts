import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGlAccountDto } from './dto/create-gl-account.dto';
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';

@Injectable()
export class GlAccountsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.glAccount.findMany({ orderBy: { code: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.glAccount.findUnique({ where: { id } });
  }

  create(data: CreateGlAccountDto) {
    return this.prisma.glAccount.create({ data });
  }

  update(id: string, data: UpdateGlAccountDto) {
    return this.prisma.glAccount.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.glAccount.delete({ where: { id } });
  }
}
