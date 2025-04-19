import { Request, Response, NextFunction } from 'express';
import { verifyApiKey } from '../../middleware/auth.middleware';
import { config } from '../../config'; 

// Mock config for testing
jest.mock('../../config', () => ({
  config: {
    server: {
      apiKey: 'test-api-key' 
    }
  }
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  let statusFn = jest.fn().mockReturnThis(); 
  let jsonFn = jest.fn().mockReturnThis();

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: statusFn,
      json: jsonFn
    };
    nextFunction = jest.fn(); 
    statusFn.mockClear();
    jsonFn.mockClear();
  });

  it('should call next() if valid API key is provided', () => {
    mockRequest.headers = { 'x-api-key': 'test-api-key' };
    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(statusFn).not.toHaveBeenCalled();
    expect(jsonFn).not.toHaveBeenCalled();
  });

  it('should return 401 if API key is missing', () => {
    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Unauthorized: API Key required' });
  });

  it('should return 403 if API key is invalid', () => {
    mockRequest.headers = { 'x-api-key': 'invalid-key' };
    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(403);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Forbidden: Invalid API Key' });
  });
});