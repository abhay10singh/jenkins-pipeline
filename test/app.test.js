const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const testDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'task-manager-test-')
);

process.env.TASKS_FILE = path.join(testDirectory, 'tasks.json');

const app = require('../src/app');
const { writeTasks } = require('../src/store');

test.beforeEach(() => {
    writeTasks([]);
});

test.after(() => {
    fs.rmSync(testDirectory, { recursive: true, force: true });
    delete process.env.TASKS_FILE;
});

test('health endpoint confirms the API is running', async () => {
    const response = await request(app)
        .get('/api/health')
        .expect(200);

    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.service, 'task-manager-api');
});

test('creates a task and returns HTTP 201', async () => {
    const response = await request(app)
        .post('/api/tasks')
        .send({
            title: 'Learn Jenkins',
            description: 'Build a working Node.js application'
        })
        .expect(201);

    assert.equal(response.body.task.title, 'Learn Jenkins');
    assert.equal(response.body.task.completed, false);
    assert.ok(response.body.task.id);

    const list = await request(app).get('/api/tasks').expect(200);

    assert.equal(list.body.count, 1);
    assert.equal(list.body.tasks[0].title, 'Learn Jenkins');
});

test('rejects a blank task title', async () => {
    const response = await request(app)
        .post('/api/tasks')
        .send({ title: '   ' })
        .expect(400);

    assert.match(response.body.error, /title is required/i);
});

test('updates completion and filters completed tasks', async () => {
    const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Write API tests' })
        .expect(201);

    const id = created.body.task.id;

    await request(app)
        .patch(`/api/tasks/${id}`)
        .send({ completed: true })
        .expect(200);

    const result = await request(app)
        .get('/api/tasks?status=completed')
        .expect(200);

    assert.equal(result.body.count, 1);
    assert.equal(result.body.tasks[0].completed, true);

    const stats = await request(app).get('/api/stats').expect(200);
    assert.deepEqual(stats.body, {
        total: 1,
        active: 0,
        completed: 1
    });
});

test('deletes a task and returns 404 when it no longer exists', async () => {
    const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Delete me' })
        .expect(201);

    const id = created.body.task.id;

    await request(app).delete(`/api/tasks/${id}`).expect(204);
    await request(app).get(`/api/tasks/${id}`).expect(404);

    const list = await request(app).get('/api/tasks').expect(200);
    assert.equal(list.body.count, 0);
});

test('rejects invalid completion values', async () => {
    const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Validate input' })
        .expect(201);

    await request(app)
        .patch(`/api/tasks/${created.body.task.id}`)
        .send({ completed: 'yes' })
        .expect(400);
});
