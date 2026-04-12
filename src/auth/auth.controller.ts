import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user and return an access token' })
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: 'jwt-token',
        user: {
          id: 'uuid',
          username: 'admin',
          role: { id: 'uuid', code: 'admin', name: 'Administrator' },
        },
      },
    },
  })
  @ApiBearerAuth()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
