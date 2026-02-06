import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockUsers } from '../../../test/utils/fixtures';
import { createMockPrismaService, createMockJwtService } from '../../../test/utils/test-utils';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let jwtService: ReturnType<typeof createMockJwtService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    jwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const mockUser = { ...mockUsers.admin };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin@dafc.com', 'password123');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@dafc.com' },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          status: true,
        }),
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@dafc.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUsers.inactiveUser);

      await expect(
        service.validateUser('inactive@dafc.com', 'password123'),
      ).rejects.toThrow(new UnauthorizedException('Account is not active'));
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUsers.admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('admin@dafc.com', 'wrongpassword'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should update lastLoginAt on successful validation', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUsers.admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prismaService.user.update.mockResolvedValue(mockUsers.admin);

      await service.validateUser('admin@dafc.com', 'password123');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUsers.admin.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });
  });

  describe('login', () => {
    it('should return user data and access token', async () => {
      const user = {
        id: 'user-001',
        email: 'test@dafc.com',
        name: 'Test User',
        role: 'ADMIN',
      };

      jwtService.sign.mockReturnValue('generated-jwt-token');

      const result = await service.login(user);

      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken: 'generated-jwt-token',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    });

    it('should generate token with correct payload structure', async () => {
      const user = {
        id: 'user-finance-001',
        email: 'finance@dafc.com',
        name: 'Finance Head',
        role: 'FINANCE_HEAD',
      };

      await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user.id,
          email: user.email,
          role: user.role,
        }),
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile for valid user', async () => {
      const mockProfile = {
        ...mockUsers.admin,
        assignedBrands: [{ id: 'brand-001', name: 'Nike', code: 'NK' }],
      };
      prismaService.user.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-admin-001');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-admin-001' },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
          assignedBrands: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockProfile);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should include assigned brands in profile', async () => {
      const mockProfile = {
        ...mockUsers.brandManager,
        assignedBrands: [
          { id: 'brand-001', name: 'Nike', code: 'NK' },
          { id: 'brand-002', name: 'Adidas', code: 'AD' },
        ],
      };
      prismaService.user.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-brand-001');

      expect(result.assignedBrands).toHaveLength(2);
      expect(result.assignedBrands[0]).toMatchObject({ name: 'Nike' });
    });
  });
});
