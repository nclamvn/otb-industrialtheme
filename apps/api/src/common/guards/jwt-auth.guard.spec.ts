import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = (overrides: any = {}) => ({
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: { authorization: 'Bearer valid-token' },
        ...overrides.request,
      }),
      getResponse: jest.fn().mockReturnValue({}),
    }),
    ...overrides,
  } as unknown as ExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = mockExecutionContext();

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should check public key on both handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = mockExecutionContext();

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
        ]),
      );
    });
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { id: 'user-001', email: 'test@dafc.com', role: 'ADMIN' };

      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        new UnauthorizedException('Invalid or expired token'),
      );
    });

    it('should throw provided error when error exists', () => {
      const error = new Error('Custom error');

      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });

    it('should throw original error over generic message', () => {
      const customError = new UnauthorizedException('Token expired');

      expect(() => guard.handleRequest(customError, { id: 'user-001' }, null)).toThrow(
        customError,
      );
    });
  });
});
