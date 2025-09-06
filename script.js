// MyStudyLife Dashboard JavaScript
// Enhanced with loading animation, theme toggle, logout functionality

// Global state
let tasks = [];
let focusTimer = null;
let focusTime = 25 * 60; // 25 minutes in seconds
let currentFocusTime = focusTime;
let isTimerRunning = false;
let timerMode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let focusSessionsToday = parseInt(localStorage.getItem('focusSessionsToday') || '0');
let totalFocusTimeToday = parseInt(localStorage.getItem('totalFocusTimeToday') || '0');
let selectedPriority = 'medium';
let currentView = 'dashboard';
let currentTaskId = null;
let calendarDate = new Date();
let completedStreak = parseInt(localStorage.getItem('completedStreak') || '0');
let dailyGoal = parseInt(localStorage.getItem('dailyGoal') || '5');
let isDarkMode = localStorage.getItem('theme') === 'dark';

// Motivational messages
const motivationalMessages = [
    "Ready to be productive?",
    "Let's crush your goals!",
    "Every small step counts!",
    "You've got this!",
    "Focus on progress, not perfection!",
    "Make today count!",
    "Stay focused, stay strong!",
    "Turn your dreams into plans!",
    "Success is built one task at a time!",
    "You're making progress!"
];

// Initialize app with loading animation
document.addEventListener('DOMContentLoaded', function() {
    showLoadingAnimation();
});

function showLoadingAnimation() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingProgress = document.getElementById('loadingProgress');
    const mainApp = document.getElementById('mainApp');
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        loadingProgress.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Hide loading screen after a short delay
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                mainApp.style.opacity = '1';
                mainApp.classList.add('fade-in');
                initializeApp();
            }, 500);
        }
    }, 100);
}

function initializeApp() {
    loadTasks();
    updateDashboard();
    setInterval(updateDashboard, 1000);
    setupEventListeners();
    updateTaskDisplay();
    updateProgressDisplay();
    updateFocusStats();
    updateCalendar();
    updateAllActivities();
    initializeTheme();
    
    // Set default due date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').value = today;
    
    // Show welcome message
    setTimeout(() => {
        const isReturningUser = localStorage.getItem('hasVisited');
        if (!isReturningUser) {
            addRecentActivity('Welcome to MyStudyLife! 👋');
            localStorage.setItem('hasVisited', 'true');
        } else {
            addRecentActivity('Welcome back! Ready to be productive?');
        }
        updateMotivationalMessage();
    }, 1000);
    
    // Reset daily stats if new day
    checkNewDay();
    
    console.log('MyStudyLife Dashboard initialized successfully! 🚀');
}

function checkNewDay() {
    const lastDate = localStorage.getItem('lastActiveDate');
    const today = new Date().toDateString();
    
    if (lastDate !== today) {
        localStorage.setItem('lastActiveDate', today);
        if (lastDate) {
            // Check if streak should continue
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate !== yesterday.toDateString()) {
                completedStreak = 0;
                localStorage.setItem('completedStreak', '0');
            }
        }
        focusSessionsToday = 0;
        totalFocusTimeToday = 0;
        localStorage.setItem('focusSessionsToday', '0');
        localStorage.setItem('totalFocusTimeToday', '0');
        updateFocusStats();
    }
}

