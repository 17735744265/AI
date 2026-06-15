/**
 * TaskFlow - 分类管理页面逻辑
 */

let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    initCategoriesPage();
});

/**
 * 初始化分类页面
 */
function initCategoriesPage() {
    renderCategories();

    const form = document.getElementById('category-form');
    if (form) {
        form.addEventListener('submit', handleCategorySubmit);
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
 * 渲染分类列表
 */
function renderCategories() {
    const container = document.getElementById('category-list');
    if (!container) return;

    const categories = StorageManager.getCategories();
    const tasks = StorageManager.getTasks();

    CategoryManager.renderCategories(container, categories, tasks);

    // 添加事件监听
    container.addEventListener('click', (e) => {
        const categoryItem = e.target.closest('.category-item');
        if (!categoryItem) return;

        const categoryId = categoryItem.dataset.categoryId;
        const action = e.target.dataset.action;

        if (action === 'edit') {
            editCategory(categoryId);
        } else if (action === 'delete') {
            ModalManager.confirmDelete(() => {
                deleteCategory(categoryId, categoryItem);
            });
        }
    });
}

/**
 * 处理分类表单提交
 */
function handleCategorySubmit(e) {
    e.preventDefault();

    const name = document.getElementById('category-name').value.trim();
    const color = document.getElementById('category-color').value;

    if (!name) {
        NotificationManager.show('请输入分类名称', 'error');
        return;
    }

    if (editingCategoryId) {
        // 更新分类
        StorageManager.updateCategory(editingCategoryId, { name, color });
        NotificationManager.show('分类已更新', 'success');
        editingCategoryId = null;

        // 重置表单
        const form = document.getElementById('category-form');
        form.reset();
        document.getElementById('category-color').value = '#6366f1';
        document.getElementById('color-preview').textContent = '#6366f1';
        document.querySelector('#category-form button[type="submit"]').textContent = '添加分类';
    } else {
        // 检查是否已存在同名分类
        const categories = StorageManager.getCategories();
        if (categories.some(c => c.name === name)) {
            NotificationManager.show('分类名称已存在', 'error');
            return;
        }

        // 添加分类
        StorageManager.addCategory({ name, color });
        NotificationManager.show('分类添加成功', 'success');
    }

    renderCategories();
}

/**
 * 编辑分类
 */
function editCategory(categoryId) {
    const category = StorageManager.getCategoryById(categoryId);
    if (!category) return;

    editingCategoryId = categoryId;

    document.getElementById('category-name').value = category.name;
    document.getElementById('category-color').value = category.color;
    document.getElementById('color-preview').textContent = category.color;
    document.querySelector('#category-form button[type="submit"]').textContent = '保存更改';
}

/**
 * 删除分类
 */
function deleteCategory(categoryId, categoryItem) {
    categoryItem.classList.add('deleting');

    setTimeout(() => {
        StorageManager.deleteCategory(categoryId);
        categoryItem.remove();
        renderCategories();
        NotificationManager.show('分类已删除', 'success');

        // 如果正在编辑这个分类，重置表单
        if (editingCategoryId === categoryId) {
            editingCategoryId = null;
            const form = document.getElementById('category-form');
            form.reset();
            document.getElementById('category-color').value = '#6366f1';
            document.getElementById('color-preview').textContent = '#6366f1';
            document.querySelector('#category-form button[type="submit"]').textContent = '添加分类';
        }
    }, 300);
}