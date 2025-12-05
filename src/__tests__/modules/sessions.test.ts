import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../helpers';
import { getSessionsHandler, revokeSessionHandler, revokeAllOtherSessionsHandler } from '../../modules/sessions/sessions.controller';

// Allow more time for setup since each test logs in and hits the DB.
jest.setTimeout(30000);

describe('Sessions Module', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();

    const user = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
    });
    userId = user.id;

    // Wait to ensure user is committed
    await new Promise(resolve => setTimeout(resolve, 100));

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
    }

    authToken = loginResponse.body.token;
    if (!authToken) {
      throw new Error('No token received from login');
    }
  });

  describe('GET /api/sessions', () => {
    it('should get all user sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThan(0);
      
      // Check session structure
      const session = response.body.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('device');
      expect(session).toHaveProperty('lastActive');
      expect(session).toHaveProperty('createdAt');
    });

    it('should mark current session', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const currentSession = response.body.sessions.find((s: any) => s.current === true);
      expect(currentSession).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(401);

      expect(response.body.message).toContain('Missing or invalid token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('DELETE /api/sessions/:sessionId', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create additional sessions by logging in multiple times
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      // Get sessions to find a session ID
      const sessionsResponse = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const sessions = sessionsResponse.body.sessions;
      expect(sessions.length).toBeGreaterThan(0);
      
      // Use a non-current session if available, otherwise use any session
      const nonCurrentSession = sessions.find((s: any) => !s.current);
      sessionId = nonCurrentSession ? nonCurrentSession.id : sessions[0].id;
      expect(sessionId).toBeDefined();
    });

    it('should revoke a session successfully', async () => {
      const response = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('revoked successfully');
    });

    it('should reject revocation of non-existent session', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/sessions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('Session not found');
    });

    it('should reject revocation without token', async () => {
      const response = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/sessions/revoke-all', () => {
    beforeEach(async () => {
      // Create multiple sessions by logging in multiple times
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });
    });

    it('should revoke all other sessions', async () => {
      const response = await request(app)
        .post('/api/sessions/revoke-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('revoked successfully');
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should keep current session active', async () => {
      await request(app)
        .post('/api/sessions/revoke-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Current session should still work
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.user.id).toBe(userId);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/sessions/revoke-all')
        .expect(401);

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

    it('getSessionsHandler returns 401 when user is missing', async () => {
      const res = createMockRes();
      const next = jest.fn();
      await getSessionsHandler({ headers: {} } as any, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('revokeSessionHandler returns 401 when user is missing', async () => {
      const res = createMockRes();
      const next = jest.fn();
      await revokeSessionHandler({ params: { sessionId: 'abc' } } as any, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('revokeAllOtherSessionsHandler returns 401 when token header missing', async () => {
      const res = createMockRes();
      const next = jest.fn();
      await revokeAllOtherSessionsHandler({ headers: {}, user: { userId: 'u1' } } as any, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