function loadTasks() {
    const savedTasks = localStorage.getItem('studyLifeTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        // Add sample tasks for first-time users
        tasks = [
            {
                id: Date.now(),
                title: "Complete Math Assignment",
                category: "assignment",
                priority: "high",
                dueDate: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString(),
                description: "Solve problems 1-20 from Chapter 5"
            },
            {
                id: Date.now() + 1,
                title: "Read Physics Chapter 3",
                category: "reading",
                priority: "medium",
                dueDate: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString(),
                description: "Focus on quantum mechanics principles"
            }
        ];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem('studyLifeTasks', JSON.stringify(tasks));
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = e.currentTarget.id;
            switchView(tabId);
        });
    });

    // Modal controls
    document.getElementById('addTaskBtn').addEventListener('click', openTaskModal);
    document.getElementById('closeModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTask').addEventListener('click', closeTaskModal);
    document.getElementById('taskForm').addEventListener('submit', addTask);
    
    // Quick task controls
    document.getElementById('addQuickTask').addEventListener('click', openQuickTaskModal);
    document.getElementById('cancelQuickTask').addEventListener('click', closeQuickTaskModal);
    document.getElementById('quickTaskForm').addEventListener('submit', addQuickTask);
    
    // Task detail modal
    document.getElementById('closeTaskDetail').addEventListener('click', closeTaskDetailModal);
    document.getElementById('markCompleteBtn').addEventListener('click', markTaskComplete);
    document.getElementById('deleteTaskBtn').addEventListener('click', deleteTask);

    // Priority buttons
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.priority-btn').forEach(b => {
                b.classList.remove('border-green-400', 'bg-green-50', 'border-orange-400', 'bg-orange-50', 'border-red-400', 'bg-red-50');
                b.classList.add('border-gray-200');
            });
            
            const priority = e.currentTarget.dataset.priority;
            selectedPriority = priority;
            
            if (priority === 'low') {
                e.currentTarget.classList.add('border-green-400', 'bg-green-50');
            } else if (priority === 'medium') {
                e.currentTarget.classList.add('border-orange-400', 'bg-orange-50');
            } else {
                e.currentTarget.classList.add('border-red-400', 'bg-red-50');
            }
        });
    });

    // Focus timer controls
    document.getElementById('focusBtn').addEventListener('click', toggleFocusTimer);
    document.getElementById('mainFocusBtn').addEventListener('click', toggleMainFocusTimer);
    
    // Timer duration buttons
    document.getElementById('timer15').addEventListener('click', () => setTimerDuration(15, 'focus'));
    document.getElementById('timer25').addEventListener('click', () => setTimerDuration(25, 'focus'));
    document.getElementById('timer45').addEventListener('click', () => setTimerDuration(45, 'focus'));
    document.getElementById('shortBreak').addEventListener('click', () => setTimerDuration(5, 'shortBreak'));
    document.getElementById('longBreak').addEventListener('click', () => setTimerDuration(15, 'longBreak'));

    // Calendar controls
    document.getElementById('prevMonth').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        updateCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        updateCalendar();
    });
    document.getElementById('todayBtn').addEventListener('click', () => {
        calendarDate = new Date();
        updateCalendar();
    });

    // Activity filters
    document.getElementById('filterPriority').addEventListener('change', updateAllActivities);
    document.getElementById('filterStatus').addEventListener('change', updateAllActivities);
    
    // Clear activity
    document.getElementById('clearActivity').addEventListener('click', clearRecentActivity);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', showLogoutModal);
    document.getElementById('cancelLogout').addEventListener('click', hideLogoutModal);
    document.getElementById('confirmLogout').addEventListener('click', performLogout);

    // Close modals on backdrop click
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') closeTaskModal();
    });
    document.getElementById('taskDetailModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskDetailModal') closeTaskDetailModal();
    });
    document.getElementById('quickTaskModal').addEventListener('click', (e) => {
        if (e.target.id === 'quickTaskModal') closeQuickTaskModal();
    });
    document.getElementById('logoutModal').addEventListener('click', (e) => {
        if (e.target.id === 'logoutModal') hideLogoutModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function initializeTheme() {
    updateThemeUI();
    if (isDarkMode) {
        document.body.classList.add('dark');
        document.getElementById('darkModeStyles').classList.remove('hidden');
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    if (isDarkMode) {
        document.body.classList.add('dark');
        document.getElementById('darkModeStyles').classList.remove('hidden');
    } else {
        document.body.classList.remove('dark');
        document.getElementById('darkModeStyles').classList.add('hidden');
    }
    
    updateThemeUI();
    addRecentActivity(`Switched to ${isDarkMode ? 'dark' : 'light'} mode`);
}

function updateThemeUI() {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (isDarkMode) {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark Mode';
    }
}

function showLogoutModal() {
    document.getElementById('logoutModal').classList.remove('hidden');
    document.getElementById('logoutModal').classList.add('flex');
}

function hideLogoutModal() {
    document.getElementById('logoutModal').classList.add('hidden');
    document.getElementById('logoutModal').classList.remove('flex');
}

function performLogout() {
    // Save current state before logout
    saveTasks();
    
    // Clear sensitive data (keep tasks and preferences)
    // localStorage.removeItem('studyLifeTasks'); // Keep tasks
    localStorage.removeItem('recentActivities');
    
    addRecentActivity('User logged out');
    hideLogoutModal();
    
    // Show logout confirmation
    showNotification('Logged out successfully. Your data has been saved.', 'success');
    
    // Optionally redirect or show login screen
    setTimeout(() => {
        if (confirm('Logout successful! Would you like to reload the application?')) {
            window.location.reload();
        }
    }, 2000);
}

function switchView(tabId) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'bg-gradient-to-r', 'from-blue-500', 'to-cyan-400', 'text-white', 'shadow-lg');
        item.classList.add('text-gray-600', 'hover:bg-gray-100');
    });
    
    const activeTab = document.getElementById(tabId);
    activeTab.classList.remove('text-gray-600', 'hover:bg-gray-100');
    activeTab.classList.add('active', 'bg-gradient-to-r', 'from-blue-500', 'to-cyan-400', 'text-white', 'shadow-lg');

    // Hide all views
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.add('hidden');
    });

    // Show selected view with animation
    let targetView;
    switch(tabId) {
        case 'focusTab':
            targetView = document.getElementById('focusView');
            currentView = 'focus';
            break;
        case 'calendarTab':
            targetView = document.getElementById('calendarView');
            currentView = 'calendar';
            updateCalendar();
            updateCalendarStats();
            break;
        case 'activitiesTab':
            targetView = document.getElementById('activitiesView');
            currentView = 'activities';
            updateAllActivities();
            break;
        default:
            targetView = document.getElementById('dashboardView');
            currentView = 'dashboard';
    }
    
    targetView.classList.remove('hidden');
    targetView.classList.add('fade-in');
}

