import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('should wrap successful response with success format', (done) => {
    const mockData = { id: 1, name: 'test' };
    const mockExecutionContext = {} as ExecutionContext;
    const mockCallHandler = {
      handle: () => of(mockData),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: mockData,
        message: 'OK',
        code: 'OK',
      });
      done();
    });
  });

  it('should wrap null data as null', (done) => {
    const mockExecutionContext = {} as ExecutionContext;
    const mockCallHandler = {
      handle: () => of(null),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
        message: 'OK',
        code: 'OK',
      });
      done();
    });
  });

  it('should wrap undefined data as null', (done) => {
    const mockExecutionContext = {} as ExecutionContext;
    const mockCallHandler = {
      handle: () => of(undefined),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
        message: 'OK',
        code: 'OK',
      });
      done();
    });
  });
});
