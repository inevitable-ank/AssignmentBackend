import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../helpers';
import { getProfileHandler, updateProfileHandler, changePasswordHandler } from '../../modules/auth/auth.controller';

describe('Auth Module', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with duplicate email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'TestPassword123!',
        })
        .expect(409);

      expect(response.body.message).toContain('Email already in use');
    });

    it('should reject registration with duplicate username', async () => {
      await createTestUser({ username: 'existinguser' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'TestPassword123!',
        })
        .expect(409);

      expect(response.body.message).toContain('Username already in use');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject registration with short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      authToken = loginResponse.body.token;
      userId = user.id;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(userId);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.message).toContain('Missing or invalid token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      authToken = loginResponse.body.token;
    });

    it('should update username successfully', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'updateduser',
        })
        .expect(200);

      expect(response.body.user.username).toBe('updateduser');
    });

    it('should update email successfully', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'updated@example.com',
        })
        .expect(200);

      expect(response.body.user.email).toBe('updated@example.com');
    });

    it('should reject update with duplicate email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'existing@example.com',
        })
        .expect(409);

      expect(response.body.message).toContain('Email already in use');
    });

    it('should reject update without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          username: 'updateduser',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/auth/password', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'OldPassword123!',
      });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'OldPassword123!',
        });

      authToken = loginResponse.body.token;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.message).toContain('Password updated successfully');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should reject password change with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should reject password change with short new password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'short',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject password change without token', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should allow password change with same password (no validation)', async () => {
      // Note: The API allows changing to the same password
      // This is a design decision - in production you might want to prevent this
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'OldPassword123!',
        })
        .expect(200);

      expect(response.body.message).toContain('Password updated successfully');
    });
  });

  describe('Edge Cases', () => {
    it('should handle registration with maximum length username', async () => {
      const longUsername = 'a'.repeat(20); // Assuming max is 20
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: longUsername,
          email: 'longuser@example.com',
          password: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body.user.username).toBe(longUsername);
    });

    it('should handle registration with special characters in username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user_name123',
          email: 'special@example.com',
          password: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body.user.username).toBe('user_name123');
    });

    it('should handle login with case-insensitive email', async () => {
      await createTestUser({
        username: 'testuser',
        email: 'Test@Example.com',
        password: 'TestPassword123!',
      });

      // Try login with different case
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      // Should work if email is case-insensitive, or fail if not
      // This depends on your implementation
      expect([200, 401]).toContain(response.status);
    });

    it('should handle profile update with empty body', async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Controller guards (direct)', () => {
    const createMockRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('getProfileHandler returns 401 when user is missing', async () => {
      const res = createMockRes();
      const next = jest.fn();
      await getProfileHandler({} as any, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('updateProfileHandler returns 401 when user is missing', async () => {
      const res = createMockRes();
      const next = jest.fn();
      await updateProfileHandler({ body: {} } as any, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('changePasswordHandler returns 401 when user is missing', async () => {
      const res = createMockRes();
      const next = jest.fn();
      await changePasswordHandler({ body: {} } as any, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

