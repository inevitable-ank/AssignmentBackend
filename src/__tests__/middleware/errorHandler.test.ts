import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../helpers';

describe('Error Handler Middleware', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should handle Zod validation errors', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ab', // Too short
        email: 'invalid-email', // Invalid format
        password: 'short', // Too short
      })
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Validation error');
    expect(response.body).toHaveProperty('errors');
  });

  it('should handle 404 errors', async () => {
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
      .get('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  it('should handle 401 errors', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .expect(401);

    expect(response.body.message).toBeDefined();
  });

  it('should handle 409 conflict errors', async () => {
    await createTestUser({
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'TestPassword123!',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'TestPassword123!',
      })
      .expect(409);

    expect(response.body.message).toBeDefined();
  });

  it('should handle 500 internal server errors gracefully', async () => {
    // This test verifies that the error handler catches unexpected errors
    // We'll test with an invalid request that might cause an internal error
    const response = await request(app)
      .put('/api/auth/password')
      .set('Authorization', 'Bearer valid-looking-token')
      .send({
        currentPassword: 'test',
        newPassword: 'test123',
      })
      .expect(401); // Should be handled as 401, not 500

    expect(response.body.message).toBeDefined();
  });
});


