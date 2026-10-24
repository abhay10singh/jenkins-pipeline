const $ = id => document.getElementById(id);

const form = $('task-form');
const titleInput = $('title');
const descriptionInput = $('description');
const statusFilter = $('status-filter');
const searchInput = $('search-input');
const taskList = $('task-list');
const apiStatus = $('api-status');
const submitButton = form.querySelector('button');

let toastTimer;

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });

    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
    }

    return data;
}

function toast(message) {
    const element = $('toast');
    element.textContent = message;
    element.classList.add('visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        element.classList.remove('visible');
    }, 2600);
}

function updateStats(stats) {
    $('total-count').textContent = stats.total;
    $('active-count').textContent = stats.active;
    $('completed-count').textContent = stats.completed;
}

function renderTasks(tasks) {
    taskList.replaceChildren();
    $('task-count').textContent =
        `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;

    if (tasks.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = searchInput.value.trim()
            ? 'No tasks match your search. Try a different keyword.'
            : 'Nothing here yet. Add a task to get started.';
        taskList.append(empty);
        return;
    }

    for (const task of tasks) {
        const item = document.createElement('li');
        item.className = `task-card${task.completed ? ' is-complete' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-check';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', `Complete ${task.title}`);

        checkbox.addEventListener('change', async () => {
            try {
                await api(`/api/tasks/${task.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ completed: checkbox.checked })
                });

                toast(checkbox.checked ? 'Task completed.' : 'Task reopened.');
                await loadTasks();
            } catch (error) {
                toast(error.message);
                await loadTasks();
            }
        });

        const body = document.createElement('div');
        body.className = 'task-body';

        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        body.append(title);

        if (task.description) {
            const description = document.createElement('p');
            description.className = 'task-description';
            description.textContent = task.description;
            body.append(description);
        }

        const date = document.createElement('div');
        date.className = 'task-meta';
        date.textContent = `Created ${new Date(task.createdAt).toLocaleDateString()}`;
        body.append(date);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.setAttribute('aria-label', `Delete ${task.title}`);

        deleteButton.addEventListener('click', async () => {
            if (!confirm(`Delete "${task.title}"?`)) return;

            try {
                await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
                toast('Task deleted.');
                await loadTasks();
            } catch (error) {
                toast(error.message);
            }
        });

        item.append(checkbox, body, deleteButton);
        taskList.append(item);
    }
}

async function loadTasks() {
    try {
        const query = new URLSearchParams({
            status: statusFilter.value,
            q: searchInput.value.trim()
        });

        const [health, stats, result] = await Promise.all([
            api('/api/health'),
            api('/api/stats'),
            api(`/api/tasks?${query}`)
        ]);

        apiStatus.textContent =
            health.status === 'ok' ? '● API connected' : 'API unavailable';
        apiStatus.classList.toggle('online', health.status === 'ok');

        updateStats(stats);
        renderTasks(result.tasks);
    } catch (error) {
        apiStatus.textContent = '● API unavailable';
        apiStatus.classList.remove('online');
        $('task-count').textContent = 'Could not load tasks';
        toast(error.message);
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    submitButton.disabled = true;

    try {
        await api('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title: titleInput.value,
                description: descriptionInput.value
            })
        });

        form.reset();
        titleInput.focus();
        toast('Task created.');
        await loadTasks();
    } catch (error) {
        toast(error.message);
    } finally {
        submitButton.disabled = false;
    }
});

statusFilter.addEventListener('change', loadTasks);

let searchTimer;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadTasks, 200);
});

loadTasks();