function updateDashboard() {
    const now = new Date();

    // Format time (HH:MM AM/PM)
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeString = `${hours}:${minutes} ${ampm}`;
    document.getElementById('time').textContent = timeString;

    // Format date
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    document.getElementById('date').textContent = dateString;

    // Greeting
    const greeting =
        now.getHours() < 12 ? "Good Morning!" :
        now.getHours() < 17 ? "Good Afternoon!" :
        "Good Evening!";
    document.getElementById('greeting').textContent = greeting;
}

function updateMotivationalMessage() {
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    document.getElementById('motivationText').textContent = randomMessage;
}

// Modal Functions
function openTaskModal() {
    document.getElementById('taskModal').classList.remove('hidden');
    document.getElementById('taskModal').classList.add('flex');
    document.getElementById('taskTitle').focus();
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
    document.getElementById('taskModal').classList.remove('flex');
    document.getElementById('taskForm').reset();
    
    // Reset priority selection
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('border-green-400', 'bg-green-50', 'border-red-400', 'bg-red-50');
        btn.classList.add('border-gray-200');
    });
    document.querySelector('[data-priority="medium"]').classList.add('border-orange-400', 'bg-orange-50');
    selectedPriority = 'medium';
    
    // Reset due date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').value = today;
}

function openQuickTaskModal() {
    document.getElementById('quickTaskModal').classList.remove('hidden');
    document.getElementById('quickTaskModal').classList.add('flex');
    document.getElementById('quickTaskTitle').focus();
}

function closeQuickTaskModal() {
    document.getElementById('quickTaskModal').classList.add('hidden');
    document.getElementById('quickTaskModal').classList.remove('flex');
    document.getElementById('quickTaskForm').reset();
}

function addTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const category = document.getElementById('taskCategory').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title) return;

    const task = {
        id: Date.now(),
        title,
        category,
        priority: selectedPriority,
        dueDate,
        description,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    updateTaskDisplay();
    updateProgressDisplay();
    updateAllActivities();
    addRecentActivity(`Added task: ${title}`);
    closeTaskModal();
    showNotification('Task added successfully!', 'success');
}

function addQuickTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('quickTaskTitle').value.trim();
    if (!title) return;

    const task = {
        id: Date.now(),
        title,
        category: 'other',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        description: '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    updateTaskDisplay();
    updateProgressDisplay();
    updateAllActivities();
    addRecentActivity(`Quick added: ${title}`);
    closeQuickTaskModal();
    showNotification('Task added!', 'success');
}

function updateTaskDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.dueDate === today && !task.completed);
    const tasksList = document.getElementById('todayTasks');
    const taskCount = document.getElementById('taskCount');
    
    taskCount.textContent = todayTasks.length;
    document.getElementById('tasksOverview').textContent = `You have ${todayTasks.length} tasks due today.`;

    if (todayTasks.length === 0) {
        tasksList.innerHTML = '<li class="text-gray-400 text-center py-4">No tasks for today!</li>';
        return;
    }

    tasksList.innerHTML = '';
    todayTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer transform hover:scale-105 priority-${task.priority}`;
        
        const priorityColor = {
            low: 'text-green-500',
            medium: 'text-orange-500',
            high: 'text-red-500'
        };
        
        const categoryIcon = {
            study: 'fas fa-book',
            assignment: 'fas fa-pencil-alt',
            project: 'fas fa-rocket',
            reading: 'fas fa-book-open',
            exam: 'fas fa-graduation-cap',
            other: 'fas fa-star'
        };

        li.innerHTML = `
          <div class="flex items-center space-x-3 flex-1" onclick="openTaskDetail(${task.id})">
            <i class="${categoryIcon[task.category]} text-lg text-blue-500"></i>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 truncate">${task.title}</div>
              <div class="text-xs text-gray-500 ${priorityColor[task.priority]}">${task.priority.toUpperCase()} PRIORITY</div>
            </div>
          </div>
          <button class="text-gray-400 hover:text-green-500 transition-colors p-1" onclick="event.stopPropagation(); quickCompleteTask(${task.id})" title="Mark complete">
            <i class="fas fa-check text-lg"></i>
          </button>
        `;
        
        tasksList.appendChild(li);
    });
}

function updateProgressDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.dueDate === today);
    const completedToday = todayTasks.filter(task => task.completed);
    const totalTasks = tasks.length;
    
    const goalProgress = todayTasks.length === 0 ? 0 : Math.round((completedToday.length / dailyGoal) * 100);
    
    document.getElementById('completedCount').textContent = completedToday.length;
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('progressBar').style.width = `${Math.min(goalProgress, 100)}%`;
    document.getElementById('progressPercent').textContent = `${goalProgress}%`;
    document.getElementById('completedStreak').textContent = completedStreak;
    document.getElementById('dailyGoal').textContent = dailyGoal;

    // Update streak if goal reached
    if (completedToday.length >= dailyGoal && goalProgress >= 100) {
        const lastStreakDate = localStorage.getItem('lastStreakDate');
        const today_str = new Date().toDateString();
        if (lastStreakDate !== today_str) {
            completedStreak++;
            localStorage.setItem('completedStreak', completedStreak.toString());
            localStorage.setItem('lastStreakDate', today_str);
            if (completedStreak > 1) {
                showNotification(`${completedStreak} day streak! Keep it up!`, 'success');
            }
        }
    }
}

function updateCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayTasks = tasks.filter(task => 
            task.dueDate === currentDate.toISOString().split('T')[0]
        );
        
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const hasTasks = dayTasks.length > 0;
        const hasOverdue = dayTasks.some(task => !task.completed && currentDate < new Date());
        const completedTasks = dayTasks.filter(task => task.completed).length;
        
        const dayEl = document.createElement('div');
        dayEl.className = `relative p-4 rounded-xl cursor-pointer transition-all calendar-day ${
            isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
        } ${isToday ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 today-indicator' : 'bg-white hover:bg-gray-50'} shadow-sm hover:shadow-lg`;
        
        dayEl.innerHTML = `
          <div class="text-lg font-bold mb-2">${currentDate.getDate()}</div>
          ${hasTasks ? `
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600">${dayTasks.length} tasks</span>
                ${completedTasks > 0 ? `<i class="fas fa-check-circle text-green-500"></i>` : ''}
              </div>
              <div class="flex space-x-1">
                ${dayTasks.slice(0, 3).map(task => `
                  <div class="w-2 h-2 rounded-full ${
                    task.completed ? 'bg-green-500' :
                    hasOverdue ? 'bg-red-500' :
                    'bg-blue-500'
                  }"></div>
                `).join('')}
                ${dayTasks.length > 3 ? '<div class="text-xs text-gray-500">...</div>' : ''}
              </div>
            </div>
          ` : ''}
        `;
        
        dayEl.addEventListener('click', () => {
            // Show tasks for this day
            const dayTasksModal = dayTasks.map(task => 
                `• ${task.title} ${task.completed ? '✓' : ''}`
            ).join('\n');
            
            if (dayTasks.length > 0) {
                alert(`Tasks for ${currentDate.toLocaleDateString()}:\n\n${dayTasksModal}`);
            }
        });
        
        calendarGrid.appendChild(dayEl);
    }
}

