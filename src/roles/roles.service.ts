import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateRoleDto, RoleResponseDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    await this.ensureUnique(createRoleDto.code, createRoleDto.name);

    const role = this.rolesRepository.create({
      id: randomUUID(),
      ...createRoleDto,
    });

    return this.toResponseDto(await this.rolesRepository.save(role));
  }

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.rolesRepository.find({
      order: { name: 'ASC' },
    });

    return roles.map((role) => this.toResponseDto(role));
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    return this.toResponseDto(await this.getById(id));
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.getById(id);

    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      await this.ensureUnique(updateRoleDto.code, undefined, id);
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      await this.ensureUnique(undefined, updateRoleDto.name, id);
    }

    Object.assign(role, updateRoleDto);
    return this.toResponseDto(await this.rolesRepository.save(role));
  }

  async remove(id: string): Promise<void> {
    const role = await this.getById(id);
    const usersCount = await this.usersRepository.count({
      where: { roleId: role.id },
      withDeleted: true,
    });

    if (usersCount > 0) {
      throw new ConflictException(
        'Role is assigned to users and cannot be deleted',
      );
    }

    await this.rolesRepository.remove(role);
  }

  async exists(id: string): Promise<boolean> {
    return this.rolesRepository.exists({ where: { id } });
  }

  toResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private async getById(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  private async ensureUnique(
    code?: string,
    name?: string,
    ignoreId?: string,
  ): Promise<void> {
    if (code) {
      const existingByCode = await this.rolesRepository.findOne({
        where: { code },
      });
      if (existingByCode && existingByCode.id !== ignoreId) {
        throw new ConflictException('Role code already exists');
      }
    }

    if (name) {
      const existingByName = await this.rolesRepository.findOne({
        where: { name },
      });
      if (existingByName && existingByName.id !== ignoreId) {
        throw new ConflictException('Role name already exists');
      }
    }
  }
}
