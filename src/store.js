const fs = require('node:fs');
const path = require('node:path');

function getFilePath() {
    return process.env.TASKS_FILE ||
        path.join(__dirname, '..', 'data', 'tasks.json');
}

function ensureStorage() {
    const file = getFilePath();

    fs.mkdirSync(path.dirname(file), { recursive: true });

    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '[]\n', 'utf8');
    }
}

function readTasks() {
    ensureStorage();

    const tasks = JSON.parse(
        fs.readFileSync(getFilePath(), 'utf8')
    );

    if (!Array.isArray(tasks)) {
        throw new Error('Task storage must contain a JSON array');
    }

    return tasks;
}

function writeTasks(tasks) {
    if (!Array.isArray(tasks)) {
        throw new TypeError('Tasks must be an array');
    }

    ensureStorage();

    const file = getFilePath();
    const temporaryFile = `${file}.tmp`;

    fs.writeFileSync(
        temporaryFile,
        `${JSON.stringify(tasks, null, 2)}\n`,
        'utf8'
    );

    fs.renameSync(temporaryFile, file);
}

module.exports = { readTasks, writeTasks };