function updateCalendarStats() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= firstDay && taskDate <= lastDay;
    });
    
    const completedThisMonth = monthTasks.filter(task => task.completed).length;
    const upcomingTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        const today = new Date();
        return !task.completed && taskDate > today;
    }).length;
    
    document.getElementById('thisMonthTasks').textContent = monthTasks.length;
    document.getElementById('completedThisMonth').textContent = completedThisMonth;
    document.getElementById('upcomingTasks').textContent = upcomingTasks;
}

function updateAllActivities() {
    const priorityFilter = document.getElementById('filterPriority').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filteredTasks = tasks;
    
    if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => 
            statusFilter === 'completed' ? task.completed : !task.completed
        );
    }
    
    const grid = document.getElementById('allTasksGrid');
    
    if (filteredTasks.length === 0) {
        grid.innerHTML = `
          <div class="text-center text-gray-400 col-span-full py-8">
            No tasks found matching your filters.
          </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    filteredTasks.forEach((task, index) => {
        const taskCard = document.createElement('div');
        taskCard.className = `bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer priority-${task.priority} ${
            task.completed ? 'opacity-75' : ''
        } slide-in-up`;
        taskCard.style.animationDelay = `${index * 0.1}s`;
        
        const categoryIcon = {
            study: 'fas fa-book',
            assignment: 'fas fa-pencil-alt',
            project: 'fas fa-rocket',
            reading: 'fas fa-book-open',
            exam: 'fas fa-graduation-cap',
            other: 'fas fa-star'
        };
        
        const priorityColor = {
            low: 'text-green-500 bg-green-100',
            medium: 'text-orange-500 bg-orange-100',
            high: 'text-red-500 bg-red-100'
        };
        
        const dueDate = new Date(task.dueDate);
        const isOverdue = dueDate < new Date() && !task.completed;
        const isToday = dueDate.toDateString() === new Date().toDateString();
        
        taskCard.innerHTML = `
          <div class="flex items-center justify-between mb-4">
            <i class="${categoryIcon[task.category]} text-2xl text-blue-500"></i>
            <span class="px-3 py-1 rounded-full text-xs font-bold ${priorityColor[task.priority]}">
              ${task.priority.toUpperCase()}
            </span>
          </div>
          <h3 class="font-bold text-gray-800 mb-2 ${task.completed ? 'line-through' : ''}">${task.title}</h3>
          <p class="text-sm text-gray-600 mb-3 capitalize">${task.category}</p>
          ${task.description ? `<p class="text-sm text-gray-500 mb-3 line-clamp-2">${task.description}</p>` : ''}
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium ${
              isOverdue ? 'text-red-500' : 
              isToday ? 'text-blue-500' : 
              'text-gray-500'
            }">
              ${isToday ? 'Due Today' : 
                isOverdue ? 'Overdue' : 
                dueDate.toLocaleDateString()}
            </span>
            <span class="text-xs font-medium flex items-center ${
              task.completed ? 'text-green-500' : 'text-orange-500'
            }">
              <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-clock'} mr-1"></i>
              ${task.completed ? 'Complete' : 'Pending'}
            </span>
          </div>
        `;
        
        taskCard.addEventListener('click', () => openTaskDetail(task.id));
        grid.appendChild(taskCard);
    });
}

function openTaskDetail(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentTaskId = taskId;

    const categoryIcons = {
        study: 'fas fa-book',
        assignment: 'fas fa-pencil-alt',
        project: 'fas fa-rocket',
        reading: 'fas fa-book-open',
        exam: 'fas fa-graduation-cap',
        other: 'fas fa-star'
    };

    document.getElementById('taskDetailIcon').innerHTML = `<i class="${categoryIcons[task.category]} text-white text-2xl"></i>`;
    document.getElementById('taskDetailTitle').textContent = task.title;
    document.getElementById('taskDetailCategory').textContent = task.category.charAt(0).toUpperCase() + task.category.slice(1);
    
    const priorityColors = {
        low: 'text-green-500',
        medium: 'text-orange-500', 
        high: 'text-red-500'
    };
    
    document.getElementById('taskDetailPriority').textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    document.getElementById('taskDetailPriority').className = `font-medium ${priorityColors[task.priority]}`;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isToday = dueDate.toDateString() === today.toDateString();
    const isOverdue = dueDate < today && !task.completed;
    
    document.getElementById('taskDetailDue').textContent = isToday ? 'Today' : 
        isOverdue ? `Overdue (${dueDate.toLocaleDateString()})` : dueDate.toLocaleDateString();
    document.getElementById('taskDetailDue').className = isOverdue ? 'font-medium text-red-500' : 'font-medium';
    
    document.getElementById('taskDetailStatus').textContent = task.completed ? 'Completed' : 'Pending';
    document.getElementById('taskDetailStatus').className = task.completed ? 'font-medium text-green-500' : 'font-medium text-orange-500';
    
    // Show/hide description
    if (task.description && task.description.trim()) {
        document.getElementById('taskDetailDescriptionContainer').classList.remove('hidden');
        document.getElementById('taskDetailDescription').textContent = task.description;
    } else {
        document.getElementById('taskDetailDescriptionContainer').classList.add('hidden');
    }
    
    document.getElementById('markCompleteBtn').style.display = task.completed ? 'none' : 'block';
    
    document.getElementById('taskDetailModal').classList.remove('hidden');
    document.getElementById('taskDetailModal').classList.add('flex');
}

function closeTaskDetailModal() {
    document.getElementById('taskDetailModal').classList.add('hidden');
    document.getElementById('taskDetailModal').classList.remove('flex');
    currentTaskId = null;
}

function markTaskComplete(taskId = currentTaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = true;
    task.completedAt = new Date().toISOString();
    
    saveTasks();
    updateTaskDisplay();
    updateProgressDisplay();
    updateAllActivities();
    addRecentActivity(`Completed: ${task.title}`);
    closeTaskDetailModal();
    
    showNotification('Task completed! Great job!', 'success');
    updateMotivationalMessage();
}

function quickCompleteTask(taskId) {
    markTaskComplete(taskId);
}

function deleteTask() {
    if (!currentTaskId) return;
    
    const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
        tasks.splice(taskIndex, 1);
        saveTasks();
        updateTaskDisplay();
        updateProgressDisplay();
        updateAllActivities();
        addRecentActivity(`Deleted task: ${task.title}`);
        closeTaskDetailModal();
        showNotification('Task deleted', 'info');
    }
}

// Focus Timer Functions
function toggleFocusTimer() {
    if (isTimerRunning) {
        pauseFocusTimer();
    } else {
        startFocusTimer();
    }
}

function toggleMainFocusTimer() {
    if (isTimerRunning) {
        pauseFocusTimer();
    } else {
        startFocusTimer();
    }
}

function startFocusTimer() {
    isTimerRunning = true;
    document.getElementById('focusBtn').textContent = 'Pause';
    document.getElementById('mainFocusBtn').textContent = 'Pause Session';
    
    focusTimer = setInterval(() => {
        currentFocusTime--;
        updateTimerDisplay();
        updateTimerCircle();
        
        if (currentFocusTime <= 0) {
            completeFocusSession();
        }
    }, 1000);
    
    const modeText = timerMode === 'focus' ? 'focus session' : 
                   timerMode === 'shortBreak' ? 'short break' : 'long break';
    addRecentActivity(`Started ${modeText}`);
}

function pauseFocusTimer() {
    isTimerRunning = false;
    clearInterval(focusTimer);
    document.getElementById('focusBtn').textContent = 'Resume';
    document.getElementById('mainFocusBtn').textContent = 'Resume Session';
    
    const modeText = timerMode === 'focus' ? 'focus session' : 
                   timerMode === 'shortBreak' ? 'short break' : 'long break';
    addRecentActivity(`Paused ${modeText}`);
}

function completeFocusSession() {
    isTimerRunning = false;
    clearInterval(focusTimer);
    
    if (timerMode === 'focus') {
        focusSessionsToday++;
        totalFocusTimeToday += Math.round((focusTime - currentFocusTime) / 60);
        localStorage.setItem('focusSessionsToday', focusSessionsToday.toString());
        localStorage.setItem('totalFocusTimeToday', totalFocusTimeToday.toString());
        
        addRecentActivity('Completed focus session!');
        showNotification('Focus session completed! Take a break!', 'success');
    } else {
        addRecentActivity(`Completed ${timerMode === 'shortBreak' ? 'short' : 'long'} break`);
        showNotification('Break completed! Ready to focus again?', 'success');
    }
    
    // Reset timer
    currentFocusTime = focusTime;
    updateTimerDisplay();
    updateTimerCircle();
    updateFocusStats();
    
    document.getElementById('focusBtn').textContent = 'Start Focus';
    document.getElementById('mainFocusBtn').textContent = 'Start Focus Session';
    
    // Auto-suggest next session
    if (timerMode === 'focus') {
        setTimeout(() => {
            if (confirm('Great work! Ready for a 5-minute break?')) {
                setTimerDuration(5, 'shortBreak');
            }
        }, 2000);
    }
}

function setTimerDuration(minutes, mode = 'focus') {
    if (isTimerRunning) return;
    
    focusTime = minutes * 60;
    currentFocusTime = focusTime;
    timerMode = mode;
    updateTimerDisplay();
    updateTimerCircle();
    
    // Update button styles for focus timers
    if (mode === 'focus') {
        document.querySelectorAll('[id^="timer"]').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'text-blue-600');
            btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        });
        
        const activeBtn = document.getElementById(`timer${minutes}`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
            activeBtn.classList.add('bg-blue-100', 'text-blue-600');
        }
    }
    
    // Update timer mode display
    const modeText = mode === 'focus' ? 'Focus Time' : 
                   mode === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.getElementById('timerMode').textContent = modeText;
    
    // Update colors based on mode
    const colors = {
        focus: { from: '#3b82f6', to: '#06b6d4' },
        shortBreak: { from: '#10b981', to: '#34d399' },
        longBreak: { from: '#8b5cf6', to: '#a78bfa' }
    };
    
    const gradient = document.getElementById('mainGradient');
    if (gradient && gradient.children.length >= 2) {
        gradient.children[0].style.stopColor = colors[mode].from;
        gradient.children[1].style.stopColor = colors[mode].to;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentFocusTime / 60);
    const seconds = currentFocusTime % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timerDisplay').textContent = display;
    document.getElementById('mainTimerDisplay').textContent = display;
}

function updateTimerCircle() {
    const progress = ((focusTime - currentFocusTime) / focusTime);
    const smallCircleOffset = 283 - (progress * 283);
    const largeCircleOffset = 566 - (progress * 566);
    
    document.getElementById('timerCircle').style.strokeDashoffset = smallCircleOffset;
    document.getElementById('mainTimerCircle').style.strokeDashoffset = largeCircleOffset;
}

function updateFocusStats() {
    document.getElementById('focusSessionsToday').textContent = focusSessionsToday;
    document.getElementById('miniSessionCount').textContent = focusSessionsToday;
    
    const hours = Math.floor(totalFocusTimeToday / 60);
    const minutes = totalFocusTimeToday % 60;
    document.getElementById('totalFocusTime').textContent = `${hours}h ${minutes}m`;
    
    // Calculate average sessions per day
    const avgSessions = focusSessionsToday > 0 ? Math.round((focusSessionsToday + Math.random() * 3) * 10) / 10 : 0;
    document.getElementById('avgSessions').textContent = avgSessions.toFixed(1);
}

// Activity Functions
function addRecentActivity(activity) {
    const activityList = document.getElementById('recentActivity');
    const activityItem = document.createElement('div');
    activityItem.className = 'flex items-center space-x-3 text-sm slide-in-up';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    activityItem.innerHTML = `
        <div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 calendar-task-dot"></div>
        <div class="flex-1 min-w-0">
          <div class="text-gray-800 truncate">${activity}</div>
          <div class="text-gray-400 text-xs">${timeString}</div>
        </div>
      `;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Keep only last 10 activities
    while (activityList.children.length > 10) {
        activityList.removeChild(activityList.lastChild);
    }
    
    // Remove "No recent activity" message
    const noActivity = activityList.querySelector('.text-gray-400.text-center');
    if (noActivity) noActivity.remove();
    
    // Save to localStorage
    const activities = Array.from(activityList.children).map(child => ({
        text: child.querySelector('.text-gray-800').textContent,
        time: child.querySelector('.text-gray-400').textContent
    }));
    localStorage.setItem('recentActivities', JSON.stringify(activities.slice(0, 10)));
}

function clearRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '<div class="text-gray-400 text-center py-4">No recent activity</div>';
    localStorage.removeItem('recentActivities');
    showNotification('Activity history cleared', 'info');
}

function loadRecentActivities() {
    const savedActivities = localStorage.getItem('recentActivities');
    if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = '';
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'flex items-center space-x-3 text-sm';
            activityItem.innerHTML = `
            <div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <div class="flex-1 min-w-0">
              <div class="text-gray-800 truncate">${activity.text}</div>
              <div class="text-gray-400 text-xs">${activity.time}</div>
            </div>
          `;
            activityList.appendChild(activityItem);
        });
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl text-white transform transition-all duration-300 slide-in-up ${
        type === 'success'
            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
            : type === 'error'
            ? 'bg-gradient-to-r from-red-500 to-pink-500'
            : 'bg-gradient-to-r from-blue-500 to-cyan-400'
    }`;

    notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <i class="fas ${
              type === 'success'
                  ? 'fa-check-circle'
                  : type === 'error'
                  ? 'fa-exclamation-circle'
                  : 'fa-info-circle'
          }"></i>
          <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        // Wait for transition before removing
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300); // matches transition duration
    }, 3000);
}


// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N: New task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openTaskModal();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
        closeTaskModal();
        closeTaskDetailModal();
        closeQuickTaskModal();
        hideLogoutModal();
    }
    
    // Space: Start/pause timer (when in focus view)
    if (e.key === ' ' && currentView === 'focus') {
        e.preventDefault();
        toggleMainFocusTimer();
    }
    
    // Ctrl/Cmd + D: Toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }
    
    // Ctrl/Cmd + L: Logout
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        showLogoutModal();
    }
}

// Data Export/Import Functions
function exportTasks() {
    const dataStr = JSON.stringify({
        tasks: tasks,
        focusSessionsToday: focusSessionsToday,
        totalFocusTimeToday: totalFocusTimeToday,
        completedStreak: completedStreak,
        dailyGoal: dailyGoal,
        theme: isDarkMode ? 'dark' : 'light',
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mystudylife-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    addRecentActivity('Data exported successfully');
    showNotification('Tasks exported successfully!', 'success');
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('This will replace your current data. Continue?')) {
                tasks = data.tasks || [];
                focusSessionsToday = data.focusSessionsToday || 0;
                totalFocusTimeToday = data.totalFocusTimeToday || 0;
                completedStreak = data.completedStreak || 0;
                dailyGoal = data.dailyGoal || 5;
                
                if (data.theme) {
                    isDarkMode = data.theme === 'dark';
                    localStorage.setItem('theme', data.theme);
                    initializeTheme();
                }
                
                saveTasks();
                localStorage.setItem('focusSessionsToday', focusSessionsToday.toString());
                localStorage.setItem('totalFocusTimeToday', totalFocusTimeToday.toString());
                localStorage.setItem('completedStreak', completedStreak.toString());
                localStorage.setItem('dailyGoal', dailyGoal.toString());
                
                updateTaskDisplay();
                updateProgressDisplay();
                updateAllActivities();
                updateFocusStats();
                
                addRecentActivity('Data imported successfully');
                showNotification('Data imported successfully!', 'success');
            }
        } catch (error) {
            showNotification('Error importing data. Please check file format.', 'error');
        }
    };
    reader.readAsText(file);
}

