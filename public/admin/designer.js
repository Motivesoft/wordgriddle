// Variables used during the design phase
let currentPuzzle;
let puzzleEdited;

// Function to create the grid
function createGrid(size) {
  const grid = document.getElementById("grid");
  grid.innerHTML = ""; // Clear existing grid

  // Set grid dimensions
  grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  // Create grid cells
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.classList.add("grid-cell");
    grid.appendChild(cell);
  }

  // Reset the letter count
  if (currentPuzzle) {
    currentPuzzle.size = size;
    currentPuzzle.letters = '-'.repeat(size*size);
  }
}

// Function to update word counts
function updateWordCounts() {
  const lists = [
    { list: "listRequired", counter: "countRequired" },
    { list: "listBonus", counter: "countBonus" },
    { list: "listExcluded", counter: "countExcluded" }
  ];
  lists.forEach((item) => {
    const list = document.getElementById(item.list).querySelector("ul");
    const countElement = document.getElementById(item.counter);
    countElement.textContent = list.children.length;
  });
}

// Function to move selected words to another list
function moveSelected(fromListId, toListId) {
  const fromList = document.getElementById(fromListId).querySelector("ul");
  const toList = document.getElementById(toListId).querySelector("ul");

  // Get all checked items
  const checkedItems = fromList.querySelectorAll("input[type='checkbox']:checked");

  checkedItems.forEach((checkbox) => {
    const listItem = checkbox.closest("li"); // Get the parent <li> element
    toList.appendChild(listItem); // Move to the target list
    checkbox.checked = false; // Uncheck the checkbox
  });

  // Update word counts
  updateWordCounts();
}

// Function to get the contents of all word lists
function getWordLists() {
  const lists = ["listRequired", "listBonus", "listExcluded"];
  const wordLists = {};

  lists.forEach((listId) => {
    const list = document.getElementById(listId).querySelector("ul");
    const words = Array.from(list.children).map((li) => li.textContent.trim());
    wordLists[listId] = words;
  });

  return wordLists;
}

// Function to fetch authors from the API and populate the combobox
async function fetchAuthors() {
  try {
    const response = await fetch("/api/admin/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch authors");
    }

    const authors = await response.json();
    populateAuthorComboBox(authors.users);
  } catch (error) {
    console.error("Error fetching authors:", error);
    alert("Error fetching authors");
  }
}

// Function to fetch puzzles from the API and populate the combobox
async function fetchPuzzles() {
  try {
    const response = await fetch("/api/designer/puzzles", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch authors");
    }

    const data = await response.json();
    populatePuzzlesComboBox(data.puzzles);
  } catch (error) {
    console.error("Error fetching puzzles:", error);
    alert("Error fetching puzzles");
  }
}

// Function to populate the Author combobox
function populateAuthorComboBox(authors) {
  const authorSelect = document.getElementById("author");
  authorSelect.innerHTML = ""; // Clear existing options

  // Add each author as an option
  authors.forEach((author) => {
    const option = document.createElement("option");
    option.value = author.id; // Use the author's ID as the value
    option.textContent = author.name; // Use the author's name as the display text
    authorSelect.appendChild(option);
  });
}

// Function to populate the Author combobox
function populatePuzzlesComboBox(puzzles) {
  const puzzlesSelect = document.getElementById("puzzles");
  puzzlesSelect.innerHTML = ""; // Clear existing options

  console.log(`p: ${puzzles} (${puzzles.length || 0})`);
  // Add each puzzle as an option
  puzzles.forEach((puzzle) => {
    const option = document.createElement("option");
    option.value = puzzle.id; // Use the puzzle ID as the value
    option.textContent = puzzle.title; // Use the title as the display text
    puzzlesSelect.appendChild(option);
  });
}

// Function to reset the grid and clear the title
async function handleNew(author, size) {
  if (currentPuzzle !== undefined && puzzleEdited) {
    // Prompt to save current and do so, or cancel and return here
  }

  try {
    const response = await fetch(`/api/designer/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: author,
        size: size
      })
    });

    if (!response.ok) {
      throw new Error("Failed to create new puzzle");
    }

    const data = await response.json();

    createGrid(size);
    updateFromPuzzle( data.puzzle );
  } catch (error) {
    console.error("Error calling Create API:", error);
    alert("Error calling Create API");
  }
}

// Function to reset the grid and clear the title
async function handleLoad(puzzleId) {
  if (currentPuzzle !== undefined && puzzleEdited) {
    // Prompt to save current and do so, or cancel and return here
  }

  try {
    const response = await fetch(`/api/designer/puzzle/${puzzleId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load puzzle");
    }

    const data = await response.json();

    createGrid(data.puzzle.size);
    updateFromPuzzle( data.puzzle );
  } catch (error) {
    console.error("Error calling Create API:", error);
    alert("Error calling Create API");
  }
}
// Function to load data from a web API (Solve button)
async function handleSolve() {
  try {
    const response = await fetch("https://api.example.com/solve", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();

    alert("Solve API response: " + JSON.stringify(data));
  } catch (error) {
    console.error("Error calling Solve API:", error);
    alert("Error calling Solve API");
  }
}

// Function to save data to a web API (Save button)
async function handleSave() {
  const wordLists = getWordLists();

  let letters = '';
  const grid = document.getElementById("grid");
  for (i = 0; i < grid.children.length; i++) {
    const letter = grid.children[i].value || '-';
    letters += letter;
  }

  try {
    const response = await fetch(`/api/designer/update-letters/${currentPuzzle.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({letters: letters}),
    });

    if (!response.ok) {
      throw new Error("Failed to save data");
    }

    const data = await response.json();

    updateFromPuzzle( data.puzzle );
  } catch (error) {
    console.error("Error calling Save API:", error);
    alert("Error calling Save API");
  }
}

function updateFromPuzzle(puzzle) {
  currentPuzzle = puzzle;

  document.getElementById("title").value = puzzle.title || '';

  populateGrid(puzzle);
}

function populateGrid(puzzle) {
  const grid = document.getElementById("grid");

  if (puzzle.letters === undefined || puzzle.length === 0) {
    document.getElementById("grid").children.forEach((cell) => {
      cell.value = '';
    })
  } else {
    // Create grid cells
    for (let i = 0; i < puzzle.letters.length; i++) {
      const cell = grid.children[i];
      if (puzzle.letters[i] !== '-') {
        cell.value = puzzle.letters[i];
      }
    }
  }
}

// Function to handle the Publish button
function handlePublish() {
  alert("Publish button clicked");
}

updateWordCounts(); // Set initial word counts
