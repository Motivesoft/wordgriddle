// Fetch and display word list
async function fetchWordLists() {
    showBusyIndicator('busy-indicator');

    //const requiredWords = {words: ["apple", "banana", "grape"], wordCount: 3};
    const requiredWords = {words: [
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape",
        "apple", "banana", "grape"
    ], wordCount: 33};
    const bonusWords = {words: [
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon",
        "mango", "kumquat", "dragon"
    ], wordCount: 39};
    const excludedWords = {words: [
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork",
        "beef", "chicken", "pork"
    ], wordCount: 36};

    const requiredWordList = document.getElementById('requiredWordList');
    requiredWordList.innerHTML = requiredWords.words.map(word => 
        `<div><input type="checkbox" value="${word}">&nbsp;${word}</div>`
    ).join('');

    const bonusWordList = document.getElementById('bonusWordList');
    bonusWordList.innerHTML = bonusWords.words.map(word => 
        `<div><input type="checkbox" value="${word}">&nbsp;${word}</div>`
    ).join('');

    const excludedWordList = document.getElementById('excludedWordList');
    excludedWordList.innerHTML = excludedWords.words.map(word => 
        `<div><input type="checkbox" value="${word}">&nbsp;${word}</div>`
    ).join('');

    // Display the number of words in the list
    const requiredWordCountDisplay = document.getElementById('requiredWordCountDisplay');
    requiredWordCountDisplay.innerHTML = `Word count: ${requiredWords.wordCount}`;

    // Display the number of words in the list
    const bonusWordCountDisplay = document.getElementById('bonusWordCountDisplay');
    bonusWordCountDisplay.innerHTML = `Word count: ${bonusWords.wordCount}`;

    // Display the number of words in the list
    const excludedWordCountDisplay = document.getElementById('excludedWordCountDisplay');
    excludedWordCountDisplay.innerHTML = `Word count: ${excludedWords.wordCount}`;
    hideBusyIndicator('busy-indicator');
}
