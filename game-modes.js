// game-modes.js
// Additional Game Modes

class GameModes {
    constructor() {
        this.modes = {
            timed: {
                name: 'Timed Challenge',
                description: 'Find as many words as possible before time runs out!',
                difficulties: [
                    { name: 'Easy', time: 120, letters: 'easy' },
                    { name: 'Medium', time: 90, letters: 'medium' },
                    { name: 'Hard', time: 60, letters: 'hard' }
                ]
            },
            target: {
                name: 'Score Target',
                description: 'Reach the target score using the given letters!',
                difficulties: [
                    { name: 'Easy', target: 50, letters: 'easy' },
                    { name: 'Medium', target: 100, letters: 'medium' },
                    { name: 'Hard', target: 200, letters: 'hard' }
                ]
            },
            unlimited: {
                name: 'Unlimited Practice',
                description: 'Practice with random letters, no time limit',
                difficulties: [
                    { name: 'Easy', letters: 'easy' },
                    { name: 'Medium', letters: 'medium' },
                    { name: 'Hard', letters: 'hard' }
                ]
            },
            survival: {
                name: 'Survival Mode',
                description: 'Keep finding words until you run out of time!',
                difficulties: [
                    { name: 'Easy', baseTime: 30, timePerWord: 5 },
                    { name: 'Medium', baseTime: 20, timePerWord: 3 },
                    { name: 'Hard', baseTime: 15, timePerWord: 2 }
                ]
            }
        };
    }
    
    getModeConfig(modeName, difficulty = 'medium') {
        const mode = this.modes[modeName];
        if (!mode) return null;
        
        const diffConfig = mode.difficulties.find(d => 
            d.name.toLowerCase() === difficulty.toLowerCase()
        ) || mode.difficulties[0];
        
        return {
            ...mode,
            difficulty: diffConfig
        };
    }
    
    generateGameSettings(modeName, difficulty = 'medium') {
        const config = this.getModeConfig(modeName, difficulty);
        if (!config) return null;
        
        const settings = {
            mode: modeName,
            difficulty: difficulty,
            letters: this.generateLetters(config.difficulty.letters || 'medium'),
            ...config.difficulty
        };
        
        return settings;
    }
    
    generateLetters(difficulty) {
        const vowels = 'AEIOU';
        const commonConsonants = 'BCDFGHJKLMNPQRSTVWXYZ';
        const rareConsonants = 'QZXJKVWY';
        
        let letters = [];
        
        switch(difficulty) {
            case 'easy':
                // More vowels, common letters
                letters = [
                    ...this.selectRandom(vowels, 4),
                    ...this.selectRandom(commonConsonants, 4)
                ];
                break;
                
            case 'medium':
                // Balanced
                letters = [
                    ...this.selectRandom(vowels, 3),
                    ...this.selectRandom(commonConsonants, 5)
                ];
                break;
                
            case 'hard':
                // More consonants, include rare letters
                letters = [
                    ...this.selectRandom(vowels, 2),
                    ...this.selectRandom(commonConsonants, 4),
                    ...this.selectRandom(rareConsonants, 2)
                ];
                break;
                
            default:
                letters = this.selectRandom(vowels + commonConsonants, 8);
        }
        
        // Shuffle
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        
        return letters.map(l => l.toLowerCase());
    }
    
    selectRandom(pool, count) {
        const result = [];
        const poolArr = pool.split('');
        
        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * poolArr.length);
            result.push(poolArr[index]);
        }
        
        return result;
    }
    
    calculateScore(word, modeSettings) {
        const baseScore = this.calculateBaseScore(word);
        
        // Apply mode-specific multipliers
        switch(modeSettings.mode) {
            case 'timed':
                // Bonus for speed?
                return baseScore;
                
            case 'target':
                return baseScore;
                
            case 'survival':
                // Extra points for survival mode
                return Math.floor(baseScore * 1.2);
                
            default:
                return baseScore;
        }
    }
    
    calculateBaseScore(word) {
        const scores = {
            'a':1,'b':3,'c':3,'d':2,'e':1,'f':4,'g':2,'h':4,'i':1,'j':8,'k':5,'l':1,
            'm':3,'n':1,'o':1,'p':3,'q':10,'r':1,'s':1,'t':1,'u':1,'v':4,'w':4,'x':8,
            'y':4,'z':10
        };
        
        let total = 0;
        for (const letter of word.toLowerCase()) {
            total += scores[letter] || 0;
        }
        
        // Length bonus
        if (word.length >= 7) {
            total *= 2; // Bingo bonus
        } else if (word.length >= 5) {
            total = Math.floor(total * 1.5);
        }
        
        return total;
    }
    
    validateWord(word, letters, foundWords = []) {
        // Basic validation
        if (word.length < 3) return false;
        if (foundWords.includes(word)) return false;
        
        // Check if word can be formed from letters
        const lettersCopy = [...letters];
        for (const char of word.toLowerCase()) {
            const index = lettersCopy.indexOf(char);
            if (index === -1) return false;
            lettersCopy.splice(index, 1);
        }
        
        // Check dictionary (simplified)
        return this.isValidDictionaryWord(word);
    }
    
    isValidDictionaryWord(word) {
        // Check in backup dictionary
        if (window.backupDictionary) {
            const allWords = [
                ...window.backupDictionary.english,
                ...window.backupDictionary.malay
            ];
            if (allWords.includes(word.toLowerCase())) {
                return true;
            }
        }
        
        // Could add API check here
        return true; // Simplified for now
    }
    
    getGameInstructions(modeName) {
        const instructions = {
            timed: `Find as many words as you can before the timer runs out!\n\n• Each word must be at least 3 letters\n• Words are scored based on letter values\n• Longer words give bonus points!`,
            
            target: `Reach the target score using the given letters!\n\n• Find words to accumulate points\n• Reach the target score to win\n• Try to do it as quickly as possible!`,
            
            unlimited: `Practice with no time pressure!\n\n• Find as many words as you can\n• No time limit\n• Perfect for learning new words`,
            
            survival: `Keep finding words to stay alive!\n\n• Start with limited time\n• Each word found adds more time\n• Game ends when time runs out!`,
            
            daily: `Complete today's special challenge!\n\n• Same letters for everyone today\n• Complete to maintain your streak\n• Check the leaderboard!`
        };
        
        return instructions[modeName] || 'Find words from the given letters!';
    }
    
    getDifficultyDescription(difficulty) {
        const descriptions = {
            easy: 'More vowels, common letters. Great for beginners!',
            medium: 'Balanced mix. Perfect for regular practice.',
            hard: 'Challenging letters. Test your vocabulary!',
            expert: 'High-value letters. For word masters only!'
        };
        
        return descriptions[difficulty] || '';
    }
}

// Export
window.GameModes = GameModes;