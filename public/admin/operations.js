// Fetch and display word list
async function fetchWordList(category) {
    showBusyIndicator('busy-indicator');

    // Get the list of words
    const response = await fetch(`/api/${category}/words`);
    const words = await response.json();

    // Ugly bit of hard-coding
    const selectable = category !== "dictionary";

    // Populate the word list panel with the words and a checkbox for each one
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = words.words.map(word => 
        selectable ? `<div><label><input type="checkbox" value="${word}">${word}</label></div>` : `<div><label>${word}</label></div>`
    ).join('');

    // Display the number of words in the list
    const wordCountDisplay = document.getElementById('wordCountDisplay');
    wordCountDisplay.innerHTML = `Word count: ${words.wordCount}`;
    hideBusyIndicator('busy-indicator');
}

// Download word list - as text/plain (the default on the server)
function downloadWordList(category) {
    showBusyIndicator('busy-indicator');
    fetch(`/api/${category}/download`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${category}_word_list.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }).finally(() => {
            hideBusyIndicator('busy-indicator');
        });
}

// Upload word list - text/plain (the default on the server)
function uploadWordList(category) {
    showBusyIndicator('busy-indicator');
    const file = document.getElementById('uploadFile').files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch(`/api/${category}/upload`, {
        method: 'POST',
        body: formData
    }).then(() => fetchWordList(category)
    ).finally(() => {
        hideBusyIndicator('busy-indicator');
    });
}

// Delete selected words
function deleteWords(category, wordList) {
    // Defensive move. Caller should check and notify user
    if (wordList.length === 0) {
        console.log("Call to deleteWords with no words provided")
        return;
    }

    fetch(`/api/${category}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: wordList })
    }).then(() => fetchWordList(category));
}

// Insert new words
function insertWords(category, wordList) {
    // Defensive move. Caller should check and notify user
    if (wordList === undefined || wordList.length === 0) {
        console.log("Call to insertWords with no words provided")
        return;
    }

    fetch(`/api/${category}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: wordList })
    }).then(() => {
        fetchWordList(category);
    });
}

// Puzzle operations

// Fetch and display puzzle list
async function fetchPuzzleList() {
    showBusyIndicator('busy-indicator');

    // Get the list of words
    const response = await fetch(`/api/designer/puzzles`);
    const puzzleData = await response.json();

    // Populate the panel with the puzzles and a checkbox for each one
    const puzzleList = document.getElementById('puzzleList');
    puzzleList.innerHTML = puzzleData.puzzles.map(puzzle => 
        `<div><label><input type="checkbox" value="${puzzle.id}">${puzzle.title}</label></div>`
    ).join('');

    hideBusyIndicator('busy-indicator');
}

// Download puzzle list - as application/json (the default on the server)
function downloadPuzzleList() {
    fetch(`/api/designer/download`)
        .then(response => response.json())
        .then(data => {
            const jsonString = JSON.stringify(data, null, 2);
      
            // Create a Blob with the JSON data
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Create a temporary URL for the Blob
            const url = URL.createObjectURL(blob);
            
            // Create a temporary anchor element and trigger the download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'puzzle_list.json';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }).catch((error) => {
            alert("Error downloading puzzle list");
        });
}

// Upload word list - text/plain (the default on the server)
function uploadPuzzleList() {
    const file = document.getElementById('uploadFile').files[0];
    const formData = new FormData();
    formData.append('file', file);

    // TODO do we need something like this?
    //      headers: {'Content-Type': 'application/json'},
    fetch(`/api/designer/upload`, {
        method: 'POST',
        body: formData
    }).then(() => fetchWordList(category));
}

