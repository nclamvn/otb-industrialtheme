import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user and return token', async () => {
      const loginDto = { email: 'admin@dafc.com', password: 'password123' };
      const validatedUser = {
        id: 'user-001',
        email: 'admin@dafc.com',
        name: 'Admin User',
        role: 'ADMIN',
      };
      const loginResult = {
        user: validatedUser,
        accessToken: 'jwt-token-here',
      };

      mockAuthService.validateUser.mockResolvedValue(validatedUser);
      mockAuthService.login.mockResolvedValue(loginResult);

      const result = await controller.login(loginDto);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(validatedUser);
      expect(result).toEqual(loginResult);
    });

    it('should propagate authentication errors', async () => {
      const loginDto = { email: 'admin@dafc.com', password: 'wrongpassword' };
      mockAuthService.validateUser.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
      const currentUser = { id: 'user-001', email: 'admin@dafc.com', role: 'ADMIN' };
      const userProfile = {
        id: 'user-001',
        email: 'admin@dafc.com',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        avatar: null,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        assignedBrands: [],
      };

      mockAuthService.getProfile.mockResolvedValue(userProfile);

      const result = await controller.getProfile(currentUser as any);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith('user-001');
      expect(result).toEqual(userProfile);
    });
  });

  describe('getMe', () => {
    it('should return current user from token payload', async () => {
      const currentUser = {
        id: 'user-001',
        email: 'admin@dafc.com',
        name: 'Admin User',
        role: 'ADMIN',
      };

      const result = await controller.getMe(currentUser as any);

      expect(result).toEqual(currentUser);
    });

    it('should return user with all token fields', async () => {
      const currentUser = {
        id: 'user-finance-001',
        email: 'finance@dafc.com',
        name: 'Finance Head',
        role: 'FINANCE_HEAD',
      };

      const result = await controller.getMe(currentUser as any);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('role');
    });
  });
});
