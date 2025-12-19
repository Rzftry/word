// daily-challenges.js
// Daily Challenge System

class DailyChallenge {
    constructor() {
        this.storageKey = 'wordMaster_dailyChallenges';
        this.today = this.getTodayDate();
        this.initialize();
    }
    
    initialize() {
        // Ensure today's challenge exists
        const challenge = this.getTodayChallenge();
        if (!challenge) {
            this.generateTodayChallenge();
        }
    }
    
    getTodayDate() {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    generateTodayChallenge() {
        // Use date as seed for consistent daily challenge
        const seed = this.today;
        const letters = this.generateLettersFromSeed(seed);
        const targetScore = this.calculateTargetScore(letters);
        
        const challenge = {
            date: this.today,
            letters: letters,
            targetScore: targetScore,
            completed: false,
            userScore: 0,
            foundWords: [],
            completedTime: null,
            hintsUsed: 0
        };
        
        this.saveChallenge(challenge);
        return challenge;
    }
    
    generateLettersFromSeed(seed) {
        // Deterministic letter generation based on date
        let letters = [];
        const vowels = 'AEIOU';
        const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
        
        // Create a simple hash from the seed
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        
        // Use hash to select letters
        const hashStr = Math.abs(hash).toString();
        
        // Select 3-4 vowels
        const vowelCount = 3 + (parseInt(hashStr[0]) % 2);
        for (let i = 0; i < vowelCount; i++) {
            const index = parseInt(hashStr[i + 1]) % vowels.length;
            letters.push(vowels[index]);
        }
        
        // Select consonants to make 8 letters total
        const consonantCount = 8 - vowelCount;
        for (let i = 0; i < consonantCount; i++) {
            const index = parseInt(hashStr[i + vowelCount]) % consonants.length;
            letters.push(consonants[index]);
        }
        
        return letters.map(l => l.toLowerCase());
    }
    
    calculateTargetScore(letters) {
        // Base target based on letters
        let baseScore = 0;
        const highValue = ['q', 'z', 'x', 'j', 'k'];
        
        letters.forEach(letter => {
            if (highValue.includes(letter)) {
                baseScore += 20;
            } else if ('bcdfghlmnp'.includes(letter)) {
                baseScore += 8;
            } else {
                baseScore += 5;
            }
        });
        
        // Adjust for day of week (harder on weekends)
        const day = new Date().getDay();
        if (day === 0 || day === 6) { // Weekend
            baseScore = Math.floor(baseScore * 1.2);
        }
        
        return Math.max(50, Math.min(baseScore, 200));
    }
    
    getTodayChallenge() {
        const challenges = this.getAllChallenges();
        return challenges[this.today] || null;
    }
    
    getAllChallenges() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {};
    }
    
    saveChallenge(challenge) {
        const challenges = this.getAllChallenges();
        challenges[challenge.date] = challenge;
        localStorage.setItem(this.storageKey, JSON.stringify(challenges));
    }
    
    updateChallenge(score, foundWords, hintsUsed = 0) {
        const challenge = this.getTodayChallenge();
        if (!challenge) return;
        
        challenge.userScore = score;
        challenge.foundWords = foundWords;
        challenge.hintsUsed = hintsUsed;
        challenge.completed = score >= challenge.targetScore;
        
        if (challenge.completed) {
            challenge.completedTime = new Date().toISOString();
        }
        
        this.saveChallenge(challenge);
        
        // Update streak if completed
        if (challenge.completed) {
            this.updateStreak();
        }
    }
    
    getCurrentStreak() {
        const challenges = this.getAllChallenges();
        const dates = Object.keys(challenges).sort();
        
        let streak = 0;
        let currentDate = new Date(this.today);
        
        // Check consecutive completed days
        for (let i = 0; i < 365; i++) { // Max 1 year back
            const dateStr = currentDate.toISOString().split('T')[0];
            const challenge = challenges[dateStr];
            
            if (challenge && challenge.completed) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    updateStreak() {
        const streak = this.getCurrentStreak();
        localStorage.setItem('wordMaster_dailyStreak', streak.toString());
        return streak;
    }
    
    getLeaderboard() {
        // This would connect to a backend in production
        // For now, return mock data
        return [
            { rank: 1, name: 'WordMaster', score: 250, time: '2:30' },
            { rank: 2, name: 'LexiLover', score: 220, time: '3:15' },
            { rank: 3, name: 'ScrabbleKing', score: 210, time: '4:10' },
            // ... more entries
        ];
    }
    
    getCompletionRate() {
        const challenges = this.getAllChallenges();
        const completed = Object.values(challenges).filter(c => c.completed).length;
        const total = Object.keys(challenges).length;
        
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }
}

// Export for use in other files
window.DailyChallenge = DailyChallenge;