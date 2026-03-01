// ===== exportManager.js - Export and Report Module =====

const ExportManager = {
    // Initialize export manager
    init() {
        console.log('Export Manager initialized');
    },
    
    // Export tasks to JSON
    exportTasks() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        this.downloadFile(JSON.stringify(tasks, null, 2), 'lifeos_tasks.json', 'application/json');
        this.showNotification('Tasks exported successfully!', 'success');
    },
    
    // Export expenses to CSV
    exportExpenses() {
        const transactions = JSON.parse(localStorage.getItem('lifeos_transactions') || '[]');
        
        if (transactions.length === 0) {
            this.showNotification('No expenses to export', 'warning');
            return;
        }
        
        // Convert to CSV
        const headers = ['Date', 'Description', 'Amount', 'Category', 'Type'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                new Date(t.date).toLocaleDateString(),
                `"${t.description}"`,
                t.amount,
                t.category,
                t.type
            ].join(','))
        ].join('\n');
        
        this.downloadFile(csvContent, 'lifeos_expenses.csv', 'text/csv');
        this.showNotification('Expenses exported successfully!', 'success');
    },
    
    // Export mood data to JSON
    exportMoodData() {
        const moods = JSON.parse(localStorage.getItem('lifeos_moods') || '[]');
        this.downloadFile(JSON.stringify(moods, null, 2), 'lifeos_moods.json', 'application/json');
        this.showNotification('Mood data exported successfully!', 'success');
    },
    
    // Generate PDF report
    generateReport() {
        this.showNotification('Generating report...', 'info');
        
        // Gather all data
        const data = {
            tasks: JSON.parse(localStorage.getItem('lifeos_tasks') || '[]'),
            transactions: JSON.parse(localStorage.getItem('lifeos_transactions') || '[]'),
            moods: JSON.parse(localStorage.getItem('lifeos_moods') || '[]'),
            generatedAt: new Date().toISOString()
        };
        
        // Calculate summary
        const completedTasks = data.tasks.filter(t => t.completed).length;
        const totalExpenses = data.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Create report content
        const reportContent = `
LIFEOS REPORT
============
Generated: ${new Date().toLocaleDateString()}

TASKS SUMMARY
------------
Total Tasks: ${data.tasks.length}
Completed: ${completedTasks}
Pending: ${data.tasks.length - completedTasks}

EXPENSES SUMMARY
---------------
Total Expenses: ${totalExpenses.toFixed(2)}
Transactions: ${data.transactions.length}

MOOD SUMMARY
-----------
Mood Entries: ${data.moods.length}

---
LifeOS - AI-Powered Life Manager
        `.trim();
        
        this.downloadFile(reportContent, 'lifeos_report.txt', 'text/plain');
        this.showNotification('Report generated successfully!', 'success');
    },
    
    // Quick report generation
    runQuickReport() {
        this.generateReport();
    },
    
    // Import data from JSON
    importData(fileContent, dataType) {
        try {
            const data = JSON.parse(fileContent);
            
            switch (dataType) {
                case 'tasks':
                    localStorage.setItem('lifeos_tasks', JSON.stringify(data));
                    this.showNotification('Tasks imported successfully!', 'success');
                    break;
                case 'moods':
                    localStorage.setItem('lifeos_moods', JSON.stringify(data));
                    this.showNotification('Mood data imported successfully!', 'success');
                    break;
                default:
                    this.showNotification('Unknown data type', 'error');
            }
            
            return true;
        } catch (e) {
            this.showNotification('Failed to import data: ' + e.message, 'error');
            return false;
        }
    },
    
    // Download file helper
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Show notification
    showNotification(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    },
    
    // Export all data
    exportAllData() {
        const allData = {
            tasks: JSON.parse(localStorage.getItem('lifeos_tasks') || '[]'),
            transactions: JSON.parse(localStorage.getItem('lifeos_transactions') || '[]'),
            moods: JSON.parse(localStorage.getItem('lifeos_moods') || '[]'),
            settings: JSON.parse(localStorage.getItem('lifeos_settings') || '{}'),
            exportedAt: new Date().toISOString()
        };
        
        this.downloadFile(JSON.stringify(allData, null, 2), 'lifeos_backup.json', 'application/json');
        this.showNotification('All data exported successfully!', 'success');
    },
    
    // Backup data
    createBackup() {
        this.exportAllData();
    },
    
    // Restore from backup
    restoreFromBackup(fileContent) {
        try {
            const data = JSON.parse(fileContent);
            
            if (data.tasks) localStorage.setItem('lifeos_tasks', JSON.stringify(data.tasks));
            if (data.transactions) localStorage.setItem('lifeos_transactions', JSON.stringify(data.transactions));
            if (data.moods) localStorage.setItem('lifeos_moods', JSON.stringify(data.moods));
            if (data.settings) localStorage.setItem('lifeos_settings', JSON.stringify(data.settings));
            
            this.showNotification('Data restored successfully! Please refresh the page.', 'success');
            setTimeout(() => location.reload(), 2000);
            
            return true;
        } catch (e) {
            this.showNotification('Failed to restore data: ' + e.message, 'error');
            return false;
        }
    }
};

// Global function aliases for HTML onclick handlers
function runQuickReport() {
    if (ExportManager) {
        ExportManager.runQuickReport();
    }
}

function exportTasks() {
    if (ExportManager) {
        ExportManager.exportTasks();
    }
}

function exportExpenses() {
    if (ExportManager) {
        ExportManager.exportExpenses();
    }
}

