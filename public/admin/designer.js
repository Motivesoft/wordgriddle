// Variables used during the design phase
let currentPuzzle;
let puzzleEdited;

let letterGrid;

class LetterGrid {
  constructor() {
      this.grid = document.getElementById('grid');

      this.attachEventListeners();
  }

  // Pass in the letters string
  open(size, letters) {
      // Store letters list
      this.letters = Array.from(letters);
      this.gridSize = size;

      this.isDrawing = false;
      this.selectedLetters = [];
      this.trail = [];
      this.lastCell = null;

      // Grids are square by design and so the length of each size is the square root of the number of letters
      this.grid.innerHTML = ""; // Clear existing grid

      // Set grid dimensions
      this.grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      this.grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;

      // Create grid cells
      for (let i = 0; i < size * size; i++) {
          const cell = document.createElement("div");
          const label = document.createElement("label");
          cell.classList.add("grid-cell");
          label.textContent = '-';
          cell.appendChild(label);
          grid.appendChild(cell);
      }

      this.initializeGrid();
  }

  initializeGrid() {
      this.grid.innerHTML = '';
      this.letters.forEach((letter, index) => {
          let displayLetter = letter;
          if (letter === '.' || letter === '-') {
              displayLetter = ' ';
          }
          const cell = document.createElement('div');
          cell.className = 'grid-item';
          cell.textContent = displayLetter;
          cell.dataset.letter = letter;
          cell.dataset.index = index;
          cell.dataset.coord = `[${index}]`;

          // Style the unusable parts of the grid so they look and interact as we need them to
          if (letter === '.') {
              cell.classList.add('hidden');
          }

          // Add the cell to the grid
          this.grid.appendChild(cell);
      });

      // Make sure our canvas for drawing selection lines is always the right size
      window.addEventListener('resize', this.resizeCanvas);
      this.resizeCanvas();
  }

  resizeCanvas() {
      // Make sure the canvas stays resized to the grid
      const grid = document.getElementById('grid');
      const canvas = document.getElementById('trailCanvas');

      canvas.style.left = `${grid.offsetLeft}px`;
      canvas.style.top = `${grid.offsetTop}px`;
      canvas.width = grid.offsetWidth;
      canvas.height = grid.offsetHeight;

      // TODO do we need to redraw any active trail here?
  }

