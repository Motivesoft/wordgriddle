// Fetch and display word list
async function fetchWordList(category) {
    // Get the list of words
    const response = await fetch(`/api/${category}/words`);
    const words = await response.json();

    // Populate the word list panel with the words and a checkbox for each one
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = words.words.map(word => 
        `<div><input type="checkbox" value="${word}">&nbsp;${word}</div>`
    ).join('');

    // Display the number of words in the list
    const wordCountDisplay = document.getElementById('wordCountDisplay');
    wordCountDisplay.innerHTML = `Word count: ${words.wordCount}`;
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
function deleteSelectedWords(category) {
    const selectedWords = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    fetch(`/api/${category}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords })
    }).then(() => fetchWordList(category));
}

// Insert new words
function insertNewWords(category) {
    const newWords = document.getElementById('newWords').value.split('\n').filter(word => word.trim() !== '');

    fetch(`/api/${category}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: newWords })
    }).then(() => {
        fetchWordList(category);
        document.getElementById('newWords').value = '';
    });
}
