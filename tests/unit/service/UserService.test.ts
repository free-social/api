import { UserService } from "../../../src/service/UserService";
import User from "../../../src/models/User";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

// 1. MOCKING
jest.mock("../../../src/models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

// 2. TYPE CASTING
const mockedUser = User as jest.Mocked<typeof User>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const mockUserData = {
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    };

    it("should throw error if user is not found", async () => {
      // Arrange: Simulate database returning null (user not found)
      mockedUser.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        UserService.login("nonexistent@test.com", "password123"),
      ).rejects.toThrow("Email or password is incorrect");
    });

    it("should throw an error if email already exists", async () => {
      // FIX: Cast the return object "as any" to bypass the strict Mongoose type check
      mockedUser.findOne.mockResolvedValue({
        email: "test@example.com",
      } as any);

      await expect(UserService.register(mockUserData)).rejects.toThrow(
        "Email already exists",
      );
    });

    it("should hash password and save user if email is unique", async () => {
      // FIX: Return null
      mockedUser.findOne.mockResolvedValue(null);

      mockedBcrypt.genSalt.mockImplementation(
        () => Promise.resolve("fake-salt") as any,
      );
      mockedBcrypt.hash.mockImplementation(
        () => Promise.resolve("hashed-password") as any,
      );

      const saveMock = jest.fn().mockResolvedValue({
        ...mockUserData,
        password: "hashed-password",
      });

      // FIX: Mock the Mongoose Constructor
      (User as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await UserService.register(mockUserData);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        "password123",
        "fake-salt",
      );
      expect(saveMock).toHaveBeenCalled();
      expect(result.password).toBe("hashed-password");
    });
  });

  describe("login", () => {
    const loginData = { email: "test@example.com", password: "password123" };

    it("should return a token and user data on valid login", async () => {
      // FIX: Create a mock user object that satisfies the parts of the Document we actually USE
      const mockUserDoc = {
        _id: "123",
        email: loginData.email,
        password: "hashed-password",
        // We must mock .toObject() because your service calls it
        toObject: jest.fn().mockReturnValue({
          email: loginData.email,
          _id: "123",
        }),
      };

      // FIX: Cast "as any" so TS doesn't complain about missing properties ($assertPopulated, etc.)
      mockedUser.findOne.mockResolvedValue(mockUserDoc as any);

      mockedBcrypt.compare.mockImplementation(
        () => Promise.resolve(true) as any,
      );
      mockedJwt.sign.mockImplementation(() => "fake-jwt-token");

      const result = await UserService.login(
        loginData.email,
        loginData.password,
      );

      expect(result.token).toBe("fake-jwt-token");
      expect(result.user.email).toBe(loginData.email);
      expect(mockedJwt.sign).toHaveBeenCalled();
    });

    it("should throw error if password is incorrect", async () => {
      mockedUser.findOne.mockResolvedValue({ password: "hashed" } as any);
      mockedBcrypt.compare.mockImplementation(
        () => Promise.resolve(false) as any,
      );

      await expect(
        UserService.login(loginData.email, "wrong-pass"),
      ).rejects.toThrow("Email or password is incorrect");
    });
  });
});
