import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { buildPaginatedResponse } from '../common/dto/paginated-response.dto';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    await this.ensureUniqueUsername(createUserDto.username);
    await this.ensureRoleExists(createUserDto.roleId);

    const user = this.usersRepository.create({
      id: randomUUID(),
      username: createUserDto.username,
      passwordHash: await bcrypt.hash(createUserDto.password, 10),
      roleId: createUserDto.roleId,
      isActive: createUserDto.isActive ?? true,
    });

    return this.toResponseDto(await this.usersRepository.save(user));
  }

  async findAll(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deletedAt IS NULL');

    if (query.search) {
      queryBuilder.andWhere('LOWER(user.username) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId: query.roleId });
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);
    const [users, total] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      users.map((user) => this.toResponseDto(user)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return this.toResponseDto(await this.getById(id));
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.getById(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      await this.ensureUniqueUsername(updateUserDto.username, id);
    }

    if (updateUserDto.roleId && updateUserDto.roleId !== user.roleId) {
      await this.ensureRoleExists(updateUserDto.roleId);
      user.roleId = updateUserDto.roleId;
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    user.username = updateUserDto.username ?? user.username;
    user.isActive = updateUserDto.isActive ?? user.isActive;

    return this.toResponseDto(await this.usersRepository.save(user));
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.getById(id);
    user.isActive = false;
    return this.toResponseDto(await this.usersRepository.save(user));
  }

  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.getById(id);
    user.isActive = true;
    return this.toResponseDto(await this.usersRepository.save(user));
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.getById(id);
    await this.usersRepository.softRemove(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      relations: { role: true },
      withDeleted: true,
    });
  }

  async findEntityById(id: string): Promise<User> {
    return this.getById(id);
  }

  toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      role: user.role ? this.rolesService.toResponseDto(user.role) : null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  private async getById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureUniqueUsername(
    username: string,
    ignoreId?: string,
  ): Promise<void> {
    const existing = await this.usersRepository.findOne({
      where: { username },
      withDeleted: true,
    });

    if (existing && existing.id !== ignoreId) {
      throw new ConflictException('Username already exists');
    }
  }

  private async ensureRoleExists(roleId: string): Promise<void> {
    const roleExists = await this.rolesService.exists(roleId);
    if (!roleExists) {
      throw new NotFoundException('Role not found');
    }
  }
}
