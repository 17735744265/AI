/**
 * TaskFlow - 本地存储管理
 * 使用 localStorage 存储任务和分类数据
 */

const StorageManager = {
    // 存储键名
    KEYS: {
        TASKS: 'taskflow_tasks',
        CATEGORIES: 'taskflow_categories'
    },

    // 默认分类
    DEFAULT_CATEGORIES: [
        { id: 'cat_1', name: '工作', color: '#6366f1', createdAt: Date.now() },
        { id: 'cat_2', name: '个人', color: '#10b981', createdAt: Date.now() },
        { id: 'cat_3', name: '学习', color: '#f59e0b', createdAt: Date.now() },
        { id: 'cat_4', name: '其他', color: '#6b6b6b', createdAt: Date.now() }
    ],

    /**
     * 初始化存储
     */
    init() {
        // 如果没有分类数据，初始化默认分类
        if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
            this.saveCategories(this.DEFAULT_CATEGORIES);
        }
        // 如果没有任务数据，初始化空数组
        if (!localStorage.getItem(this.KEYS.TASKS)) {
            this.saveTasks([]);
        }
    },

    /**
     * 获取所有任务
     */
    getTasks() {
        const tasks = localStorage.getItem(this.KEYS.TASKS);
        return tasks ? JSON.parse(tasks) : [];
    },

    /**
     * 保存所有任务
     */
    saveTasks(tasks) {
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
    },

    /**
     * 添加任务
     */
    addTask(task) {
        const tasks = this.getTasks();
        const newTask = {
            id: 'task_' + Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            completed: false,
            ...task
        };
        tasks.push(newTask);
        this.saveTasks(tasks);
        return newTask;
    },

    /**
     * 更新任务
     */
    updateTask(taskId, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                ...updates,
                updatedAt: Date.now()
            };
            this.saveTasks(tasks);
            return tasks[index];
        }
        return null;
    },

    /**
     * 删除任务
     */
    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(filteredTasks);
        return filteredTasks;
    },

    /**
     * 根据 ID 获取任务
     */
    getTaskById(taskId) {
        const tasks = this.getTasks();
        return tasks.find(t => t.id === taskId) || null;
    },

    /**
     * 获取所有分类
     */
    getCategories() {
        const categories = localStorage.getItem(this.KEYS.CATEGORIES);
        return categories ? JSON.parse(categories) : this.DEFAULT_CATEGORIES;
    },

    /**
     * 保存所有分类
     */
    saveCategories(categories) {
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
    },

    /**
     * 添加分类
     */
    addCategory(category) {
        const categories = this.getCategories();
        const newCategory = {
            id: 'cat_' + Date.now(),
            createdAt: Date.now(),
            ...category
        };
        categories.push(newCategory);
        this.saveCategories(categories);
        return newCategory;
    },

    /**
     * 更新分类
     */
    updateCategory(categoryId, updates) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            categories[index] = {
                ...categories[index],
                ...updates
            };
            this.saveCategories(categories);
            return categories[index];
        }
        return null;
    },

    /**
     * 删除分类
     */
    deleteCategory(categoryId) {
        const categories = this.getCategories();
        const filteredCategories = categories.filter(c => c.id !== categoryId);
        this.saveCategories(filteredCategories);

        // 将相关任务的分类设为空
        const tasks = this.getTasks();
        tasks.forEach(task => {
            if (task.categoryId === categoryId) {
                task.categoryId = '';
            }
        });
        this.saveTasks(tasks);

        return filteredCategories;
    },

    /**
     * 根据 ID 获取分类
     */
    getCategoryById(categoryId) {
        const categories = this.getCategories();
        return categories.find(c => c.id === categoryId) || null;
    },

    /**
     * 获取统计信息
     */
    getStats() {
        const tasks = this.getTasks();
        const now = new Date();
        todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        return {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            pending: tasks.filter(t => !t.completed).length,
            overdue: tasks.filter(t => {
                if (t.completed || !t.dueDate) return false;
                return new Date(t.dueDate) < now;
            }).length,
            today: tasks.filter(t => {
                if (!t.dueDate) return false;
                const dueDate = new Date(t.dueDate).getTime();
                return dueDate >= todayStart && dueDate < todayStart + 86400000;
            }).length
        };
    },

    /**
     * 导出数据
     */
    exportData() {
        return {
            tasks: this.getTasks(),
            categories: this.getCategories(),
            exportedAt: new Date().toISOString()
        };
    },

    /**
     * 导入数据
     */
    importData(data) {
        if (data.tasks) {
            this.saveTasks(data.tasks);
        }
        if (data.categories) {
            this.saveCategories(data.categories);
        }
    }
};

// 初始化存储
StorageManager.init();