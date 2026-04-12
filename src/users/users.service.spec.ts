import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from '../roles/roles.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: RolesService,
          useValue: {
            exists: jest.fn().mockResolvedValue(true),
            toResponseDto: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('rejects duplicated usernames', async () => {
    usersRepository.findOne.mockResolvedValueOnce({ id: 'existing-user' });

    await expect(
      service.create({
        username: 'admin',
        password: 'secret123',
        roleId: 'd1494e1c-80d7-4dad-83c3-11a4f717fdbb',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
