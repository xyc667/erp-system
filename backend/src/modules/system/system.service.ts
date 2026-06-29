import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { CreateDictionaryDto } from './dto/create-dictionary.dto';
import { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  findAllConfigs() {
    return this.prisma.systemConfig.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  createConfig(data: CreateConfigDto) {
    return this.prisma.systemConfig.create({ data });
  }

  updateConfig(id: string, data: UpdateConfigDto) {
    return this.prisma.systemConfig.update({ where: { id }, data });
  }

  removeConfig(id: string) {
    return this.prisma.systemConfig.delete({ where: { id } });
  }

  findAllDictionaries() {
    return this.prisma.dictionary.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { code: 'asc' },
    });
  }

  createDictionary(data: CreateDictionaryDto) {
    return this.prisma.dictionary.create({ data });
  }

  removeDictionary(id: string) {
    return this.prisma.dictionary.delete({ where: { id } });
  }

  addDictionaryItem(dictionaryId: string, data: CreateDictionaryItemDto) {
    return this.prisma.dictionaryItem.create({
      data: { ...data, dictionaryId },
    });
  }

  removeDictionaryItem(id: string) {
    return this.prisma.dictionaryItem.delete({ where: { id } });
  }
}
