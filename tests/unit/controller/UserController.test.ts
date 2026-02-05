import { UserController } from '../../../src/controller/UserController';
import { UserService } from '../../../src/service/UserService';
import { Request, Response } from 'express';
// Import the schema so we can mock it
import { UserZodSchema } from '../../../src/models/User';

// 1. Mock the Service
jest.mock('../../../src/service/UserService');

// 2. Mock the Model/Zod Schema
// We verify that safeParse is mocked to allow ANY data through
jest.mock('../../../src/models/User', () => ({
  UserZodSchema: {
    safeParse: jest.fn()
  }
}));

const mockRequest = (body = {}) => ({ body } as Request);
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 201 and user data on success', async () => {
      // Arrange
      const req = mockRequest({ 
        email: 'test@example.com', 
        username: 'testuser', 
        password: 'password123' 
      });
      const res = mockResponse();

      // MOCK ZOD: Force validation to PASS
      (UserZodSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: req.body 
      });
      
      // MOCK SERVICE: Return the exact structure your controller expects
      const mockUser = { 
        _id: '123', 
        username: 'testuser', 
        email: 'test@example.com' 
      };
      (UserService.register as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await UserController.register(req, res);

      // Assert
      expect(UserService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User created successfully",
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('should return 400 if Zod validation fails', async () => {
        // Arrange
        const req = mockRequest({}); // Empty body
        const res = mockResponse();
  
        // MOCK ZOD: Force validation to FAIL
        (UserZodSchema.safeParse as jest.Mock).mockReturnValue({
          success: false,
          error: { issues: [{ message: "Required field missing" }] }
        });
  
        // Act
        await UserController.register(req, res);
  
        // Assert
        expect(UserService.register).not.toHaveBeenCalled(); // Service should NOT be called
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Required field missing" });
    });

    it('should return 400 if service throws error', async () => {
      // Arrange
      const req = mockRequest({ email: 'test@example.com', password: '123' });
      const res = mockResponse();
      
      // MOCK ZOD: Pass
      (UserZodSchema.safeParse as jest.Mock).mockReturnValue({ success: true });

      // MOCK SERVICE: Fail
      (UserService.register as jest.Mock).mockRejectedValue(new Error('Email already exists'));

      // Act
      await UserController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already exists' });
    });
  });

  describe('login', () => {
    it('should return 200, token, and user data on success', async () => {
      // Arrange
      const req = mockRequest({ email: 'test@example.com', password: '123' });
      const res = mockResponse();
      
      // MOCK SERVICE
      // Careful: structure must match what UserService returns: { user: {...}, token }
      const mockServiceResponse = {
        user: { 
            _id: '123', 
            username: 'testuser', 
            email: 'test@example.com' 
        },
        token: 'fake-jwt-token'
      };
      
      (UserService.login as jest.Mock).mockResolvedValue(mockServiceResponse);

      // Act
      await UserController.login(req, res);

      // Assert
      expect(UserService.login).toHaveBeenCalledWith('test@example.com', '123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User logged in successfully",
        user:{
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
        },
        token: 'fake-jwt-token'
      });
    });

    it('should return 400 if login fails', async () => {
      const req = mockRequest({ email: 'test@example.com', password: 'wrong' });
      const res = mockResponse();
      
      (UserService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await UserController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });
});