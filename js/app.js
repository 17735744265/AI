/**
 * TaskFlow - 主应用逻辑
 */

// 工具函数
const Utils = {
    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return '今天';
        } else if (days === 1) {
            return '昨天';
        } else if (days === -1) {
            return '明天';
        } else if (days < 7 && days > 0) {
            return `${days}天前`;
        } else if (days > -7 && days < 0) {
            return `${Math.abs(days)}天后`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },

    /**
     * 格式化日期时间
     */
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * 检查是否逾期
     */
    isOverdue(dateString) {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    },

    /**
     * 获取优先级标签
     */
    getPriorityLabel(priority) {
        const labels = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return labels[priority] || '中';
    },

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 转义HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 任务管理器
const TaskManager = {
    /**
     * 创建任务HTML
     */
    createTaskElement(task, categories) {
        const category = categories.find(c => c.id === task.categoryId);
        const isOverdue = !task.completed && task.dueDate && Utils.isOverdue(task.dueDate);

        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'} new`;
        taskEl.dataset.taskId = task.id;

        taskEl.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle"></div>
            <div class="task-content">
                <div class="task-title">${Utils.escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${Utils.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${category ? `<span class="task-tag" style="background: ${category.color}20; color: ${category.color}">${Utils.escapeHtml(category.name)}</span>` : ''}
                    ${(task.tags && task.tags.length > 0) ? task.tags.map(tag =>
                        `<span class="task-tag tag-default">${Utils.escapeHtml(tag)}</span>`
                    ).join('') : ''}
                    ${task.dueDate ? `
                        <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                            📅 ${Utils.formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon" data-action="edit" title="编辑">✏️</button>
                <button class="btn-icon delete" data-action="delete" title="删除">🗑️</button>
            </div>
        `;

        // 移除动画类
        setTimeout(() => {
            taskEl.classList.remove('new');
        }, 400);

        return taskEl;
    },

    /**
     * 渲染任务列表
     */
    renderTasks(container, tasks, categories) {
        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无任务</div>
                </div>
            `;
            return;
        }

        tasks.forEach((task, index) => {
            const taskEl = this.createTaskElement(task, categories);
            taskEl.style.animationDelay = `${index * 0.05}s`;
            container.appendChild(taskEl);
        });
    },

    /**
     * 过滤任务
     */
    filterTasks(tasks, filters) {
        return tasks.filter(task => {
            // 状态过滤
            if (filters.status) {
                if (filters.status === 'pending' && task.completed) return false;
                if (filters.status === 'completed' && !task.completed) return false;
                if (filters.status === 'overdue') {
                    if (task.completed || !task.dueDate) return false;
                    if (!Utils.isOverdue(task.dueDate)) return false;
                }
            }

            // 分类过滤
            if (filters.categoryId && task.categoryId !== filters.categoryId) {
                return false;
            }

            // 优先级过滤
            if (filters.priority && task.priority !== filters.priority) {
                return false;
            }

            // 搜索过滤
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(searchLower);
                const descMatch = task.description && task.description.toLowerCase().includes(searchLower);
                const tagsMatch = task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchLower));
                if (!titleMatch && !descMatch && !tagsMatch) {
                    return false;
                }
            }

            return true;
        });
    },

    /**
     * 排序任务
     */
    sortTasks(tasks, sortBy = 'dueDate', sortOrder = 'asc') {
        return [...tasks].sort((a, b) => {
            // 未完成的排在前面
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            let comparison = 0;

            switch (sortBy) {
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) comparison = 0;
                    else if (!a.dueDate) comparison = 1;
                    else if (!b.dueDate) comparison = -1;
                    else comparison = new Date(a.dueDate) - new Date(b.dueDate);
                    break;
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    comparison = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
                    break;
                case 'createdAt':
                    comparison = b.createdAt - a.createdAt;
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }
};

// 分类管理器
const CategoryManager = {
    /**
     * 创建分类HTML
     */
    createCategoryElement(category, taskCount) {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category-item fade-in';
        categoryEl.dataset.categoryId = category.id;

        categoryEl.innerHTML = `
            <div class="category-info">
                <div class="category-color" style="background: ${category.color}"></div>
                <span class="category-name">${Utils.escapeHtml(category.name)}</span>
                <span class="category-count">${taskCount} 个任务</span>
            </div>
            <div class="task-actions">
                <button class="btn-icon" data-action="edit" title="编辑">✏️</button>
                <button class="btn-icon delete" data-action="delete" title="删除">🗑️</button>
            </div>
        `;

        return categoryEl;
    },

    /**
     * 渲染分类列表
     */
    renderCategories(container, categories, tasks) {
        container.innerHTML = '';

        categories.forEach(category => {
            const taskCount = tasks.filter(t => t.categoryId === category.id).length;
            const categoryEl = this.createCategoryElement(category, taskCount);
            container.appendChild(categoryEl);
        });
    }
};

// 模态框管理器
const ModalManager = {
    currentModal: null,

    /**
     * 打开模态框
     */
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.currentModal = modal;
        }
    },

    /**
     * 关闭模态框
     */
    close() {
        if (this.currentModal) {
            this.currentModal.classList.remove('active');
            this.currentModal = null;
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(callback) {
        this.open('delete-modal');
        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');

        const handleConfirm = () => {
            this.close();
            callback();
            cleanup();
        };

        const handleCancel = () => {
            this.close();
            cleanup();
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }
};

// 通知管理器
const NotificationManager = {
    /**
     * 显示通知
     */
    show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fade-in`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 2000;
            animation: slideInLeft 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'taskDelete 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// 点击外部关闭模态框
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        ModalManager.close();
    }
});

// ESC 键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ModalManager.currentModal) {
        ModalManager.close();
    }
});