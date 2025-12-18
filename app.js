// app.js - Main JavaScript untuk Word Solver

// Kamus kata-kata (Malay & English)
const dictionaries = {
    malay: [
        // Kata 3 huruf
        'ada', 'air', 'api', 'aku', 'ibu', 'kita', 'kamu', 'mata', 'tangan', 'jalan',
        'rumah', 'buku', 'meja', 'kursi', 'lampu', 'pintu', 'jendela', 'dapur', 'kamar',
        'taman', 'besar', 'kecil', 'tinggi', 'pendek', 'panjang', 'lebar', 'dalam',
        
        // Kata 4 huruf
        'makan', 'minum', 'tidur', 'baca', 'tulis', 'dengar', 'lihat', 'bicara',
        'jalan', 'lari', 'main', 'nyanyi', 'tari', 'renang', 'lempar', 'tangkap',
        'bunga', 'pohon', 'daun', 'akar', 'batang', 'buah', 'sayur', 'nasi',
        
        // Kata 5 huruf
        'makanan', 'minuman', 'pakaian', 'sepatu', 'kaos', 'celana', 'baju',
        'jaket', 'topi', 'sekolah', 'kampus', 'kelas', 'guru', 'murid', 'pelajar',
        
        // Kata 6+ huruf
        'bermain', 'belajar', 'bekerja', 'kehidupan', 'masyarakat', 'pemerintah',
        'perusahaan', 'internet', 'website', 'teknologi', 'pendidikan'
    ],
    
    english: [
        // 3-letter words
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had', 'her',
        'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new',
        'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say',
        'she', 'too', 'use',
        
        // 4-letter words
        'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want',
        'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'make',
        'like', 'long', 'many', 'more', 'only', 'over', 'such', 'take', 'than', 'them',
        'well', 'were', 'what',
        
        // 5+ letter words
        'about', 'after', 'again', 'below', 'could', 'every', 'first', 'found', 'great',
        'house', 'large', 'learn', 'never', 'other', 'place', 'plant', 'point', 'right',
        'small', 'sound', 'spell', 'still', 'study', 'their', 'there', 'these', 'thing',
        'think', 'three', 'water', 'where', 'which', 'world', 'would', 'write'
    ]
};

// Application state
let currentLanguage = 'malay';
let currentLetters = Array(8).fill('');
let foundWords = [];

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Word Solver app initializing...');
    setupLetterInputs();
    setupEventListeners();
    generateRandomLetters();
    
    // Show app loaded message
    setTimeout(() => {
        showNotification('Word Solver sedia digunakan!');
    }, 500);
});

// Setup the 8 letter input boxes
function setupLetterInputs() {
    const letterGrid = document.getElementById('letterGrid');
    
    for (let i = 0; i < 8; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'letter-tile';
        input.maxLength = 1;
        input.placeholder = '?';
        input.dataset.index = i;
        
        input.addEventListener('input', function(e) {
            handleLetterInput(e, i);
        });
        
        input.addEventListener('keydown', function(e) {
            handleLetterKeydown(e, i);
        });
        
        letterGrid.appendChild(input);
    }
}

// Handle letter input
function handleLetterInput(event, index) {
    const input = event.target;
    let value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (value.length > 1) {
        value = value.charAt(0);
    }
    
    input.value = value;
    currentLetters[index] = value.toLowerCase();
    
    // Auto-focus next input
    if (value && index < 7) {
        document.querySelector(`.letter-tile[data-index="${index + 1}"]`).focus();
    }
    
    // Auto-search when all letters are filled
    const filledLetters = currentLetters.filter(l => l !== '');
    if (filledLetters.length >= 3) {
        findPossibleWords();
    }
}

// Handle backspace key
function handleLetterKeydown(event, index) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
        event.preventDefault();
        const prevInput = document.querySelector(`.letter-tile[data-index="${index - 1}"]`);
        prevInput.focus();
        prevInput.value = '';
        prevInput.classList.remove('filled');
        currentLetters[index - 1] = '';
    }
}

// Generate random letters
function generateRandomLetters() {
    const vowels = 'AEIOU';
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    const letters = [];
    
    // Add 3-4 vowels
    const vowelCount = Math.floor(Math.random() * 2) + 3;
    for (let i = 0; i < vowelCount; i++) {
        letters.push(vowels.charAt(Math.floor(Math.random() * vowels.length)));
    }
    
    // Add consonants to make 8 letters
    while (letters.length < 8) {
        letters.push(consonants.charAt(Math.floor(Math.random() * consonants.length)));
    }
    
    // Shuffle the letters
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    
    // Update the UI
    const inputs = document.querySelectorAll('.letter-tile');
    inputs.forEach((input, i) => {
        input.value = letters[i];
        currentLetters[i] = letters[i].toLowerCase();
    });
    
    // Find words with the new letters
    findPossibleWords();
}

