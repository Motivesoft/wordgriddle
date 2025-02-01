// Fetch and display word list
async function fetchWordList(category) {
    showBusyIndicator();

    // Get the list of words
    const response = await fetch(`/api/${category}/words`);
    const words = await response.json();

    // Ugly bit of hard-coding
    const selectable = category !== "dictionary";

    // Populate the word list panel with the words and a checkbox for each one
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = words.words.map(word => 
        selectable ? `<div><input type="checkbox" value="${word}">&nbsp;${word}</div>` : `<div>${word}</div>`
    ).join('');

    // Display the number of words in the list
    const wordCountDisplay = document.getElementById('wordCountDisplay');
    wordCountDisplay.innerHTML = `Word count: ${words.wordCount}`;
    hideBusyIndicator();
}

// Download word list - as text/plain (the default on the server)
function downloadWordList(category) {
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
        });
}

// Upload word list - text/plain (the default on the server)
function uploadWordList(category) {
    const file = document.getElementById('uploadFile').files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch(`/api/${category}/upload`, {
        method: 'POST',
        body: formData
    }).then(() => fetchWordList(category));
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

// Modal dialog functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Busy spinner
function showBusyIndicator() {
    document.getElementById('busy-indicator').style.display = 'block';
}

function hideBusyIndicator() {
    document.getElementById('busy-indicator').style.display = 'none';
}

