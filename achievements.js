// achievements.js
// Achievements System

class AchievementsSystem {
    constructor() {
        this.achievements = this.getAllAchievements();
        this.loadUserProgress();
    }
    
    getAllAchievements() {
        return [
            // Word Count Achievements
            {
                id: 'first_words',
                name: 'Getting Started',
                description: 'Find your first 10 words',
                icon: '🎯',
                category: 'words',
                requirement: { type: 'word_count', target: 10 },
                points: 10,
                unlocked: false
            },
            {
                id: 'word_collector',
                name: 'Word Collector',
                description: 'Find 100 words',
                icon: '📚',
                category: 'words',
                requirement: { type: 'word_count', target: 100 },
                points: 25,
                unlocked: false
            },
            {
                id: 'word_master',
                name: 'Word Master',
                description: 'Find 500 words',
                icon: '👑',
                category: 'words',
                requirement: { type: 'word_count', target: 500 },
                points: 50,
                unlocked: false
            },
            {
                id: 'vocabulary_expert',
                name: 'Vocabulary Expert',
                description: 'Find 1000 words',
                icon: '🏆',
                category: 'words',
                requirement: { type: 'word_count', target: 1000 },
                points: 100,
                unlocked: false
            },
            
            // Score Achievements
            {
                id: 'first_score',
                name: 'First Points',
                description: 'Score your first 50 points',
                icon: '⭐',
                category: 'score',
                requirement: { type: 'total_score', target: 50 },
                points: 10,
                unlocked: false
            },
            {
                id: 'high_scorer',
                name: 'High Scorer',
                description: 'Score 500 total points',
                icon: '💎',
                category: 'score',
                requirement: { type: 'total_score', target: 500 },
                points: 30,
                unlocked: false
            },
            {
                id: 'point_master',
                name: 'Point Master',
                description: 'Score 2000 total points',
                icon: '💫',
                category: 'score',
                requirement: { type: 'total_score', target: 2000 },
                points: 75,
                unlocked: false
            },
            
            // Game Mode Achievements
            {
                id: 'daily_streak_3',
                name: 'Consistent Player',
                description: 'Complete daily challenge 3 days in a row',
                icon: '🔥',
                category: 'daily',
                requirement: { type: 'daily_streak', target: 3 },
                points: 20,
                unlocked: false
            },
            {
                id: 'daily_streak_7',
                name: 'Weekly Warrior',
                description: 'Complete daily challenge 7 days in a row',
                icon: '⚡',
                category: 'daily',
                requirement: { type: 'daily_streak', target: 7 },
                points: 50,
                unlocked: false
            },
            {
                id: 'daily_streak_30',
                name: 'Month Master',
                description: 'Complete daily challenge 30 days in a row',
                icon: '🌟',
                category: 'daily',
                requirement: { type: 'daily_streak', target: 30 },
                points: 150,
                unlocked: false
            },
            
            // Special Achievements
            {
                id: 'bingo',
                name: 'Bingo!',
                description: 'Find a 7-letter word',
                icon: '🎰',
                category: 'special',
                requirement: { type: 'word_length', target: 7 },
                points: 25,
                unlocked: false
            },
            {
                id: 'perfect_game',
                name: 'Perfect Game',
                description: 'Find all possible words in a game',
                icon: '💯',
                category: 'special',
                requirement: { type: 'perfect_game', target: 1 },
                points: 40,
                unlocked: false
            },
            {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Find 10 words in under 60 seconds',
                icon: '⚡',
                category: 'special',
                requirement: { type: 'speed_challenge', target: 10 },
                points: 30,
                unlocked: false
            },
            {
                id: 'no_hints',
                name: 'Independent Player',
                description: 'Complete a game without using hints',
                icon: '🦅',
                category: 'special',
                requirement: { type: 'no_hints', target: 1 },
                points: 15,
                unlocked: false
            },
            
            // Difficulty Achievements
            {
                id: 'hard_mode',
                name: 'Challenge Accepted',
                description: 'Complete a game on Hard difficulty',
                icon: '💪',
                category: 'difficulty',
                requirement: { type: 'hard_complete', target: 1 },
                points: 20,
                unlocked: false
            },
            {
                id: 'expert_mode',
                name: 'Word Expert',
                description: 'Complete a game on Expert difficulty',
                icon: '🧠',
                category: 'difficulty',
                requirement: { type: 'expert_complete', target: 1 },
                points: 50,
                unlocked: false
            }
        ];
    }
    
