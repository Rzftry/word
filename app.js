// ====================
// WORD MASTER - APP.JS
// Live API Word Solver
// ====================

// App State
let appState = {
    currentLanguage: 'en',
    currentLetters: new Array(8).fill(''),
    foundWords: [],
    searchInProgress: false,
    lastSearchTime: 0,
    apiStats: {
        datamuse: { used: 0, available: 100000 },
        kateglo: { used: 0, available: 1000 },
        backup: { used: 0 }
    }
};

// API Configuration
const APIS = {
    datamuse: {
        name: 'Datamuse',
        url: (letters) => `https://api.datamuse.com/words?sp=${letters.join('')}&max=100`,
        parser: (data) => data.map(item => item.word.toLowerCase()),
        languages: ['en']
    },
    
    kateglo: {
        name: 'Kateglo',
        url: (letters) => `https://kateglo.com/api.php?format=json&phrase=${letters.join('')}`,
        parser: (data) => data.results ? data.results.map(item => item.phrase.toLowerCase()) : [],
        languages: ['my']
    },
    
    freeDictionary: {
        name: 'Free Dictionary',
        url: (word) => `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
        parser: (data) => data[0]?.word ? [data[0].word.toLowerCase()] : [],
        languages: ['en']
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Word Master Initializing...');
    
    initializeUI();
    setupEventListeners();
    loadBackupDictionary();
    generateRandomLetters();
    
    // Show welcome
    setTimeout(() => {
        showNotification('Word Master Ready! Live API search active.');
        updateAPIStatus('online');
    }, 1000);
});

// ====================
// UI INITIALIZATION
// ====================

function initializeUI() {
    createLetterTiles();
    updateLetterCount();
    updateUI();
}

function createLetterTiles() {
    const grid = document.getElementById('letterGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        const tile = document.createElement('input');
        tile.type = 'text';
        tile.className = 'letter-tile';
        tile.maxLength = 1;
        tile.placeholder = '?';
        tile.dataset.index = i;
        tile.autocomplete = 'off';
        
        // Input event with debounce
        tile.addEventListener('input', debounce((e) => {
            handleLetterInput(e, i);
        }, 300));
        
        // Key events
        tile.addEventListener('keydown', (e) => {
            handleLetterKeydown(e, i);
        });
        
        // Focus styling
        tile.addEventListener('focus', () => {
            tile.style.borderColor = 'var(--accent)';
        });
        
        tile.addEventListener('blur', () => {
            tile.style.borderColor = 'var(--primary)';
        });
        
        grid.appendChild(tile);
    }
}

// ====================
// EVENT HANDLERS
// ====================

function setupEventListeners() {
    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            appState.currentLanguage = this.dataset.lang;
            updateUI();
            performSearch();
        });
    });
    
    // Generate random letters
    document.getElementById('generateBtn').addEventListener('click', generateRandomLetters);
    
    // Clear all
    document.getElementById('clearBtn').addEventListener('click', clearAllLetters);
    
    // Advanced toggle
    document.getElementById('toggleAdvanced').addEventListener('click', function() {
        document.getElementById('advancedOptions').classList.toggle('show');
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterWords(searchInput.value.toLowerCase());
        }, 200));
    }
    
    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sortWords(this.dataset.sort);
        });
    });
    
    // Copy all button
    document.getElementById('copyAllBtn').addEventListener('click', copyAllWords);
    
    // Real-time search toggle
    const realTimeToggle = document.getElementById('realTimeSearch');
    if (realTimeToggle) {
        realTimeToggle.addEventListener('change', function() {
            if (this.checked) {
                performSearch();
            }
        });
    }
    
    // Min length slider
    const minLengthSlider = document.getElementById('minLength');
    const minLengthValue = document.getElementById('minLengthValue');
    if (minLengthSlider && minLengthValue) {
        minLengthSlider.addEventListener('input', function() {
            minLengthValue.textContent = this.value;
            performSearch();
        });
    }
    
    // API selector
    const apiSelector = document.getElementById('apiSelector');
    if (apiSelector) {
        apiSelector.addEventListener('change', performSearch);
    }
}

// ====================
// LETTER HANDLING
// ====================

function handleLetterInput(event, index) {
    const input = event.target;
    let value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (value.length > 1) {
        value = value.charAt(0);
    }
    
    input.value = value;
    appState.currentLetters[index] = value.toLowerCase();
    
    // Auto-focus next
    if (value && index < 7) {
        document.querySelector(`.letter-tile[data-index="${index + 1}"]`).focus();
    }
    
    updateLetterCount();
    
    // Auto-search if enabled
    const realTimeEnabled = document.getElementById('realTimeSearch')?.checked ?? true;
    if (realTimeEnabled && appState.currentLetters.filter(l => l).length >= 3) {
        performSearch();
    }
}

function handleLetterKeydown(event, index) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
        event.preventDefault();
        const prevInput = document.querySelector(`.letter-tile[data-index="${index - 1}"]`);
        prevInput.focus();
        prevInput.value = '';
        appState.currentLetters[index - 1] = '';
        updateLetterCount();
        
        if (document.getElementById('realTimeSearch')?.checked) {
            performSearch();
        }
    }
}

function generateRandomLetters() {
    const vowels = 'AEIOU';
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    let letters = [];
    
    // Ensure good vowel-consonant balance
    const vowelCount = Math.floor(Math.random() * 2) + 3; // 3-4 vowels
    const consonantCount = 8 - vowelCount;
    
    for (let i = 0; i < vowelCount; i++) {
        letters.push(vowels.charAt(Math.floor(Math.random() * vowels.length)));
    }
    
    for (let i = 0; i < consonantCount; i++) {
        letters.push(consonants.charAt(Math.floor(Math.random() * consonants.length)));
    }
    
    // Shuffle
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    
    // Update UI
    const inputs = document.querySelectorAll('.letter-tile');
    inputs.forEach((input, i) => {
        input.value = letters[i];
        appState.currentLetters[i] = letters[i].toLowerCase();
    });
    
    updateLetterCount();
    performSearch();
}

function clearAllLetters() {
    appState.currentLetters = new Array(8).fill('');
    document.querySelectorAll('.letter-tile').forEach(input => {
        input.value = '';
    });
    appState.foundWords = [];
    updateLetterCount();
    updateUI();
}

function updateLetterCount() {
    const count = appState.currentLetters.filter(l => l).length;
    const countElement = document.getElementById('letterCount');
    if (countElement) {
        countElement.textContent = `${count}/8 letters`;
        countElement.style.color = count >= 3 ? 'var(--success)' : 'var(--warning)';
    }
}

// ====================
// SEARCH FUNCTIONS
// ====================

async function performSearch() {
    if (appState.searchInProgress) return;
    
    const letters = appState.currentLetters.filter(l => l);
    if (letters.length < 3) {
        appState.foundWords = [];
        updateUI();
        return;
    }
    
    // Show loading
    showLoading(true, 'Searching APIs...');
    appState.searchInProgress = true;
    const searchStartTime = Date.now();
    
    try {
        let results = [];
        const selectedApi = document.getElementById('apiSelector')?.value || 'combined';
        
        // Search based on language and API selection
        if (appState.currentLanguage === 'en' || appState.currentLanguage === 'both') {
            results = await searchDatamuse(letters);
            appState.apiStats.datamuse.used++;
        }
        
        if (appState.currentLanguage === 'my' || appState.currentLanguage === 'both') {
            const malayResults = await searchBackupMalay(letters);
            results = [...results, ...malayResults];
            appState.apiStats.backup.used++;
        }
        
        // Remove duplicates and filter
        const minLength = parseInt(document.getElementById('minLength')?.value || 3);
        appState.foundWords = [...new Set(results)]
            .filter(word => word.length >= minLength && word.length <= 8)
            .filter(word => canFormWord(word, letters));
        
        // Calculate search time
        appState.lastSearchTime = (Date.now() - searchStartTime) / 1000;
        
    } catch (error) {
        console.error('Search failed:', error);
        // Fallback to backup
        appState.foundWords = searchBackupDictionary(letters);
        showNotification('Using offline dictionary');
    } finally {
        appState.searchInProgress = false;
        showLoading(false);
        updateUI();
        
        // Show notification if words found
        if (appState.foundWords.length > 0) {
            showNotification(`Found ${appState.foundWords.length} words in ${appState.lastSearchTime.toFixed(2)}s`);
        }
    }
}

async function searchDatamuse(letters) {
    try {
        const response = await fetch(APIS.datamuse.url(letters), {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error('API failed');
        
        const data = await response.json();
        return APIS.datamuse.parser(data);
    } catch (error) {
        console.warn('Datamuse failed, using backup');
        return searchBackupEnglish(letters);
    }
}

async function searchKateglo(letters) {
    try {
        const response = await fetch(APIS.kateglo.url(letters), {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error('API failed');
        
        const data = await response.json();
        return APIS.kateglo.parser(data);
    } catch (error) {
        console.warn('Kateglo failed, using backup');
        return searchBackupMalay(letters);
    }
}

function searchBackupEnglish(letters) {
    if (!window.backupDictionary || !window.backupDictionary.english) {
        return [];
    }
    
    return window.backupDictionary.english.filter(word => 
        word.length >= 3 && 
        word.length <= 8 && 
        canFormWord(word, letters)
    );
}

function searchBackupMalay(letters) {
    if (!window.backupDictionary || !window.backupDictionary.malay) {
        return [];
    }
    
    return window.backupDictionary.malay.filter(word => 
        word.length >= 3 && 
        word.length <= 8 && 
        canFormWord(word, letters)
    );
}

function searchBackupDictionary(letters) {
    const results = [];
    
    if (window.backupDictionary?.english) {
        results.push(...searchBackupEnglish(letters));
    }
    
    if (window.backupDictionary?.malay) {
        results.push(...searchBackupMalay(letters));
    }
    
    return [...new Set(results)];
}

function canFormWord(word, letters) {
    const lettersCopy = [...letters];
    
    for (const char of word.toLowerCase()) {
        const index = lettersCopy.indexOf(char);
        if (index === -1) return false;
        lettersCopy.splice(index, 1);
    }
    
    return true;
}

// ====================
// UI UPDATES
// ====================

function updateUI() {
    updateResultsCount();
    updateWordList();
    updateSearchStats();
    updateAPIStatus('online');
}

function updateResultsCount() {
    const countElement = document.getElementById('resultsCount');
    const sourceElement = document.getElementById('apiSource');
    
    if (countElement) {
        countElement.textContent = appState.foundWords.length;
    }
    
    if (sourceElement) {
        const source = appState.lastSearchTime > 0 ? 
            `(API: ${appState.lastSearchTime.toFixed(2)}s)` : 
            '(Offline)';
        sourceElement.textContent = source;
    }
}

function updateWordList() {
    const wordsList = document.getElementById('wordsList');
    if (!wordsList) return;
    
    if (appState.foundWords.length === 0) {
        const lettersCount = appState.currentLetters.filter(l => l).length;
        
        if (lettersCount < 3) {
            wordsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-keyboard"></i>
                    </div>
                    <h3>Enter at least 3 letters</h3>
                    <p>Type letters or click "Random Letters" to start</p>
                </div>
            `;
        } else {
            wordsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No words found</h3>
                    <p>Try different letters or check API status</p>
                    <div class="empty-tips">
                        <div class="tip">
                            <i class="fas fa-lightbulb"></i>
                            <span>Include more vowels (A, E, I, O, U)</span>
                        </div>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // Build word cards
    let wordsHTML = '';
    appState.foundWords.forEach((word, index) => {
        const score = calculateWordScore(word);
        const lengthClass = `word-length-${word.length}`;
        
        wordsHTML += `
            <div class="word-card" style="animation-delay: ${index * 0.05}s">
                <div class="word-content">
                    <span class="word-text ${lengthClass}">${word}</span>
                    <div class="word-details">
                        <span class="word-score">${score}</span>
                        <span class="word-length">${word.length}</span>
                    </div>
                </div>
                <button class="word-copy" onclick="copyWord('${word}')" title="Copy word">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `;
    });
    
    wordsList.innerHTML = wordsHTML;
}

function updateSearchStats() {
    const searchTimeElement = document.getElementById('searchTime');
    const avgScoreElement = document.getElementById('avgScore');
    
    if (searchTimeElement) {
        searchTimeElement.textContent = `${appState.lastSearchTime.toFixed(2)}s`;
    }
    
    if (avgScoreElement && appState.foundWords.length > 0) {
        const avgScore = appState.foundWords.reduce((sum, word) => 
            sum + calculateWordScore(word), 0) / appState.foundWords.length;
        avgScoreElement.textContent = avgScore.toFixed(1);
    }
}

function filterWords(searchTerm) {
    if (!searchTerm) {
        updateWordList();
        return;
    }
    
    const filtered = appState.foundWords.filter(word => 
        word.includes(searchTerm.toLowerCase())
    );
    
    const temp = appState.foundWords;
    appState.foundWords = filtered;
    updateWordList();
    appState.foundWords = temp;
}

function sortWords(sortType) {
    switch(sortType) {
        case 'length-desc':
            appState.foundWords.sort((a, b) => b.length - a.length);
            break;
        case 'score-desc':
            appState.foundWords.sort((a, b) => 
                calculateWordScore(b) - calculateWordScore(a)
            );
            break;
        case 'alpha':
            appState.foundWords.sort();
            break;
        case 'common':
            // Sort by word frequency (simple heuristic)
            appState.foundWords.sort((a, b) => {
                const commonWords = ['the', 'and', 'you', 'that', 'was', 'for', 'are'];
                const aIndex = commonWords.indexOf(a);
                const bIndex = commonWords.indexOf(b);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.length - b.length;
            });
            break;
    }
    
    updateWordList();
}

// ====================
// UTILITY FUNCTIONS
// ====================

function calculateWordScore(word) {
    const scores = {
        'a':1,'b':3,'c':3,'d':2,'e':1,'f':4,'g':2,'h':4,'i':1,'j':8,'k':5,'l':1,
        'm':3,'n':1,'o':1,'p':3,'q':10,'r':1,'s':1,'t':1,'u':1,'v':4,'w':4,'x':8,
        'y':4,'z':10
    };
    
    return word.toLowerCase().split('').reduce((total, letter) => {
        return total + (scores[letter] || 0);
    }, 0);
}

function showLoading(show, message = '') {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    const subtext = document.getElementById('loadingSubtext');
    const progress = document.getElementById('progressBar');
    
    if (!overlay) return;
    
    if (show) {
        if (text) text.textContent = message || 'Searching for words...';
        if (subtext) subtext.textContent = 'Checking multiple APIs';
        if (progress) progress.style.width = '0%';
        
        overlay.classList.add('active');
        
        // Animate progress bar
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
                return;
            }
            width += 10;
            if (progress) progress.style.width = width + '%';
        }, 300);
        
        overlay._progressInterval = interval;
    } else {
        if (progress) progress.style.width = '100%';
        
        if (overlay._progressInterval) {
            clearInterval(overlay._progressInterval);
        }
        
        setTimeout(() => {
            overlay.classList.remove('active');
            if (progress) progress.style.width = '0%';
        }, 300);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notificationText');
    const icon = document.querySelector('.notification-icon');
    
    if (!notification || !text) return;
    
    // Set message and icon
    text.textContent = message;
    
    if (icon) {
        icon.className = 'notification-icon fas ' + (
            type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
            type === 'warning' ? 'fa-exclamation-triangle' :
            'fa-info-circle'
        );
    }
    
    // Show notification
    notification.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateAPIStatus(status) {
    const statusElement = document.getElementById('apiStatus');
    if (!statusElement) return;
    
    if (status === 'online') {
        statusElement.innerHTML = '<i class="fas fa-wifi"></i> API Online';
        statusElement.className = 'status-online';
    } else {
        statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> API Offline';
        statusElement.className = 'status-offline';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function copyWord(word) {
    navigator.clipboard.writeText(word).then(() => {
        showNotification(`Copied: ${word}`);
    });
}

function copyAllWords() {
    if (appState.foundWords.length === 0) return;
    
    const text = appState.foundWords.join(', ');
    navigator.clipboard.writeText(text).then(() => {
        showNotification(`Copied ${appState.foundWords.length} words to clipboard`);
    });
}

// ====================
// LOAD BACKUP DICTIONARY
// ====================

function loadBackupDictionary() {
    // This will be loaded from words-cache.js
    if (!window.backupDictionary) {
        window.backupDictionary = {
            english: [],
            malay: []
        };
        console.warn('Backup dictionary not loaded');
    }
}

// ====================
// GLOBAL FUNCTIONS
// ====================

// Make functions available globally
window.copyWord = copyWord;
window.performSearch = performSearch;
// app.js - Enhanced with new features
// Keep your existing app.js code but add these new functions:

class EnhancedSolver {
    constructor() {
        // Your existing initialization
        this.initializeEnhancedFeatures();
    }
    
    initializeEnhancedFeatures() {
        // Word Definitions
        this.setupWordDefinitions();
        
        // Pattern Search
        this.setupPatternSearch();
        
        // Save/Load Sets
        this.setupSaveLoad();
        
        // Export Features
        this.setupExport();
    }
    
    setupWordDefinitions() {
        // Add click handler to word cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.word-card')) {
                const wordElement = e.target.closest('.word-card').querySelector('.word-text');
                if (wordElement) {
                    this.showWordDefinition(wordElement.textContent);
                }
            }
        });
    }
    
    async showWordDefinition(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await response.json();
            
            if (data[0]?.meanings[0]?.definitions[0]) {
                const definition = data[0].meanings[0].definitions[0].definition;
                this.showDefinitionModal(word, definition);
            }
        } catch (error) {
            console.log('Could not fetch definition');
        }
    }
    
    setupPatternSearch() {
        // Add pattern search input
        const searchBox = document.getElementById('searchInput');
        if (searchBox) {
            searchBox.placeholder = "Search words or use pattern (e.g., C?T = CAT, COT, CUT)";
            
            searchBox.addEventListener('input', (e) => {
                const pattern = e.target.value;
                if (pattern.includes('?')) {
                    this.performPatternSearch(pattern);
                }
            });
        }
    }
    
    performPatternSearch(pattern) {
        // Convert pattern like "C?T" to regex
        const regexPattern = pattern.replace(/\?/g, '.').toLowerCase();
        const regex = new RegExp(`^${regexPattern}$`);
        
        // Filter current words
        const filtered = this.currentWords.filter(word => regex.test(word));
        this.displayFilteredWords(filtered);
    }
    
    setupSaveLoad() {
        // Add save/load buttons to UI
        const saveBtn = document.getElementById('saveSetBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveLetterSet());
        }
        
        // Load saved sets dropdown
        this.loadSavedSets();
    }
    
    saveLetterSet() {
        const letters = this.currentLetters.filter(l => l);
        const name = prompt('Enter a name for this letter set:', 'My Letter Set');
        
        if (name && letters.length > 0) {
            const sets = JSON.parse(localStorage.getItem('savedLetterSets') || '[]');
            sets.push({
                name: name,
                letters: letters,
                date: new Date().toISOString()
            });
            
            localStorage.setItem('savedLetterSets', JSON.stringify(sets));
            this.loadSavedSets();
        }
    }
    
    loadSavedSets() {
        const sets = JSON.parse(localStorage.getItem('savedLetterSets') || '[]');
        // Create dropdown UI
    }
    
    setupExport() {
        // Add export button
        const exportBtn = document.getElementById('exportBtn');
        if (!exportBtn) {
            const btn = document.createElement('button');
            btn.id = 'exportBtn';
            btn.innerHTML = '<i class="fas fa-download"></i> Export';
            btn.className = 'btn solver-btn';
            btn.addEventListener('click', () => this.exportResults());
            
            document.querySelector('.solver-controls').appendChild(btn);
        }
    }
    
    exportResults() {
        const results = {
            letters: this.currentLetters.filter(l => l),
            words: this.currentWords,
            timestamp: new Date().toISOString()
        };
        
        // Export as JSON
        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `word-solver-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Integrate with existing app
// Add this to your existing initialization