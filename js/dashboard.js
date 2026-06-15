/**
 * TaskFlow - 仪表盘页面逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化仪表盘
    initDashboard();

    // 搜索功能
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
            const query = e.target.value.toLowerCase();
            filterDashboardTasks(query);
        }, 300));
    }
});

/**
 * 初始化仪表盘
 */
function initDashboard() {
    updateStats();
    renderActiveTasks();
    renderUpcomingTasks();
}

/**
 * 更新统计数据
 */
function updateStats() {
    const stats = StorageManager.getStats();

    const totalEl = document.getElementById('total-tasks');
    const completedEl = document.getElementById('completed-tasks');
    const pendingEl = document.getElementById('pending-tasks');
    const overdueEl = document.getElementById('overdue-tasks');

    if (totalEl) animateNumber(totalEl, stats.total);
    if (completedEl) animateNumber(completedEl, stats.completed);
    if (pendingEl) animateNumber(pendingEl, stats.pending);
    if (overdueEl) animateNumber(overdueEl, stats.overdue);
}

/**
 * 数字动画
 */
function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    const diff = target - current;
    const step = Math.ceil(Math.abs(diff) / 10);
    const direction = diff > 0 ? 1 : -1;

    if (diff === 0) return;

    let count = current;
    const timer = setInterval(() => {
        count += step * direction;
        if ((direction > 0 && count >= target) || (direction < 0 && count <= target)) {
            count = target;
            clearInterval(timer);
        }
        element.textContent = count;
        element.classList.add('number-pop');
        setTimeout(() => element.classList.remove('number-pop'), 300);
    }, 50);
}

/**
 * 渲染进行中的任务
 */
function renderActiveTasks() {
    const container = document.getElementById('active-tasks');
    if (!container) return;

    const tasks = StorageManager.getTasks();
    const categories = StorageManager.getCategories();

    // 过滤未完成任务，按截止日期排序，最多显示5个
    const activeTasks = TaskManager.sortTasks(
        tasks.filter(t => !t.completed),
        'dueDate',
        'asc'
    ).slice(0, 5);

    TaskManager.renderTasks(container, activeTasks, categories);

    // 添加事件监听
    addTaskEventListeners(container);
}

/**
 * 渲染即将到期的任务
 */
function renderUpcomingTasks() {
    const container = document.getElementById('upcoming-tasks');
    if (!container) return;

    const tasks = StorageManager.getTasks();
    const categories = StorageManager.getCategories();
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 过滤未来7天内到期的未完成任务
    const upcomingTasks = tasks.filter(task => {
        if (task.completed || !task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= weekLater;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

    TaskManager.renderTasks(container, upcomingTasks, categories);

    // 添加事件监听
    addTaskEventListeners(container);
}

/**
 * 过滤仪表盘任务
 */
function filterDashboardTasks(query) {
    const containers = [
        document.getElementById('active-tasks'),
        document.getElementById('upcoming-tasks')
    ];

    containers.forEach(container => {
        if (!container) return;

        const taskItems = container.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const title = item.querySelector('.task-title').textContent.toLowerCase();
            const description = item.querySelector('.task-description')?.textContent.toLowerCase() || '';

            if (title.includes(query) || description.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

/**
 * 添加任务事件监听
 */
function addTaskEventListeners(container) {
    container.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = taskItem.dataset.taskId;
        const action = e.target.dataset.action;

        if (action === 'toggle') {
            toggleTask(taskId, taskItem);
        } else if (action === 'edit') {
            window.location.href = `pages/new-task.html?edit=${taskId}`;
        } else if (action === 'delete') {
            ModalManager.confirmDelete(() => {
                deleteTask(taskId, taskItem);
            });
        }
    });
}

/**
 * 切换任务完成状态
 */
function toggleTask(taskId, taskItem) {
    const task = StorageManager.getTaskById(taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    StorageManager.updateTask(taskId, { completed: newCompleted });

    // 更新UI
    taskItem.classList.toggle('completed', newCompleted);
    taskItem.classList.add('just-completed');
    taskItem.querySelector('.task-checkbox').classList.toggle('checked', newCompleted);

    setTimeout(() => {
        taskItem.classList.remove('just-completed');
    }, 400);

    // 更新统计
    updateStats();

    // 如果完成了，重新渲染列表
    if (newCompleted) {
        setTimeout(() => {
            renderActiveTasks();
            renderUpcomingTasks();
        }, 500);
    }

    NotificationManager.show(
        newCompleted ? '任务已完成！' : '任务已恢复',
        'success'
    );
}

/**
 * 删除任务
 */
function deleteTask(taskId, taskItem) {
    taskItem.classList.add('deleting');

    setTimeout(() => {
        StorageManager.deleteTask(taskId);
        taskItem.remove();

        // 更新统计和列表
        updateStats();
        renderActiveTasks();
        renderUpcomingTasks();

        NotificationManager.show('任务已删除', 'success');
    }, 300);
}