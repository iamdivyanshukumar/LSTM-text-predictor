document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text-input');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const numPredictionsSelect = document.getElementById('num-predictions');
    const themeToggle = document.getElementById('theme-toggle');
    
    let debounceTimer;
    let currentPredictions = [];
    let highlightedIndex = -1;

    // Initialize theme
    function initTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const themeIcon = document.getElementById('theme-icon');
        
        if (currentTheme === 'dark') {
            themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
        } else {
            themeIcon.setAttribute('d', 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z');
        }
    }

    // Theme toggle
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon();
    });

    // Get predictions from server
    async function getPredictions(text) {
        const numPredictions = parseInt(numPredictionsSelect.value);
        
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    num_predictions: numPredictions
                })
            });
            
            const data = await response.json();
            return data.predictions || [];
        } catch (error) {
            console.error('Error fetching predictions:', error);
            return [];
        }
    }

    // Update suggestions UI
    function updateSuggestions(predictions) {
        suggestionsContainer.innerHTML = '';
        currentPredictions = predictions;
        highlightedIndex = -1;
        
        if (predictions.length > 0) {
            suggestionsContainer.style.display = 'flex';
            
            predictions.forEach((prediction, index) => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-item';
                chip.textContent = prediction;
                chip.addEventListener('click', () => acceptSuggestion(index));
                suggestionsContainer.appendChild(chip);
            });
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }

    // Accept suggestion
    function acceptSuggestion(index) {
        if (index >= 0 && index < currentPredictions.length) {
            const suggestion = currentPredictions[index];
            const cursorPos = textInput.selectionStart;
            const text = textInput.value;
            
            // Insert the suggestion at cursor position
            textInput.value = text.substring(0, cursorPos) + suggestion + ' ' + text.substring(cursorPos);
            
            // Move cursor to end of inserted word
            const newCursorPos = cursorPos + suggestion.length + 1;
            textInput.selectionStart = textInput.selectionEnd = newCursorPos;
            
            // Hide suggestions
            suggestionsContainer.style.display = 'none';
            currentPredictions = [];
            highlightedIndex = -1;
            
            // Focus back on input
            textInput.focus();
        }
    }

    // Highlight suggestion
    function highlightSuggestion(index) {
        const chips = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        chips.forEach((chip, i) => {
            if (i === index) {
                chip.classList.add('active');
                highlightedIndex = index;
            } else {
                chip.classList.remove('active');
            }
        });
    }

    // Debounced function to get predictions
    function debouncedGetPredictions() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const text = textInput.value;
            
            // Get predictions even without space if there's text
            if (text.length > 0) {
                const predictions = await getPredictions(text);
                updateSuggestions(predictions);
            } else {
                suggestionsContainer.style.display = 'none';
                currentPredictions = [];
            }
        }, 200); // 200ms debounce time
    }

    // Event listeners
    textInput.addEventListener('input', debouncedGetPredictions);
    
    textInput.addEventListener('keydown', function(e) {
        if (suggestionsContainer.style.display === 'flex') {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    acceptSuggestion(highlightedIndex);
                } else {
                    acceptSuggestion(0); // Accept first suggestion by default
                }
            } else if (e.key === 'ArrowRight') {
                // Accept first suggestion
                if (currentPredictions.length > 0) {
                    e.preventDefault();
                    acceptSuggestion(0);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const newIndex = (highlightedIndex + 1) % currentPredictions.length;
                highlightSuggestion(newIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const newIndex = (highlightedIndex - 1 + currentPredictions.length) % currentPredictions.length;
                highlightSuggestion(newIndex);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                suggestionsContainer.style.display = 'none';
                currentPredictions = [];
                highlightedIndex = -1;
            }
        } else if (e.key === 'Tab' && textInput.value.length > 0) {
            // Show suggestions on Tab if there's text
            e.preventDefault();
            debouncedGetPredictions();
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!textInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });

    // Initialize
    initTheme();
});