    loadUserProgress() {
        const saved = localStorage.getItem('wordMaster_achievements');
        if (saved) {
            const userAchievements = JSON.parse(saved);
            
            // Merge with default achievements
            this.achievements = this.achievements.map(achievement => {
                const userAchievement = userAchievements.find(a => a.id === achievement.id);
                return userAchievement ? { ...achievement, ...userAchievement } : achievement;
            });
        }
    }
    
    saveUserProgress() {
        localStorage.setItem('wordMaster_achievements', JSON.stringify(this.achievements));
    }
    
    checkAchievements(gameStats) {
        const newlyUnlocked = [];
        
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && this.checkRequirement(achievement.requirement, gameStats)) {
                achievement.unlocked = true;
                achievement.unlockDate = new Date().toISOString();
                newlyUnlocked.push(achievement);
            }
        });
        
        if (newlyUnlocked.length > 0) {
            this.saveUserProgress();
        }
        
        return newlyUnlocked;
    }
    
    checkRequirement(requirement, stats) {
        switch(requirement.type) {
            case 'word_count':
                return stats.totalWords >= requirement.target;
                
            case 'total_score':
                return stats.totalScore >= requirement.target;
                
            case 'daily_streak':
                const daily = new DailyChallenge();
                return daily.getCurrentStreak() >= requirement.target;
                
            case 'word_length':
                // This would need additional tracking
                return false;
                
            case 'perfect_game':
                // This would need additional tracking
                return false;
                
            case 'speed_challenge':
                // This would need additional tracking
                return false;
                
            case 'no_hints':
                // This would need additional tracking
                return false;
                
            case 'hard_complete':
            case 'expert_complete':
                // This would need additional tracking
                return false;
                
            default:
                return false;
        }
    }
    
    getUserAchievements() {
        return this.achievements.map(ach => ({
            ...ach,
            progress: this.getAchievementProgress(ach)
        }));
    }
    
    getAchievementProgress(achievement) {
        const stats = this.loadStats();
        
        switch(achievement.requirement.type) {
            case 'word_count':
                const progress = Math.min(stats.totalWords / achievement.requirement.target * 100, 100);
                return `${Math.round(progress)}%`;
                
            case 'total_score':
                const scoreProgress = Math.min(stats.totalScore / achievement.requirement.target * 100, 100);
                return `${Math.round(scoreProgress)}%`;
                
            case 'daily_streak':
                const daily = new DailyChallenge();
                const streak = daily.getCurrentStreak();
                const streakProgress = Math.min(streak / achievement.requirement.target * 100, 100);
                return `${Math.round(streakProgress)}%`;
                
            default:
                return '0%';
        }
    }
    
    loadStats() {
        const saved = localStorage.getItem('wordMaster_stats');
        return saved ? JSON.parse(saved) : {
            totalWords: 0,
            totalScore: 0,
            gamesPlayed: 0
        };
    }
    
    getTotalPoints() {
        return this.achievements
            .filter(a => a.unlocked)
            .reduce((total, achievement) => total + achievement.points, 0);
    }
    
    getCompletionPercentage() {
        const unlocked = this.achievements.filter(a => a.unlocked).length;
        const total = this.achievements.length;
        return Math.round((unlocked / total) * 100);
    }
    
    getRecentAchievements(count = 5) {
        return this.achievements
            .filter(a => a.unlocked && a.unlockDate)
            .sort((a, b) => new Date(b.unlockDate) - new Date(a.unlockDate))
            .slice(0, count);
    }
    
    getNextAchievements() {
        return this.achievements
            .filter(a => !a.unlocked)
            .sort((a, b) => a.requirement.target - b.requirement.target)
            .slice(0, 3);
    }
    
    resetAchievements() {
        this.achievements = this.getAllAchievements();
        this.saveUserProgress();
        return this.achievements;
    }
}

// Export
window.AchievementsSystem = AchievementsSystem;