import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor, ApiResponse } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  const mockExecutionContext = () =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext);

  const createCallHandler = (data: any): CallHandler => ({
    handle: () => of(data),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformInterceptor],
    }).compile();

    interceptor = module.get<TransformInterceptor<any>>(TransformInterceptor);
  });

  describe('intercept', () => {
    it('should wrap simple data in success response', (done) => {
      const data = { id: 'user-001', name: 'Test User' };
      const context = mockExecutionContext();
      const callHandler = createCallHandler(data);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: { id: 'user-001', name: 'Test User' },
        });
        done();
      });
    });

    it('should handle paginated response with meta', (done) => {
      const data = {
        data: [{ id: '1' }, { id: '2' }],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      };
      const context = mockExecutionContext();
      const callHandler = createCallHandler(data);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: [{ id: '1' }, { id: '2' }],
          meta: {
            total: 100,
            page: 1,
            limit: 10,
            totalPages: 10,
          },
        });
        done();
      });
    });

    it('should return already formatted ApiResponse as-is', (done) => {
      const data: ApiResponse<any> = {
        success: true,
        data: { id: 'user-001' },
        error: undefined,
      };
      const context = mockExecutionContext();
      const callHandler = createCallHandler(data);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual(data);
        done();
      });
    });

    it('should handle null data', (done) => {
      const context = mockExecutionContext();
      const callHandler = createCallHandler(null);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: null,
        });
        done();
      });
    });

    it('should handle undefined data', (done) => {
      const context = mockExecutionContext();
      const callHandler = createCallHandler(undefined);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        done();
      });
    });

    it('should handle array data', (done) => {
      const data = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const context = mockExecutionContext();
      const callHandler = createCallHandler(data);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        });
        done();
      });
    });

    it('should handle string data', (done) => {
      const context = mockExecutionContext();
      const callHandler = createCallHandler('success message');

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: 'success message',
        });
        done();
      });
    });

    it('should handle number data', (done) => {
      const context = mockExecutionContext();
      const callHandler = createCallHandler(42);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: 42,
        });
        done();
      });
    });

    it('should handle boolean data', (done) => {
      const context = mockExecutionContext();
      const callHandler = createCallHandler(true);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: true,
        });
        done();
      });
    });

    it('should preserve nested objects', (done) => {
      const data = {
        user: {
          id: 'user-001',
          profile: {
            name: 'Test',
            settings: { theme: 'dark' },
          },
        },
      };
      const context = mockExecutionContext();
      const callHandler = createCallHandler(data);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result.data).toEqual(data);
        expect(result.data.user.profile.settings.theme).toBe('dark');
        done();
      });
    });

    it('should handle response with success: false', (done) => {
      const data: ApiResponse<any> = {
        success: false,
        error: 'Something went wrong',
      };
      const context = mockExecutionContext();
      const callHandler = createCallHandler(data);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: false,
          error: 'Something went wrong',
        });
        done();
      });
    });

    it('should handle empty object', (done) => {
      const context = mockExecutionContext();
      const callHandler = createCallHandler({});

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: {},
        });
        done();
      });
    });

    it('should handle empty array', (done) => {
      const context = mockExecutionContext();
      const callHandler = createCallHandler([]);

      interceptor.intercept(context, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: [],
        });
        done();
      });
    });
  });
});
