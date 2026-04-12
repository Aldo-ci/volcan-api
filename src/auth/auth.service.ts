import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid || !user.role || !user.roleId) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AuthenticatedUser = {
      sub: user.id,
      username: user.username,
      roleId: user.roleId,
      roleCode: user.role.code,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.usersService.toResponseDto(user),
    };
  }

  buildUserContext(user: User): AuthenticatedUser {
    if (!user.role || !user.roleId) {
      throw new UnauthorizedException('User role is not configured');
    }

    return {
      sub: user.id,
      username: user.username,
      roleId: user.roleId,
      roleCode: user.role.code,
    };
  }
}