// Find all possible words from current letters
function findPossibleWords() {
    const letters = currentLetters.filter(l => l !== '');
    if (letters.length < 3) {
        return;
    }
    
    // Show loading
    showLoading(true);
    
    // Get the appropriate dictionary
    const dictionary = dictionaries[currentLanguage];
    
    // Filter words that can be made from the letters
    const possibleWords = dictionary.filter(word => {
        // Check word length
        if (word.length < 3 || word.length > 8) return false;
        
        // Check if word can be formed from available letters
        const availableLetters = [...letters];
        
        for (const char of word) {
            const index = availableLetters.indexOf(char);
            if (index === -1) return false;
            availableLetters.splice(index, 1);
        }
        
        return true;
    });
    
    // Sort by length (longest first)
    possibleWords.sort((a, b) => b.length - a.length);
    
    // Update state and UI
    foundWords = possibleWords;
    updateWordList();
    
    // Hide loading
    setTimeout(() => {
        showLoading(false);
    }, 300);
}

// Update the word list display
function updateWordList() {
    const wordsList = document.getElementById('wordsList');
    const resultsCount = document.getElementById('resultsCount');
    
    if (foundWords.length === 0) {
        wordsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                <h3>Tiada kata ditemui</h3>
                <p>Cuba masukkan huruf yang berbeza</p>
            </div>
        `;
        resultsCount.textContent = '0';
        return;
    }
    
    // Update count
    resultsCount.textContent = foundWords.length.toString();
    
    // Build word list HTML
    let wordsHTML = '';
    foundWords.forEach(word => {
        const score = calculateWordScore(word);
        wordsHTML += `
            <div class="word-card">
                <span class="word-text word-length-${word.length}">${word}</span>
                <div>
                    <span style="background: #e3f2fd; color: #1a73e8; padding: 4px 12px; border-radius: 20px; font-weight: bold; margin-right: 10px;">
                        ${score}
                    </span>
                    <span style="background: #f1f3f4; color: #5f6368; padding: 4px 12px; border-radius: 20px;">
                        ${word.length} huruf
                    </span>
                </div>
            </div>
        `;
    });
    
    wordsList.innerHTML = wordsHTML;
}

// Calculate Scrabble-like score for a word
function calculateWordScore(word) {
    const letterScores = {
        'a': 1, 'b': 3, 'c': 3, 'd': 2, 'e': 1, 'f': 4, 'g': 2, 'h': 4,
        'i': 1, 'j': 8, 'k': 5, 'l': 1, 'm': 3, 'n': 1, 'o': 1, 'p': 3,
        'q': 10, 'r': 1, 's': 1, 't': 1, 'u': 1, 'v': 4, 'w': 4, 'x': 8,
        'y': 4, 'z': 10
    };
    
    return word.toLowerCase().split('').reduce((total, letter) => {
        return total + (letterScores[letter] || 0);
    }, 0);
}

// Setup event listeners for buttons
function setupEventListeners() {
    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            document.querySelectorAll('.lang-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update language
            currentLanguage = this.dataset.lang;
            
            // Update dictionary info
            const dictInfo = document.getElementById('dictionaryInfo');
            if (currentLanguage === 'malay') {
                dictInfo.textContent = ' | Kamus Bahasa Melayu';
            } else if (currentLanguage === 'english') {
                dictInfo.textContent = ' | English Dictionary';
            } else {
                dictInfo.textContent = ' | Both Dictionaries';
            }
            
            // Re-search with new language
            findPossibleWords();
        });
    });
    
    // Generate random letters button
    document.getElementById('generateBtn').addEventListener('click', generateRandomLetters);
    
    // Clear all button
    document.getElementById('clearBtn').addEventListener('click', function() {
        currentLetters = Array(8).fill('');
        document.querySelectorAll('.letter-tile').forEach(input => {
            input.value = '';
        });
        foundWords = [];
        updateWordList();
        document.querySelector('.letter-tile[data-index="0"]').focus();
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (!searchTerm) {
            updateWordList();
            return;
        }
        
        const filtered = foundWords.filter(word => 
            word.includes(searchTerm) || 
            searchTerm.split('').every(char => word.includes(char))
        );
        
        const tempWords = foundWords;
        foundWords = filtered;
        updateWordList();
        foundWords = tempWords;
    });
}

// Show/hide loading animation
function showLoading(show) {
    const loading = document.getElementById('loadingScreen');
    if (show) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);