  attachEventListeners() {
      this.grid.addEventListener('mousedown', this.handleMouseStart.bind(this));
      this.grid.addEventListener('mousemove', this.handleMouseMove.bind(this));
      document.addEventListener('mouseup', this.handleMouseEnd.bind(this));

      this.grid.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.grid.addEventListener('touchmove', this.handleTouchMove.bind(this));
      document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  // Mouse handlers

  handleMouseStart(e) {
      this.startDrawing(e);
  }

  handleMouseMove(e) {
      // Extract the mouse target and process it
      // Pass in the individual elements rather than the event as 'draw()'
      // needs to service mouse and touch events and has a signature to suit
      this.draw(e.target, e.clientX, e.clientY);
  }

  handleMouseEnd(e) {
      this.stopDrawing();
  }

  // Touch handlers

  handleTouchStart(e) {
      e.preventDefault();

      this.startDrawing(e);
  }

  handleTouchMove(e) {
      e.preventDefault();

      // Work out where we have dragged to and process it
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      if (element) {
          this.draw(element, touch.clientX, touch.clientY);
      }
  }

  handleTouchEnd(e) {
      e.preventDefault();

      this.stopDrawing();
  }

  // Dragging and drawing methods

  // Start a new drag operation
  startDrawing(e) {
      // React to a click or touch, unless on a 'hidden' square
      const cell = e.target;
      if (cell.classList.contains('grid-item') && !cell.classList.contains('hidden')) {
          this.isDrawing = true;
          this.selectedLetters = [{
              letter: cell.dataset.letter,
              index: parseInt(cell.dataset.index)
          }];

          // Mark the cell as selected
          cell.classList.add('selected');

          // Record the movement
          this.trail.push(cell);

          // Draw the start of a new trail
          this.drawBlob(cell);

          // Remember where we are for backtracking
          this.lastCell = cell;
      }
  }

  // Continue a drag operation
  // This takes a target HTML element and mouse/touch x,y coordinates 
  draw(cell, clientX, clientY) {
      // Drop out if we're not currently in a drag operation
      if (!this.isDrawing) {
          return;
      }

      // If we're on a cell in the grid and have moved from the previous cell, treat this as a drag gesture
      // unless the cell contains a space, intended to mean a gap in the layout that the user may not select
      if (cell.classList.contains('grid-item') && cell !== this.lastCell && cell.dataset.letter !== ' ') {
          // Reject points too close to the edge sto avoid false positives
          const cellRect = cell.getBoundingClientRect();
          const cellCentreX = cellRect.left + (cellRect.width / 2);
          const cellCentreY = cellRect.top + (cellRect.height / 2);
          const xDistanceToCentre = Math.abs(cellCentreX - clientX);
          const yDistanceToCentre = Math.abs(cellCentreY - clientY);

          // If we are within this distance of the centre, accept that we are selecting this cell
          // Another way to put this is to use the middle 70% as the target area 
          const proximityMeasure = 0.35;
          if (xDistanceToCentre > cellRect.width * proximityMeasure || yDistanceToCentre > cellRect.height * proximityMeasure) {
              return;
          }

          // Where are we?
          const cellIndex = parseInt(cell.dataset.index);
          const cellCol = cellIndex % this.gridSize;
          const cellRow = (cellIndex - cellCol) / this.gridSize;

          // Where have we come from?
          const prevIndex = this.selectedLetters[this.selectedLetters.length - 1].index;
          const prevCol = prevIndex % this.gridSize;
          const prevRow = (prevIndex - prevCol) / this.gridSize;

          // What will help us work out if this is a valid move - valid being -1 and 1 respectively
          const lastSelectedIndex = this.selectedLetters.findIndex(item => item.index === cellIndex);
          const distance = Math.max(Math.abs(cellCol - prevCol), Math.abs(cellRow - prevRow));

          // lastSelectedIndex = -1 iff cell is not part of the current selection
          // distance = 1 if the origin and new cell are adjacent

          // if a valid move, select the square
          if (lastSelectedIndex === -1 && distance === 1) {
              // Add new cell to selection
              this.selectedLetters.push({
                  letter: cell.dataset.letter,
                  index: cellIndex
              });

              // Mark the cell as selected
              cell.classList.add('selected');

              // Record the movement
              this.trail.push(cell);

              // Draw the movement
              this.drawLine(this.lastCell, cell);

              // Remember this step for backtracking
              this.lastCell = cell;
          } else if (lastSelectedIndex !== -1) {
              // Encountered an already selected cell. Is this a step backwards
              if (cellIndex === this.selectedLetters[this.selectedLetters.length - 2]?.index) {
                  // Pop the last selected letter and deselect its cell

                  const prevIndex = this.selectedLetters[this.selectedLetters.length - 1].index;
                  const prevCell = this.grid.childNodes[prevIndex];
                  prevCell.classList.remove('selected');

                  // Remove the step - will need to redraw
                  this.trail.pop();
                  this.redrawTrail();

                  // Remove the last letter
                  this.selectedLetters.pop();

                  // Reset where we are for further backtracking
                  this.lastCell = cell;
              }
          }
      }
  }

  // Stop a drag operation and process the outcome
  stopDrawing() {
      if (this.isDrawing) {
          this.isDrawing = false;

          const selectedWord = this.selectedLetters.map(item => item.letter).join('').toLowerCase();

          const input = prompt(`Enter ${this.trail.length} letters for the path ('.' to create a hole, '-' to clear a cell):`);
          if (input) {
              if (input.length === this.trail.length) {
                  const inputLetters = input.toLocaleUpperCase();

                  let valid = true;
                  for (let i = 0; i < inputLetters.length; i++) {
                      const letter = inputLetters[i];
                      if (letter < 'A' || letter > 'Z') {
                          if (letter !== '.' && letter !== '-') {
                              alert("Input invalid. Must be letters, '.' or '-'");
                              
                              valid = false;
                              break;
                          }
                      }
                  }

                  if (valid) {
                      for (let i = 0; i < this.trail.length; i++) {
                          const cell = this.trail[i];
                          const letter = inputLetters[i];
                          cell.dataset.letter = letter;
                          cell.textContent = letter === '.' || letter === '-' ? ' ' : letter;
  
                          if (letter === '.') {
                              cell.classList.add('hidden');
                          } else {
                              cell.classList.remove('hidden');
                          }
  
                          this.letters[cell.dataset.index] = letter;
                      }
                  }
              } else {
                  alert(`Input not of correct length`);
              }
          }

          // Clear any selection decoractions
          this.clearTrail();
          document.querySelectorAll('.grid-item').forEach(item => {
              item.classList.remove('selected');
          });
      }
  }

  // Draw a line between cells to indicate the selection
  drawLine(from, to) {
      const grid = document.getElementById('grid');
      const canvas = document.getElementById('trailCanvas');
      const ctx = canvas.getContext('2d');

      ctx.strokeStyle = 'rgba(111, 176, 92, 0.4)'; // Green with some transparency
      ctx.lineWidth = 15;
      ctx.lineCap = 'round'; // Rounded line ends

      ctx.beginPath();

      const fromXCentre = (from.offsetLeft - grid.offsetLeft) + from.offsetWidth / 2;
      const fromYCentre = (from.offsetTop - grid.offsetTop) + from.offsetHeight / 2;

      const toXCentre = (to.offsetLeft - grid.offsetLeft) + to.offsetWidth / 2;
      const toYCentre = (to.offsetTop - grid.offsetTop) + to.offsetHeight / 2;

      ctx.moveTo(fromXCentre, fromYCentre);
      ctx.lineTo(toXCentre, toYCentre);
      ctx.stroke();
  }

  // Draw a blob on the first cell of a selection
  drawBlob(cell) {
      const grid = document.getElementById('grid');
      const canvas = document.getElementById('trailCanvas');
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgba(111, 176, 92, 0.4)'; // Green with some transparency

      // Begin a new path
      ctx.beginPath();

      // Draw a circle
      const radius = 24;
      const xCentre = (cell.offsetLeft - grid.offsetLeft) + cell.offsetWidth / 2;
      const yCentre = (cell.offsetTop - grid.offsetTop) + cell.offsetHeight / 2;
      ctx.arc(xCentre, yCentre, radius, 0, 2 * Math.PI);

      // Fill the circle to create the blob
      ctx.fill();
  }

  redrawTrail() {
      const canvas = document.getElementById('trailCanvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Redraw the whole trail from the start
      let cells = this.trail.length;
      if (cells > 0) {
          let from = this.trail[0];
          this.drawBlob(from);

          let index = 1;
          while (index < cells) {
              let to = this.trail[index++];
              this.drawLine(from, to);

              // Step forward
              from = to;
          }
      }
  }

  // Done with the current drag, clean up the trails
  clearTrail() {
      const canvas = document.getElementById('trailCanvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.trail.length = 0;
  }

  // Get a (usable) random letter (exclude QXZ)
  getRandomLetter() {
      const alphabet = 'ABCDEFGHIJKLMNOPRSTUVYW';
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      return alphabet[randomIndex];
  }

  fillRandom() {
      for (let i = 0; i < this.letters.length; i++) {
          if (this.letters[i] === '-') {
              this.letters[i] = this.getRandomLetter();
          }
      }

      this.initializeGrid();
  }

  getLetters() {
      return this.letters.join('');
  }
}

// Function to create the grid
function createGrid(size) {
  letterGrid = new LetterGrid();
  letterGrid.open(size, '-'.repeat(size*size));
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

function clearWordLists() {
  updateWordList("listRequired", []);
  updateWordList("listBonus", []);
  updateWordList("listExcluded", []);
  updateWordCounts();
}

function updateWordLists(lists) {
  updateWordList("listRequired", lists.wordLists.required);
  updateWordList("listBonus", lists.wordLists.bonus);
  updateWordList("listExcluded", lists.wordLists.excluded);
  updateWordCounts();
}

function updateWordList(listId, wordListItems) {
  // Rebuild the word list with the provided items
  const list = document.getElementById(listId).querySelector("ul");
  while (list.children.length) {
    list.removeChild(list.children[0]);
  }
  wordListItems.forEach(([word,_]) => {
    const wordLi = document.createElement("li");
    const wordLabel = document.createElement("label");
    
    wordLi.appendChild(wordLabel);
    wordLabel.innerHTML = `<input type="checkbox">${word}`;

    list.appendChild(wordLi);
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

    // TODO work out if we actually want/need to do this
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

async function clearWordListSelections() {
  document.querySelectorAll('ul li input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
}

async function saveAllWordLists() {
  await saveWordLists('bonus', 'listBonus', 'listExcluded');
  await saveWordLists('excluded', 'listExcluded', 'listBonus');
}

// Save word list changes.
// Maintain integrity by removing (eg) bonus and required words from the excluded list and vice-versa
async function saveWordLists(wordType, wordsToAdd, wordsToRemove) {
  // TODO make this into a server-side transaction API
  const wordLists = getWordLists();
  try {
    // Add words to list
    let list = wordLists[wordsToAdd];
    if (list.length) {
      const response = await fetch(`/api/${wordType}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({words: list}),
      });
  
      if (!response.ok) {
        throw new Error("Failed to save data");
      }
    }

    // Remove words that are now in the other list
    list = wordLists[wordsToRemove];
    if (list.length) {
      const removeResponse = await fetch(`/api/${wordType}/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({words: list}),
      });
  
      if (!removeResponse.ok) {
        throw new Error("Failed to save data");
      }
    }

    // Remove words that got moved to the required list
    list = wordLists['listRequired'];
    if (list.length) {
      const response = await fetch(`/api/${wordType}/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({words: wordLists['listRequired']}),
      });
  
      if (!response.ok) {
        throw new Error("Failed to save data");
      }
    }
  } catch (error) {
    console.error("Error calling Save API:", error);
    alert("Error calling Save API");
  }

}

// Function to fetch authors from the API and populate the combobox
async function getAuthor(id) {
  try {
    const response = await fetch(`/api/admin/user/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch author");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching authors:", error);
    alert("Error fetching authors");
  }
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

  // Add each puzzle as an option
  puzzles.forEach((puzzle) => {
    const option = document.createElement("option");
    option.value = puzzle.id; // Use the puzzle ID as the value
    option.textContent = `${puzzle.title} - ${puzzle.size}x${puzzle.size}`; // Use the title as the display text
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
    clearWordLists();
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
    clearWordLists();
  } catch (error) {
    console.error("Error calling Puzzle API:", error);
    alert("Error calling Puzzle API");
  }
}

// Fill in any empty squares
async function handleRandomFill() {
  letterGrid.fillRandom();
}

function getGridLetters() {
  return letterGrid.getLetters();
}

// Function to load data from a web API (Solve button)
async function handleSolve() {
  try {
    const letters = getGridLetters();

    const response = await fetch(`/api/designer/solve/${letters}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    updateWordLists(data);
  } catch (error) {
    console.error("Error calling Solve API:", error);
    alert("Error calling Solve API");
  }
}

// Function to save data to a web API (Save button)
async function handleSave() {
  const wordLists = getWordLists();

  const letters = getGridLetters();

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

async function updateFromPuzzle(puzzle) {
  currentPuzzle = puzzle;

  const author = await getAuthor(puzzle.author);

  document.getElementById("title").value = `${puzzle.title} by ${author.name || 'unknown'}`;

  populateGrid(puzzle);
}

function populateGrid(puzzle) {
  letterGrid.open(puzzle.size, puzzle.letters);
}

// Function to handle the Publish button
function handlePublish() {
  alert("Publish button clicked");
}

updateWordCounts(); // Set initial word counts
