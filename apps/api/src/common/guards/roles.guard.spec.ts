import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = (user: any = null) =>
    ({
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(null);
      const context = mockExecutionContext({ id: 'user-001', role: 'ADMIN' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when roles array is empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = mockExecutionContext({ id: 'user-001', role: 'ADMIN' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'FINANCE_HEAD']);
      const context = mockExecutionContext({ id: 'user-001', role: 'ADMIN' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER']);
      const context = mockExecutionContext({ id: 'user-001', role: 'BRAND_MANAGER' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = mockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'FINANCE_HEAD']);
      const context = mockExecutionContext({ id: 'user-001', role: 'BRAND_PLANNER' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should include required roles in error message', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'FINANCE_HEAD']);
      const context = mockExecutionContext({ id: 'user-001', role: 'BRAND_PLANNER' });

      try {
        guard.canActivate(context);
        fail('Expected ForbiddenException');
      } catch (error) {
        expect((error as ForbiddenException).message).toContain('ADMIN');
        expect((error as ForbiddenException).message).toContain('FINANCE_HEAD');
      }
    });

    it('should check roles from metadata using ROLES_KEY', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = mockExecutionContext({ id: 'user-001', role: 'ADMIN' });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
    });
  });

  describe('role hierarchy scenarios', () => {
    it('should allow ADMIN access to ADMIN-only routes', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = mockExecutionContext({ id: 'user-001', role: 'ADMIN' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow FINANCE_HEAD access to finance routes', () => {
      reflector.getAllAndOverride.mockReturnValue(['FINANCE_HEAD', 'ADMIN']);
      const context = mockExecutionContext({ id: 'user-001', role: 'FINANCE_HEAD' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny BRAND_PLANNER access to ADMIN-only routes', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = mockExecutionContext({ id: 'user-001', role: 'BRAND_PLANNER' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow BOD_MEMBER to approve budgets', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER']);
      const context = mockExecutionContext({ id: 'user-001', role: 'BOD_MEMBER' });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
