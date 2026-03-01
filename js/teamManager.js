// ===== teamManager.js - Team Management Module =====

const TeamManager = {
    // Team data
    team: [],
    
    // Initialize team manager
    init() {
        this.loadTeam();
        this.renderTeam();
    },
    
    // Load team from storage
    loadTeam() {
        const storedTeam = localStorage.getItem('lifeos_team');
        if (storedTeam) {
            this.team = JSON.parse(storedTeam);
        } else {
            // Default demo team members
            this.team = [
                { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', avatar: null, status: 'online' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Member', avatar: null, status: 'offline' }
            ];
        }
    },
    
    // Save team to storage
    saveTeam() {
        localStorage.setItem('lifeos_team', JSON.stringify(this.team));
    },
    
    // Render team members
    renderTeam() {
        const container = document.getElementById('teamMembers');
        if (!container) return;
        
        container.innerHTML = this.team.map(member => `
            <div class="team-member" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 0.5rem;">
                <div class="member-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                    ${member.name.charAt(0)}
                </div>
                <div class="member-info" style="flex: 1;">
                    <div style="font-weight: 600;">${member.name}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${member.role}</div>
                </div>
                <div class="member-status" style="width: 10px; height: 10px; border-radius: 50%; background: ${member.status === 'online' ? 'var(--success)' : 'var(--text-tertiary)'};"></div>
            </div>
        `).join('');
    },
    
    // Show team modal
    showTeam() {
        const modal = document.getElementById('teamModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            this.renderTeam();
        }
    },
    
    // Invite new member
    inviteMember() {
        const email = prompt('Enter team member email:');
        if (email && SecurityUtils.validateEmail(email)) {
            const newMember = {
                id: Date.now(),
                name: email.split('@')[0],
                email: email,
                role: 'Member',
                avatar: null,
                status: 'offline'
            };
            this.team.push(newMember);
            this.saveTeam();
            this.renderTeam();
            
            if (typeof showNotification === 'function') {
                showNotification('Team member invited successfully!', 'success');
            }
        } else if (email) {
            alert('Please enter a valid email address');
        }
    },
    
    // Remove member
    removeMember(memberId) {
        if (confirm('Are you sure you want to remove this team member?')) {
            this.team = this.team.filter(m => m.id !== memberId);
            this.saveTeam();
            this.renderTeam();
        }
    }
};

// Global function aliases for HTML onclick handlers
function showTeam() {
    if (App && App.showTeam) {
        App.showTeam();
    } else if (TeamManager) {
        TeamManager.showTeam();
    }
}

function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function inviteMember() {
    if (TeamManager) {
        TeamManager.inviteMember();
    }
}

function showTeamOptions() {
    // Placeholder for team options menu
    console.log('Show team options');
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof TeamManager !== 'undefined') {
        TeamManager.init();
    }
});
