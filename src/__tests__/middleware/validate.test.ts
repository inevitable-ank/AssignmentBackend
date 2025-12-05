import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../helpers';

// Allow more time for database operations
jest.setTimeout(30000);

describe('Validate Middleware', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('validateBody middleware', () => {
    it('should validate request body against schema', async () => {
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
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });

    it('should reject short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });

    it('should validate task creation schema', async () => {
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
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          status: 'pending',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Task');
    });

    it('should reject task creation without title', async () => {
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
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Task without title',
        })
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });

    it('should reject invalid task status', async () => {
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
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
          status: 'invalid-status',
        })
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });
  });
});