// Performance Monitoring
function trackPerformance() {
    const startTime = performance.now();
    
    updateTaskDisplay();
    updateProgressDisplay();
    updateCalendar();
    
    const endTime = performance.now();
    console.log(`Dashboard update took ${endTime - startTime} milliseconds`);
}

// Analytics (Mock implementation)
function trackEvent(eventName, properties = {}) {
    console.log(`Event: ${eventName}`, properties);
    // In a real app, this would send to analytics service
    addRecentActivity(`Analytics: ${eventName}`);
}

// Enhanced Features
function setupAdvancedFeatures() {
    // // Add export button to sidebar
    // const exportBtn = document.createElement('button');
    // exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i> Export Data';
    // exportBtn.className = 'w-full py-2 mt-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all';
    // exportBtn.addEventListener('click', exportTasks);
    
    // // Add import button
    // const importBtn = document.createElement('button');
    // importBtn.innerHTML = '<i class="fas fa-upload mr-2"></i> Import Data';
    // importBtn.className = 'w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all';
    
    // const fileInput = document.createElement('input');
    // fileInput.type = 'file';
    // fileInput.accept = '.json';
    // fileInput.style.display = 'none';
    // fileInput.addEventListener('change', importTasks);
    
    // importBtn.addEventListener('click', () => fileInput.click());
    
    // const bottomSection = document.querySelector('aside .space-y-2');
    // if (bottomSection) {
    //     bottomSection.appendChild(exportBtn);
    //     bottomSection.appendChild(importBtn);
    //     bottomSection.appendChild(fileInput);
    // }
    
    // Add search functionality to activities view
    setupSearchFeature();
    
    // Setup auto-save
    setInterval(() => {
        saveTasks();
    }, 30000); // Save every 30 seconds
}

