// Fetch and display word list
async function fetchWordList() {
    const response = await fetch('/api/bonus/words');
    console.log("Fetch word list: ", response);

    const words = await response.json();
    console.log("Words: ", words);
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = words.words.map(word => 
        `<div><input type="checkbox" value="${word}"> ${word}</div>`
    ).join('');
}

// Download word list
function downloadWordList() {
    fetch('/api/bonus/download')
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'bonus_word_list.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        });
}

// Upload word list
function uploadWordList() {
    const file = document.getElementById('uploadFile').files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/bonus/upload', {
        method: 'POST',
        body: formData
    }).then(() => fetchWordList());
}

// Delete selected words
function deleteSelectedWords() {
    const selectedWords = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    fetch('/api/bonus/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords })
    }).then(() => fetchWordList());
}

// Insert new words
function insertNewWords() {
    const newWords = document.getElementById('newWords').value.split('\n').filter(word => word.trim() !== '');

    fetch('/api/bonus/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: newWords })
    }).then(() => {
        fetchWordList();
        document.getElementById('newWords').value = '';
    });
}

// Initial load
fetchWordList();
