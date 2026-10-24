const express = require('express');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { readTasks, writeTasks } = require('./store');

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check: useful for Docker, monitoring and deployment.
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'task-manager-api'
    });
});

// Summary counts.
app.get('/api/stats', (_req, res) => {
    const tasks = readTasks();
    const completed = tasks.filter(task => task.completed).length;

    res.json({
        total: tasks.length,
        active: tasks.length - completed,
        completed
    });
});

// List, filter and search tasks.
app.get('/api/tasks', (req, res) => {
    const status = req.query.status || 'all';
    const query = String(req.query.q || '').trim().toLowerCase();

    if (!['all', 'active', 'completed'].includes(status)) {
        return res.status(400).json({
            error: 'Status must be all, active, or completed'
        });
    }

    let tasks = readTasks();

    if (status === 'active') {
        tasks = tasks.filter(task => !task.completed);
    } else if (status === 'completed') {
        tasks = tasks.filter(task => task.completed);
    }

    if (query) {
        tasks = tasks.filter(task =>
            task.title.toLowerCase().includes(query) ||
            task.description.toLowerCase().includes(query)
        );
    }

    tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({ count: tasks.length, tasks });
});

// Get a single task.
app.get('/api/tasks/:id', (req, res) => {
    const task = readTasks().find(item => item.id === req.params.id);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
});

// Create a task.
app.post('/api/tasks', (req, res) => {
    const body = req.body || {};
    const { title, description = '' } = body;

    if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
            error: 'Title is required'
        });
    }

    if (title.trim().length > 120) {
        return res.status(400).json({
            error: 'Title cannot exceed 120 characters'
        });
    }

    if (typeof description !== 'string' || description.length > 500) {
        return res.status(400).json({
            error: 'Description must be text of at most 500 characters'
        });
    }

    const now = new Date().toISOString();

    const task = {
        id: randomUUID(),
        title: title.trim(),
        description: description.trim(),
        completed: false,
        createdAt: now,
        updatedAt: now
    };

    const tasks = readTasks();
    tasks.push(task);
    writeTasks(tasks);

    res.status(201).json({ task });
});

// Update a task.
app.patch('/api/tasks/:id', (req, res) => {
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'A JSON object is required' });
    }

    const keys = Object.keys(body);
    const allowed = ['title', 'description', 'completed'];

    if (keys.length === 0 || keys.some(key => !allowed.includes(key))) {
        return res.status(400).json({
            error: 'Provide valid fields: title, description, or completed'
        });
    }

    if (
        body.title !== undefined &&
        (typeof body.title !== 'string' ||
         !body.title.trim() ||
         body.title.trim().length > 120)
    ) {
        return res.status(400).json({
            error: 'Title must contain 1–120 characters'
        });
    }

    if (
        body.description !== undefined &&
        (typeof body.description !== 'string' ||
         body.description.length > 500)
    ) {
        return res.status(400).json({
            error: 'Description must be text of at most 500 characters'
        });
    }

    if (
        body.completed !== undefined &&
        typeof body.completed !== 'boolean'
    ) {
        return res.status(400).json({
            error: 'Completed must be true or false'
        });
    }

    const tasks = readTasks();
    const index = tasks.findIndex(item => item.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    for (const key of keys) {
        tasks[index][key] =
            typeof body[key] === 'string' ? body[key].trim() : body[key];
    }

    tasks[index].updatedAt = new Date().toISOString();
    writeTasks(tasks);

    res.json({ task: tasks[index] });
});

// Delete a task.
app.delete('/api/tasks/:id', (req, res) => {
    const tasks = readTasks();
    const remaining = tasks.filter(item => item.id !== req.params.id);

    if (remaining.length === tasks.length) {
        return res.status(404).json({ error: 'Task not found' });
    }

    writeTasks(remaining);
    res.status(204).end();
});

// Consistent JSON response for unknown API endpoints.
app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Handle malformed JSON and unexpected errors.
app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON request body' });
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
