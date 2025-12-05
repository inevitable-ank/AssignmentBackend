import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser, createTestTask, prisma } from '../helpers';

// The suite does multiple Prisma operations per test; allow extra time for setup.
jest.setTimeout(30000);

describe('Tasks Module', () => {
  let authToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create first user
    const user1 = await createTestUser({
      username: 'user1',
      email: 'user1@example.com',
      password: 'Password123!',
    });
    userId = user1.id;

    // Wait a bit to ensure user is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify user exists before login
    const verifyUser1 = await prisma.user.findUnique({
      where: { email: 'user1@example.com' },
    });
    if (!verifyUser1) {
      throw new Error('User1 was not created properly');
    }

    const loginResponse1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user1@example.com',
        password: 'Password123!',
      });
    
    if (loginResponse1.status !== 200) {
      // Check if user exists
      const userCheck = await prisma.user.findMany();
      throw new Error(`Login failed: ${JSON.stringify(loginResponse1.body)}. Users in DB: ${userCheck.length}`);
    }
    
    authToken = loginResponse1.body.token;
    if (!authToken) {
      throw new Error('No token received from login');
    }

    // Create second user for isolation tests
    const user2 = await createTestUser({
      username: 'user2',
      email: 'user2@example.com',
      password: 'Password123!',
    });
    otherUserId = user2.id;

    // Wait a bit to ensure user is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));

    const loginResponse2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@example.com',
        password: 'Password123!',
      });
    
    if (loginResponse2.status !== 200) {
      throw new Error(`Login failed for user2: ${JSON.stringify(loginResponse2.body)}`);
    }
    
    otherUserToken = loginResponse2.body.token;
    if (!otherUserToken) {
      throw new Error('No token received from login for user2');
    }
  });

  describe('GET /api/tasks', () => {
    it('should get empty tasks list for new user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body.tasks).toHaveLength(0);
    });

    it('should get all tasks for authenticated user', async () => {
      // Create tasks for user1
      await createTestTask(userId, { title: 'Task 1' });
      await createTestTask(userId, { title: 'Task 2' });

      // Create task for user2 (should not appear)
      await createTestTask(otherUserId, { title: 'Other User Task' });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.tasks[0].title).toBe('Task 2'); // Most recent first
      expect(response.body.tasks[1].title).toBe('Task 1');
      expect(response.body.tasks.every((t: any) => t.title !== 'Other User Task')).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(401);

      expect(response.body.message).toContain('Missing or invalid token');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task',
          description: 'Task description',
          status: 'pending',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Task');
      expect(response.body.description).toBe('Task description');
      expect(response.body.status).toBe('pending');
    });

    it('should create task with default values', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Minimal Task',
        })
        .expect(201);

      expect(response.body.title).toBe('Minimal Task');
      expect(response.body.status).toBe('pending');
      expect(response.body.priority).toBe('medium');
      expect(response.body.recurrence).toBe('none');
    });

    it('should reject task creation without title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Task without title',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject task creation with empty title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject task creation with invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task',
          status: 'invalid-status',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject task creation without token', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'New Task',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await createTestTask(userId, {
        title: 'Original Task',
        description: 'Original description',
        status: 'pending',
      });
      taskId = task.id;
    });

    it('should update task successfully', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task',
          status: 'completed',
        })
        .expect(200);

      expect(response.body.message).toBe('Updated');

      // Verify update
      const getResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedTask = getResponse.body.tasks.find((t: any) => t.id === taskId);
      expect(updatedTask.title).toBe('Updated Task');
      expect(updatedTask.status).toBe('completed');
    });

    it('should update only provided fields', async () => {
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in-progress',
        })
        .expect(200);

      const getResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedTask = getResponse.body.tasks.find((t: any) => t.id === taskId);
      expect(updatedTask.title).toBe('Original Task'); // Unchanged
      expect(updatedTask.status).toBe('in-progress'); // Changed
    });

    it('should reject update of non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task',
        })
        .expect(404);

      expect(response.body.message).toContain('Task not found');
    });

    it('should reject update of other user\'s task', async () => {
      const otherUserTask = await createTestTask(otherUserId, {
        title: 'Other User Task',
      });

      const response = await request(app)
        .put(`/api/tasks/${otherUserTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Hacked Task',
        })
        .expect(404);

      expect(response.body.message).toContain('Task not found');
    });

    it('should reject update without token', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Task',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await createTestTask(userId, {
        title: 'Task to Delete',
      });
      taskId = task.id;
    });

    it('should delete task successfully', async () => {
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      const getResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.tasks.find((t: any) => t.id === taskId)).toBeUndefined();
    });

    it('should reject deletion of non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('Task not found');
    });

    it('should reject deletion of other user\'s task', async () => {
      const otherUserTask = await createTestTask(otherUserId, {
        title: 'Other User Task',
      });

      const response = await request(app)
        .delete(`/api/tasks/${otherUserTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('Task not found');
    });

    it('should reject deletion without token', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task with very long title', async () => {
      const longTitle = 'a'.repeat(100);
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: longTitle,
        })
        .expect(201);

      expect(response.body.title).toBe(longTitle);
    });

    it('should handle task with very long description', async () => {
      const longDescription = 'a'.repeat(500);
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: longDescription,
        })
        .expect(201);

      expect(response.body.description).toBe(longDescription);
    });

    it('should handle task update with all fields', async () => {
      const task = await createTestTask(userId, {
        title: 'Original Task',
        description: 'Original Description',
        status: 'pending',
      });

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task',
          description: 'Updated Description',
          status: 'completed',
        })
        .expect(200);

      expect(response.body.message).toBe('Updated');
    });

    it('should handle task with special characters in title', async () => {
      const specialTitle = 'Task with "quotes" & <tags> & symbols!';
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: specialTitle,
        })
        .expect(201);

      expect(response.body.title).toBe(specialTitle);
    });

    it('should handle multiple rapid task creations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Task ${i + 1}`,
          })
      );

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      const getResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.tasks.length).toBeGreaterThanOrEqual(5);
    });
  });
});

