import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };
  });

  it('should catch HttpException and format response', () => {
    const exception = new BadRequestException({
      message: 'Invalid input',
      code: 'INVALID_INPUT',
    });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Invalid input',
      code: 'INVALID_INPUT',
    });
  });

  it('should handle HttpException without code field', () => {
    const exception = new BadRequestException('Invalid input');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Invalid input',
      code: 'HTTP_ERROR',
    });
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('plain error', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'plain error',
      code: 'HTTP_ERROR',
    });
  });

  it('should catch non-HttpException and return 500', () => {
    const exception = new Error('Unexpected error');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: '服务器内部错误',
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('should handle array of messages', () => {
    const exception = new BadRequestException({
      message: ['Error 1', 'Error 2'],
      code: 'VALIDATION_ERROR',
    });

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Error 1; Error 2',
      code: 'VALIDATION_ERROR',
    });
  });
});
