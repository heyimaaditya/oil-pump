import { Request, Response, NextFunction } from 'express';
import { verifyApiKey } from '../../middleware/auth.middleware';

import { config as appConfig } from '../../config';


jest.mock('../../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnThis(),
}));


describe('Auth Middleware - verifyApiKey', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  // Mock response methods
  let statusFn = jest.fn().mockReturnThis();
  let jsonFn = jest.fn().mockReturnThis();

  const testApiKey = 'test-api-key-123';

 
  const originalApiKey = appConfig.server.apiKey;

  beforeAll(() => {

    appConfig.server.apiKey = testApiKey;
  });

  afterAll(() => {
   
    appConfig.server.apiKey = originalApiKey;
  });

  beforeEach(() => {
  
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      path: '/api/test'
    };
    mockResponse = {
      status: statusFn,
      json: jsonFn,
    };
    nextFunction = jest.fn();
  });

  it('should call next() if a valid API key is provided in x-api-key header', () => {
    mockRequest.headers = { 'x-api-key': testApiKey }; 

    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(statusFn).not.toHaveBeenCalled();
    expect(jsonFn).not.toHaveBeenCalled();
  });

   it('should call next() if a valid API key is provided in X-Api-Key header (case)', () => {
    mockRequest.headers = { 'X-Api-Key': testApiKey }; 

    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(statusFn).not.toHaveBeenCalled();
    expect(jsonFn).not.toHaveBeenCalled();
  });

  it('should return 401 Unauthorized if API key header is missing', () => {
    mockRequest.headers = {};

    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Unauthorized: API Key required' });
  });

   it('should return 401 Unauthorized if API key header is present but empty', () => {
    mockRequest.headers = { 'x-api-key': '' };

    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Unauthorized: API Key required' });
  });

  it('should return 403 Forbidden if API key is invalid', () => {
    mockRequest.headers = { 'x-api-key': 'invalid-key' };

    verifyApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(403);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Forbidden: Invalid API Key' });
  });

});
