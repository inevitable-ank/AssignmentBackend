import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../helpers';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

describe('Auth Middleware', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('requireAuth middleware', () => {
    it('should allow access with valid token', async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
    });

    it('should reject request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.message).toContain('Missing or invalid token');
    });

    it('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.message).toContain('Missing or invalid token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should reject request with expired token', async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });

      // Create expired token
      const expiredToken = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should reject request with token signed with wrong secret', async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });

      // Create token with wrong secret
      const wrongToken = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        'wrong-secret',
        { expiresIn: '1d' }
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should protect all task routes', async () => {
      // Test GET /api/tasks
      await request(app)
        .get('/api/tasks')
        .expect(401);

      // Test POST /api/tasks
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' })
        .expect(401);

      // Test PUT /api/tasks/:id
      await request(app)
        .put('/api/tasks/123')
        .send({ title: 'Updated Task' })
        .expect(401);

      // Test DELETE /api/tasks/:id
      await request(app)
        .delete('/api/tasks/123')
        .expect(401);
    });
  });
});