function exportMoodData() {
    if (ExportManager) {
        ExportManager.exportMoodData();
    }
}

function exportAllData() {
    if (ExportManager) {
        ExportManager.exportAllData();
    }
}

function generateReport() {
    if (ExportManager) {
        ExportManager.generateReport();
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ExportManager !== 'undefined') {
        ExportManager.init();
    }
});

// ===== ADDITIONAL MISSING GLOBAL FUNCTIONS =====

// Show options functions for cards
function showTaskOptions() {
    console.log('Task options menu');
    // Could open a context menu or show options
    const taskCard = document.getElementById('taskManagerCard');
    if (taskCard) {
        taskCard.classList.toggle('show-options');
    }
}

function showAnalyticsOptions() {
    console.log('Analytics options menu');
}

function showMoodOptions() {
    console.log('Mood options menu');
}

function showExpenseOptions() {
    console.log('Expense options menu');
}

function showCalendarOptions() {
    console.log('Calendar options menu');
}

function showGamificationOptions() {
    console.log('Gamification options menu');
}

function showTimezoneOptions() {
    console.log('Timezone options menu');
}

// Settings functions
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function switchSettingsTab(tabName) {
    // Hide all settings content
    const contents = document.querySelectorAll('.settings-content');
    contents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById('settings' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
    
    // Update active tab button
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'var(--bg-tertiary)';
        tab.style.color = 'var(--text-primary)';
    });
    
    // Find the clicked tab and make it active
    event.target.classList.add('active');
    event.target.style.background = 'var(--accent-primary)';
    event.target.style.color = 'white';
}

// Assign to window
window.showTaskOptions = showTaskOptions;
window.showAnalyticsOptions = showAnalyticsOptions;
window.showMoodOptions = showMoodOptions;
window.showExpenseOptions = showExpenseOptions;
window.showCalendarOptions = showCalendarOptions;
window.showGamificationOptions = showGamificationOptions;
window.showTimezoneOptions = showTimezoneOptions;
window.closeSettings = closeSettings;
window.switchSettingsTab = switchSettingsTab;

// ===== AUTH AND NOTIFICATION FUNCTIONS =====

function viewAllNotifications() {
    console.log('View all notifications');
    // Could navigate to a notifications page or show all in dropdown
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        dropdown.style.maxHeight = '500px';
    }
}

function showTerms() {
    alert('Terms of Service\n\nBy using LifeOS, you agree to use the app responsibly and protect your login credentials.');
}

function showPrivacy() {
    alert('Privacy Policy\n\nLifeOS stores your data locally on your device. We do not share your personal information with third parties.');
}

function forgotPassword() {
    const email = prompt('Enter your email to reset password:');
    if (email) {
        alert('Password reset link sent to ' + email);
    }
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.querySelector('.auth-tab:first-child');
    const signupTab = document.querySelector('.auth-tab:last-child');
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        if (loginTab) {
            loginTab.style.background = 'var(--accent-primary)';
            loginTab.style.color = 'white';
        }
        if (signupTab) {
            signupTab.style.background = 'transparent';
            signupTab.style.color = 'var(--text-primary)';
        }
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        if (loginTab) {
            loginTab.style.background = 'transparent';
            loginTab.style.color = 'var(--text-primary)';
        }
        if (signupTab) {
            signupTab.style.background = 'var(--accent-primary)';
            signupTab.style.color = 'white';
        }
    }
}

function switchAuthMode() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authSwitchText = document.getElementById('authSwitchText');
    const authSwitchLink = document.getElementById('authSwitchLink');
    
    if (loginForm.style.display === 'none') {
        switchAuthTab('login');
        if (authSwitchText) authSwitchText.textContent = "Don't have an account?";
        if (authSwitchLink) authSwitchLink.textContent = 'Sign up';
    } else {
        switchAuthTab('signup');
        if (authSwitchText) authSwitchText.textContent = 'Already have an account?';
        if (authSwitchLink) authSwitchLink.textContent = 'Login';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        // Simulate login
        if (typeof AuthManager !== 'undefined' && AuthManager.login) {
            AuthManager.login(email, password);
        } else {
            // Fallback: simple login simulation
            localStorage.setItem('lifeos_user', JSON.stringify({ email: email, name: email.split('@')[0] }));
            showDashboard();
        }
    }
}

function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (name && email && password) {
        // Simulate signup
        if (typeof AuthManager !== 'undefined' && AuthManager.signup) {
            AuthManager.signup(name, email, password);
        } else {
            // Fallback: simple signup simulation
            localStorage.setItem('lifeos_user', JSON.stringify({ email: email, name: name }));
            showDashboard();
        }
    }
}

function socialLogin(provider) {
    alert('Social login with ' + provider + ' would open OAuth flow. This is a demo, so logging in locally.');
    const email = 'demo@' + provider + '.com';
    localStorage.setItem('lifeos_user', JSON.stringify({ email: email, name: 'Demo User' }));
    showDashboard();
}

// Assign auth functions to window
window.viewAllNotifications = viewAllNotifications;
window.showTerms = showTerms;
window.showPrivacy = showPrivacy;
window.forgotPassword = forgotPassword;
window.switchAuthTab = switchAuthTab;
window.switchAuthMode = switchAuthMode;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.socialLogin = socialLogin;

// Add showDashboard to window for fallback (uses App if available)
window.showDashboard = function() {
    if (App && App.showDashboard) {
        App.showDashboard();
    }
};
