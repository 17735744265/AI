/**
 * TaskFlow - 任务列表页面逻辑
 */

let currentFilters = {
    status: 'all',
    categoryId: '',
    priority: '',
    search: ''
};

document.addEventListener('DOMContentLoaded', () => {
    initTasksPage();
});

/**
 * 初始化任务列表页面
 */
function initTasksPage() {
    renderTasks();
    initFilters();
    initCategoryFilter();
}

/**
 * 渲染任务列表
 */
function renderTasks() {
    const container = document.getElementById('task-list');
    if (!container) return;

    const tasks = StorageManager.getTasks();
    const categories = StorageManager.getCategories();

    // 过滤和排序
    let filteredTasks = TaskManager.filterTasks(tasks, currentFilters);
    filteredTasks = TaskManager.sortTasks(filteredTasks, 'dueDate', 'asc');

    TaskManager.renderTasks(container, filteredTasks, categories);

    // 添加事件监听
    addTaskEventListeners(container);
}

/**
 * 初始化过滤器
 */
function initFilters() {
    // 状态过滤
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilters.status = btn.dataset.filter;
            renderTasks();
        });
    });

    // 分类过滤
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.categoryId = e.target.value;
            renderTasks();
        });
    }

    // 优先级过滤
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) {
        priorityFilter.addEventListener('change', (e) => {
            currentFilters.priority = e.target.value;
            renderTasks();
        });
    }

    // 搜索
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
            currentFilters.search = e.target.value;
            renderTasks();
        }, 300));
    }
}

/**
 * 初始化分类过滤器选项
 */
function initCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    const categories = StorageManager.getCategories();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
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
            window.location.href = `new-task.html?edit=${taskId}`;
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
        // 重新渲染以应用排序
        renderTasks();
    }, 400);

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
        renderTasks();
        NotificationManager.show('任务已删除', 'success');
    }, 300);
}