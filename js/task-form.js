/**
 * TaskFlow - 任务表单页面逻辑
 */

let currentTaskId = null;
let taskTags = [];

document.addEventListener('DOMContentLoaded', () => {
    initTaskForm();
});

/**
 * 初始化任务表单
 */
function initTaskForm() {
    const form = document.getElementById('task-form');
    if (!form) return;

    // 检查是否为编辑模式
    const urlParams = new URLSearchParams(window.location.search);
    currentTaskId = urlParams.get('edit');

    if (currentTaskId) {
        loadTaskForEdit();
    }

    // 加载分类选项
    loadCategoryOptions();

    // 初始化标签输入
    initTagInput();

    // 表单提交
    form.addEventListener('submit', handleFormSubmit);

    // 重置按钮
    const resetBtn = document.getElementById('reset-form');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }

    // 颜色选择器预览
    const colorInput = document.getElementById('category-color');
    const colorPreview = document.getElementById('color-preview');
    if (colorInput && colorPreview) {
        colorInput.addEventListener('input', (e) => {
            colorPreview.textContent = e.target.value;
        });
    }
}

/**
 * 加载任务进行编辑
 */
function loadTaskForEdit() {
    const task = StorageManager.getTaskById(currentTaskId);
    if (!task) {
        NotificationManager.show('任务不存在', 'error');
        setTimeout(() => {
            window.location.href = 'tasks.html';
        }, 1500);
        return;
    }

    // 更新页面标题
    const pageTitle = document.getElementById('page-title');
    const submitBtn = document.getElementById('submit-btn');
    if (pageTitle) pageTitle.textContent = '编辑任务';
    if (submitBtn) submitBtn.textContent = '保存更改';

    // 填充表单
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-category').value = task.categoryId || '';
    document.getElementById('task-priority').value = task.priority || 'medium';

    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        document.getElementById('task-due-date').value = dueDate.toISOString().split('T')[0];
        document.getElementById('task-due-time').value = dueDate.toTimeString().slice(0, 5);
    }

    // 加载标签
    if (task.tags && task.tags.length > 0) {
        taskTags = [...task.tags];
        renderTags();
    }
}

/**
 * 加载分类选项
 */
function loadCategoryOptions() {
    const categorySelect = document.getElementById('task-category');
    if (!categorySelect) return;

    const categories = StorageManager.getCategories();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

/**
 * 初始化标签输入
 */
function initTagInput() {
    const tagInput = document.getElementById('tag-input');
    if (!tagInput) return;

    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput.value.trim());
            tagInput.value = '';
        }
    });
}

/**
 * 添加标签
 */
function addTag(tag) {
    if (!tag || taskTags.includes(tag)) return;
    taskTags.push(tag);
    renderTags();
}

/**
 * 移除标签
 */
function removeTag(tag) {
    taskTags = taskTags.filter(t => t !== tag);
    renderTags();
}

/**
 * 渲染标签
 */
function renderTags() {
    const container = document.getElementById('tags-container');
    if (!container) return;

    container.innerHTML = taskTags.map(tag => `
        <div class="tag-item">
            <span>${Utils.escapeHtml(tag)}</span>
            <span class="remove-tag" data-tag="${Utils.escapeHtml(tag)}">×</span>
        </div>
    `).join('');

    // 添加移除事件
    container.querySelectorAll('.remove-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            removeTag(btn.dataset.tag);
        });
    });
}

/**
 * 处理表单提交
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const categoryId = document.getElementById('task-category').value;
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;
    const dueTime = document.getElementById('task-due-time').value;

    // 验证
    if (!title) {
        NotificationManager.show('请输入任务标题', 'error');
        return;
    }

    // 构建任务对象
    const taskData = {
        title,
        description,
        categoryId,
        priority,
        tags: taskTags,
        dueDate: dueDate ? new Date(`${dueDate}T${dueTime || '23:59'}`).toISOString() : null
    };

    if (currentTaskId) {
        // 更新任务
        StorageManager.updateTask(currentTaskId, taskData);
        NotificationManager.show('任务已更新', 'success');
    } else {
        // 创建任务
        StorageManager.addTask(taskData);
        NotificationManager.show('任务创建成功', 'success');
    }

    // 跳转到任务列表
    setTimeout(() => {
        window.location.href = 'tasks.html';
    }, 1000);
}

/**
 * 重置表单
 */
function resetForm() {
    const form = document.getElementById('task-form');
    form.reset();
    taskTags = [];
    renderTags();
    document.getElementById('task-priority').value = 'medium';
}