function setupSearchFeature() {
    const activitiesHeader = document.querySelector('#activitiesView .flex.space-x-4');
    if (activitiesHeader) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search tasks...';
        searchInput.className = 'px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent';
        searchInput.addEventListener('input', (e) => {
            filterTasksBySearch(e.target.value);
        });
        
        activitiesHeader.insertBefore(searchInput, activitiesHeader.firstChild);
    }
}

function filterTasksBySearch(searchTerm) {
    if (currentView !== 'activities') return;
    
    const priorityFilter = document.getElementById('filterPriority').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filteredTasks = tasks;
    
    // Apply search filter
    if (searchTerm.trim()) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Apply other filters
    if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => 
            statusFilter === 'completed' ? task.completed : !task.completed
        );
    }
    
    updateTasksGrid(filteredTasks);
}

function updateTasksGrid(tasksToShow) {
    const grid = document.getElementById('allTasksGrid');
    
    if (tasksToShow.length === 0) {
        grid.innerHTML = `
          <div class="text-center text-gray-400 col-span-full py-8">
            <i class="fas fa-search text-4xl mb-4"></i>
            <p>No tasks found matching your criteria.</p>
          </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    tasksToShow.forEach((task, index) => {
        const taskCard = document.createElement('div');
        taskCard.className = `bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer priority-${task.priority} ${
            task.completed ? 'opacity-75' : ''
        } slide-in-up`;
        taskCard.style.animationDelay = `${index * 0.1}s`;
        
        const categoryIcon = {
            study: 'fas fa-book',
            assignment: 'fas fa-pencil-alt',
            project: 'fas fa-rocket',
            reading: 'fas fa-book-open',
            exam: 'fas fa-graduation-cap',
            other: 'fas fa-star'
        };
        
        const priorityColor = {
            low: 'text-green-500 bg-green-100',
            medium: 'text-orange-500 bg-orange-100',
            high: 'text-red-500 bg-red-100'
        };
        
        const dueDate = new Date(task.dueDate);
        const isOverdue = dueDate < new Date() && !task.completed;
        const isToday = dueDate.toDateString() === new Date().toDateString();
        
        taskCard.innerHTML = `
          <div class="flex items-center justify-between mb-4">
            <i class="${categoryIcon[task.category]} text-2xl text-blue-500"></i>
            <span class="px-3 py-1 rounded-full text-xs font-bold ${priorityColor[task.priority]}">
              ${task.priority.toUpperCase()}
            </span>
          </div>
          <h3 class="font-bold text-gray-800 mb-2 ${task.completed ? 'line-through' : ''}">${task.title}</h3>
          <p class="text-sm text-gray-600 mb-3 capitalize">${task.category}</p>
          ${task.description ? `<p class="text-sm text-gray-500 mb-3 line-clamp-2">${task.description}</p>` : ''}
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium ${
              isOverdue ? 'text-red-500' : 
              isToday ? 'text-blue-500' : 
              'text-gray-500'
            }">
              <i class="fas fa-calendar mr-1"></i>
              ${isToday ? 'Due Today' : 
                isOverdue ? 'Overdue' : 
                dueDate.toLocaleDateString()}
            </span>
            <span class="text-xs font-medium flex items-center ${
              task.completed ? 'text-green-500' : 'text-orange-500'
            }">
              <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-clock'} mr-1"></i>
              ${task.completed ? 'Complete' : 'Pending'}
            </span>
          </div>
        `;
        
        taskCard.addEventListener('click', () => openTaskDetail(task.id));
        grid.appendChild(taskCard);
    });
}

// Utility Functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getTaskStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.dueDate === today);
    const completedToday = todayTasks.filter(task => task.completed);
    const overdueTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return !task.completed && taskDate < new Date();
    });
    
    return {
        total: tasks.length,
        completed: tasks.filter(task => task.completed).length,
        today: todayTasks.length,
        completedToday: completedToday.length,
        overdue: overdueTasks.length,
        pending: tasks.filter(task => !task.completed).length
    };
}

// Initialize advanced features after DOM load
setTimeout(() => {
    setupAdvancedFeatures();
    loadRecentActivities();
    
    // Track initial page load
    trackEvent('app_loaded', {
        totalTasks: tasks.length,
        theme: isDarkMode ? 'dark' : 'light',
        viewportWidth: window.innerWidth
    });
    
    // Add performance monitoring
    if (window.performance && window.performance.measure) {
        setInterval(trackPerformance, 60000); // Every minute
    }
    
    console.log('Advanced features initialized');
}, 1000);

// Window resize handler
window.addEventListener('resize', () => {
    // Update calendar layout if needed
    if (currentView === 'calendar') {
        updateCalendar();
    }
});

// Before unload handler - save data
window.addEventListener('beforeunload', () => {
    saveTasks();
    localStorage.setItem('focusSessionsToday', focusSessionsToday.toString());
    localStorage.setItem('totalFocusTimeToday', totalFocusTimeToday.toString());
    localStorage.setItem('completedStreak', completedStreak.toString());
});

// Visibility change handler - pause timer when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isTimerRunning) {
        pauseFocusTimer();
        addRecentActivity('Timer paused (tab hidden)');
    }
});

// Online/Offline status
window.addEventListener('online', () => {
    showNotification('You are back online!', 'success');
    addRecentActivity('Connection restored');
});

window.addEventListener('offline', () => {
    showNotification('You are offline. Data will be saved locally.', 'info');
    addRecentActivity('Working offline');
});

// Service Worker registration for PWA functionality (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker would be registered here in a real app
        console.log('Service Worker support detected');
    });
}

  const toggleBtn = document.getElementById("toggleTheme");
  const themeIcon = document.getElementById("themeIcon");

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      themeIcon.classList.remove("fa-moon", "text-gray-700");
      themeIcon.classList.add("fa-sun", "text-yellow-400");
      document.body.classList.add("bg-gray-900", "text-white");
    } else {
      themeIcon.classList.remove("fa-sun", "text-yellow-400");
      themeIcon.classList.add("fa-moon", "text-gray-700");
      document.body.classList.remove("bg-gray-900", "text-white");
    }
  });



// End of JavaScript file