//Grid status
const currentGrid = {
  // Grid state - initialised to defaults
  puzzleId: -1,
  author: 0,
  size: 3,
  letters: [],

  // Interactive stuff
  isDrawing: false,
  selectedLetters: [],
  trail: [],
  overlays: new Set(),
  lastCell: null,

  // Dirty state
  cellStateUnsaved: false,
  wordListStateUnsaved: false,
};

// Start a new grid by assembling its metadata, initialising its state data and then creating the onscreen grid
function createGrid(puzzle) {
  console.debug(`createGrid ${puzzle.size}x${puzzle.size} puzzle with ID: ${puzzle.id}`);

  currentGrid.puzzleId = puzzle.id;
  currentGrid.author = puzzle.author;

  // Store letters list
  currentGrid.letters = Array.from(puzzle.letters);
  currentGrid.size = puzzle.size;

  currentGrid.isDrawing = false;
  currentGrid.selectedLetters = [];
  currentGrid.trail = [];
  currentGrid.lastCell = null;

  setGridChangeState(false);
  setWordListChangeState(false);

  initializeGrid();
}

// Called to (re)build the grid
function initializeGrid() {
  console.debug(`initializeGrid`);

  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  currentGrid.trail = [];
  currentGrid.overlays.clear();

  // Set grid dimensions
  grid.style.gridTemplateColumns = `repeat(${currentGrid.size}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${currentGrid.size}, 1fr)`;

  currentGrid.letters.forEach((letter, index) => {
    // '.' and '-' are meaningful in terms of puzzle design, but don't show as letters in the grid
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
    grid.appendChild(cell);
  });

  // Make sure our canvas is sized to this newly created grid
  handleResize();
}

// Dragging and drawing methods

// Start a new drag operation
function startDragGesture(e) {
  // React to a click or touch, unless on a 'hidden' square
  const cell = e.target;
  if (cell.classList.contains('grid-item')) {
    currentGrid.isDrawing = true;
    currentGrid.selectedLetters = [{
      letter: cell.dataset.letter,
      index: parseInt(cell.dataset.index)
    }];

    // Mark the cell as selected
    cell.classList.add('selected');

    // Record the movement
    currentGrid.trail.push(cell);

    // Draw the start of a new trail
    drawBlob(cell);

    // Remember where we are for backtracking
    currentGrid.lastCell = cell;
  }
}

// Continue a drag operation
// This takes a target HTML element and mouse/touch x,y coordinates 
function continueDragGesture(cell, clientX, clientY) {
  // Drop out if we're not currently in a drag operation
  if (!currentGrid.isDrawing) {
    return;
  }

  // If we're on a cell in the grid and have moved from the previous cell, treat this as a drag gesture
  // unless the cell contains a space, intended to mean a gap in the layout that the user may not select
  if (cell.classList.contains('grid-item') && cell !== currentGrid.lastCell && cell.dataset.letter !== ' ') {
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
    const cellCol = cellIndex % currentGrid.size;
    const cellRow = (cellIndex - cellCol) / currentGrid.size;

    // Where have we come from?
    const prevIndex = currentGrid.selectedLetters[currentGrid.selectedLetters.length - 1].index;
    const prevCol = prevIndex % currentGrid.size;
    const prevRow = (prevIndex - prevCol) / currentGrid.size;

    // What will help us work out if this is a valid move - valid being -1 and 1 respectively
    const lastSelectedIndex = currentGrid.selectedLetters.findIndex(item => item.index === cellIndex);
    const distance = Math.max(Math.abs(cellCol - prevCol), Math.abs(cellRow - prevRow));

    // lastSelectedIndex = -1 iff cell is not part of the current selection
    // distance = 1 if the origin and new cell are adjacent

    // if a valid move, select the square
    if (lastSelectedIndex === -1 && distance === 1) {
      // Add new cell to selection
      currentGrid.selectedLetters.push({
        letter: cell.dataset.letter,
        index: cellIndex
      });

      // Mark the cell as selected
      cell.classList.add('selected');

      // Record the movement
      currentGrid.trail.push(cell);

      // Draw the movement
      drawLine(currentGrid.lastCell, cell);

      // Remember this step for backtracking
      currentGrid.lastCell = cell;
    } else if (lastSelectedIndex !== -1) {
      // Encountered an already selected cell. Is this a step backwards
      if (cellIndex === currentGrid.selectedLetters[currentGrid.selectedLetters.length - 2]?.index) {
        const grid = document.getElementById('grid');

        // Pop the last selected letter and deselect its cell

        const prevIndex = currentGrid.selectedLetters[currentGrid.selectedLetters.length - 1].index;
        const prevCell = grid.childNodes[prevIndex];
        prevCell.classList.remove('selected');

        // Remove the step - will need to redraw
        currentGrid.trail.pop();
        redrawTrail();

        // Remove the last letter
        currentGrid.selectedLetters.pop();

        // Reset where we are for further backtracking
        currentGrid.lastCell = cell;
      }
    }
  }
}

// Stop a drag operation and process the outcome
function stopDragGesture() {
  if (currentGrid.isDrawing) {
    currentGrid.isDrawing = false;

    // Create a callback to handle the letters the user is about to provide to enter into the grid
    const submitCallback = (input) => {
      if (input.length === currentGrid.trail.length) {
        const inputLetters = input.toUpperCase();

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

        // Iterate over the path and check whether we are about to change any letters and double-check
        // with the user. This is to avoid accidentally breaking existing elements of the puzzle
        // TODO make this an optional test
        if (valid) {
          const selectedWord = currentGrid.selectedLetters.map(item => item.letter).join('').toUpperCase();

          for (let i = 0; i < selectedWord.length; i++) {
            const selectedLetter = selectedWord[i];
            const inputLetter = inputLetters[i];

            // Check for any (potentially accidental) attempts to change a square with a valid value
            // (letter or space) to something else
            if (selectedLetter !== inputLetter && selectedLetter != '-') {
              valid = confirm(`This will alter one or more letters in the grid. Continue?`);

              // Only ask once
              break;
            }
          }
        }

        if (valid) {
          for (let i = 0; i < currentGrid.trail.length; i++) {
            const cell = currentGrid.trail[i];
            const letter = inputLetters[i];
            cell.dataset.letter = letter;
            cell.textContent = letter === '.' || letter === '-' ? ' ' : letter;

            if (letter === '.') {
              cell.classList.add('hidden');
            } else {
              cell.classList.remove('hidden');
            }

            currentGrid.letters[cell.dataset.index] = letter;

            // Mark the grid as 'changed'
            setGridChangeState(true);
          }
        }
      } else {
        alert(`Input '${input}' not of correct length (${input.length}, instead of ${currentGrid.trail.length})`);
      }
    };

    // Create a callback to tidy up after asking the user for a string of letters for the grid
    const closeCallback = () => {
      // Clear any selection decorations
      clearTrail();
      document.querySelectorAll('.grid-item').forEach(item => {
        item.classList.remove('selected');
      });
    };
    openLetterEntryModal(currentGrid.trail.length, submitCallback, closeCallback);
  }
}

function fillRandom() {
  let changed = false;
  for (let i = 0; i < currentGrid.letters.length; i++) {
    if (currentGrid.letters[i] === '-') {
      currentGrid.letters[i] = getRandomLetter();

      changed = true;
    }
  }

  if (changed) {
    // Mark puzzle as 'changed'
    setGridChangeState(true);

    initializeGrid();
  }
}

function getLetters() {
  return currentGrid.letters.join('');
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

  wordListItems.forEach(([word, path]) => {
    const wordLi = document.createElement("li");
    const wordLabel = document.createElement("label");

    wordLi.appendChild(wordLabel);
    wordLabel.innerHTML = `<input type="checkbox" class="wordlist-checkbox" value="${path}">${word}`;

    list.appendChild(wordLi);
  });
}

// Function to move selected words to another list
function moveSelected(fromListId, toListId) {
  const fromList = document.getElementById(fromListId).querySelector("ul");
  const toList = document.getElementById(toListId).querySelector("ul");

  // Get all checked items
  const checkedItems = fromList.querySelectorAll("input[type='checkbox']:checked");

  // Make sure there are some before we go updating anything
  if (checkedItems.length) {
    checkedItems.forEach((checkbox) => {
      const listItem = checkbox.closest("li"); // Get the parent <li> element
      toList.appendChild(listItem); // Move to the target list

      // TODO work out if we actually want/need to do this
      checkbox.checked = false; // Uncheck the checkbox
    });

    // Update word counts
    updateWordCounts();

    // Mark word lists as modified
    setWordListChangeState(true);
  }
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

  currentGrid.overlays.clear();
  updateOverlays();
}

async function saveAllWordLists() {
  let saved = await saveWordLists('bonus', 'listBonus', 'listExcluded');
  saved &= await saveWordLists('excluded', 'listExcluded', 'listBonus');

  // If save worked, clear the dirty state
  if (saved) {
    setWordListChangeState(false);
  }
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
        body: JSON.stringify({ words: list }),
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
        body: JSON.stringify({ words: list }),
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
        body: JSON.stringify({ words: wordLists['listRequired'] }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }
    }
  } catch (error) {
    console.error("Error calling Save API:", error);
    alert("Error calling Save API");
    return false;
  }

  // Success
  return true;
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
  console.debug(`Create new grid by ${author} of size ${size}`);

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

    openPuzzle(data.puzzle);
  } catch (error) {
    console.error("Error calling Create API:", error);
    alert("Error calling Create API");
  }
}

// Function to reset the grid and clear the title
async function handleLoad(puzzleId) {
  console.debug(`Load puzzle with ID: ${puzzleId}`);

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

    openPuzzle(data.puzzle);
  } catch (error) {
    console.error("Error calling Puzzle API:", error);
    alert("Error calling Puzzle API");
  }
}

async function handleRevert() {
  if (hasUnsavedChanges()) {
    if (confirm("This will undo any unsaved changes. Are you sure?")) {
      handleLoad(currentGrid.puzzleId);
    }
  }
}

function openPuzzle(puzzle) {
  console.debug(`Opening grid: ${puzzle.title}`);

  createGrid(puzzle);
  updateTitleDisplay(puzzle);
  clearWordLists();
}

// Fill in any empty squares
async function handleRandomFill() {
  fillRandom();
}

function getGridLetters() {
  return getLetters();
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
  const letters = getGridLetters();

  try {
    const response = await fetch(`/api/designer/update-letters/${currentGrid.puzzleId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ letters: letters }),
    });

    if (!response.ok) {
      throw new Error("Failed to save data");
    }

    // Only saving here, so no need to update anything
    const data = await response.json();

    console.log(`Saved ${data.puzzle.title} successfully`);

    // Mark as unchanged again
    setGridChangeState(false);

  } catch (error) {
    console.error("Error calling Save API:", error);
    alert("Error calling Save API");
  }
}

async function updateTitleDisplay(puzzle) {
  const author = await getAuthor(puzzle.author);

  document.getElementById("title").value = `${puzzle.title} by ${author.name || 'unknown'}`;
}

// Function to handle the Publish button
function handlePublish() {
  alert("Publish button clicked");
}

function setGridChangeState(changed) {
  currentGrid.cellStateUnsaved = changed;

  updateChangeStateDisplay();
}

function setWordListChangeState(changed) {
  currentGrid.wordListStateUnsaved = changed;

  updateChangeStateDisplay();
}

function hasUnsavedChanges() {
  return currentGrid.cellStateUnsaved | currentGrid.wordListStateUnsaved;
}

function updateChangeStateDisplay() {
  let message;
  let color = "rgb(192, 32, 32)";

  if (currentGrid.cellStateUnsaved && currentGrid.wordListStateUnsaved) {
    message = `There are unsaved grid and word list changes`;
  } else if (currentGrid.cellStateUnsaved) {
    message = `There are unsaved grid changes`;
  } else if (currentGrid.wordListStateUnsaved) {
    message = `There are unsaved word list changes`;
  } else {
    message = `There are no unsaved changes`;
    color = "rgb(32, 32, 32)";
  }

  const statusLine = document.getElementById('status-line');
  statusLine.innerHTML = message;
  statusLine.style.color = color;
}

// Event handler logic

function attachEventListeners() {
  const grid = document.getElementById('grid');
  grid.addEventListener('mousedown', handleMouseStart);
  grid.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseEnd);

  grid.addEventListener('touchstart', handleTouchStart);
  grid.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', handleTouchEnd);

  document.body.addEventListener('change', function(event) {
    // Track for word list selections and prepare to draw their path on the grid if so configured
    if (event.target.classList.contains('wordlist-checkbox')) {
      if (event.target.checked) {
        currentGrid.overlays.add(event.target.value);
      } else {
        currentGrid.overlays.delete(event.target.value);
      }
      updateOverlays();
    }
  });

  // Make sure our canvas for drawing selection lines is always the right size
  window.addEventListener('resize', handleResize);

  // Try and avoid the user losing unsaved edits
  window.addEventListener('beforeunload', function (e) {
    // Check if there are unsaved changes
    if (hasUnsavedChanges()) {
      // Cancel the event
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = '';
    }
  });

  // Clear the title on refresh
  window.onload = function () {
    document.getElementById('title').value = '';
  };
}

// Overlays

function updateOverlays() {
  const colorList = [
    'rgba(255, 182, 193, 0.4)', // Pastel Pink
    'rgba(173, 216, 230, 0.4)', // Pastel Blue
    'rgba(144, 238, 144, 0.4)', // Pastel Green
    'rgba(255, 255, 224, 0.4)', // Pastel Yellow
    'rgba(230, 230, 250, 0.4)', // Pastel Lavender
    'rgba(255, 218, 185, 0.4)', // Pastel Peach
    'rgba(230, 255, 230, 0.4)', // Pastel Mint
    'rgba(240, 128, 128, 0.4)', // Pastel Coral
    'rgba(135, 206, 235, 0.4)', // Pastel Sky Blue
    'rgba(255, 255, 79, 0.4)'   // Pastel Lemon
  ];

  // Clear the canvas and redraw any stored overlays
  const canvas = document.getElementById('overlayCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const showOverlays = document.getElementById("showOverlays");
  if (!showOverlays.checked) {
    // Overlays are turned off
    return;
  }

  // Draw each overlay trail
  let colorIndex = 0;
  currentGrid.overlays.forEach((overlay) => {
    // Pick the next color and increment the index for the next, looping round if necessary
    const color = colorList[colorIndex++];
    if (colorIndex == colorList.length ) {
      colorIndex = 0;
    }

    // At this point, overlay is just a string path. Turn it into an array of cells
    const pathIndices = overlay.match(/\[(\d+)\]/g);
    const cells = pathIndices.map(pathIndex => grid.children[ parseInt(pathIndex.replace(/\[|\]/g, ''), 10)]);

    let cellCount = cells.length;
    if (cellCount > 0) {
      let from = cells[0];
      //drawBlob(from);
      {
        // Begin a new path
        ctx.beginPath();
        
        ctx.fillStyle = color;

        // Draw a circle
        const radius = 12;
        const xCentre = (from.offsetLeft - grid.offsetLeft) + from.offsetWidth / 2;
        const yCentre = (from.offsetTop - grid.offsetTop) + from.offsetHeight / 2;
        ctx.arc(xCentre, yCentre, radius, 0, 2 * Math.PI);
      
        // Fill the circle to create the blob
        ctx.fill();
      }
  
      let index = 1;
      while (index < cellCount) {
        let to = cells[index++];
        //drawLine(from, to);
        {
          ctx.beginPath();
        
          ctx.strokeStyle = color;
          ctx.lineWidth = 8;
          ctx.lineCap = 'round'; // Rounded line ends
        
          const fromXCentre = (from.offsetLeft - grid.offsetLeft) + from.offsetWidth / 2;
          const fromYCentre = (from.offsetTop - grid.offsetTop) + from.offsetHeight / 2;
        
          const toXCentre = (to.offsetLeft - grid.offsetLeft) + to.offsetWidth / 2;
          const toYCentre = (to.offsetTop - grid.offsetTop) + to.offsetHeight / 2;
        
          ctx.moveTo(fromXCentre, fromYCentre);
          ctx.lineTo(toXCentre, toYCentre);
          ctx.stroke();
        }
  
        // Step forward
        from = to;
      }
    }
  });
}

// Letter utility functions

// Get a (useful) random letter (exclude things like QXZ)
function getRandomLetter() {
  const alphabet = 'ABCDEFGHIJKLMNOPRSTUVYW';
  const randomIndex = Math.floor(Math.random() * alphabet.length);
  return alphabet[randomIndex];
}

// Trail management

// Draw a line between cells to indicate the selection
function drawLine(from, to) {
  const grid = document.getElementById('grid');
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');

  // TODO use a var here. save as in drawBlob
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
function drawBlob(cell) {
  const grid = document.getElementById('grid');
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');

  // TODO use a var here
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

function redrawTrail() {
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw the whole trail from the start
  let cells = currentGrid.trail.length;
  if (cells > 0) {
    let from = currentGrid.trail[0];
    drawBlob(from);

    let index = 1;
    while (index < cells) {
      let to = currentGrid.trail[index++];
      drawLine(from, to);

      // Step forward
      from = to;
    }
  }
}

// Done with the current drag, clean up the trails
function clearTrail() {
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset the trail
  currentGrid.trail.length = 0;
}

// Mouse handlers

function handleMouseStart(e) {
  startDragGesture(e);
}

function handleMouseMove(e) {
  // Extract the mouse target and process it
  // Pass in the individual elements rather than the event as 'draw()'
  // needs to service mouse and touch events and has a signature to suit
  continueDragGesture(e.target, e.clientX, e.clientY);
}

function handleMouseEnd(e) {
  stopDragGesture();
}

// Touch handlers

function handleTouchStart(e) {
  startDragGesture(e);
}

function handleTouchMove(e) {
  // Work out where we have dragged to and process it
  const touch = e.touches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);

  if (element) {
    continueDragGesture(element, touch.clientX, touch.clientY);
  }
}

function handleTouchEnd(e) {
  stopDragGesture();
}

function handleResize() {
  // Make sure the canvas stays resized to the grid
  const grid = document.getElementById('grid');
  
  const trailCanvas = document.getElementById('trailCanvas');
  trailCanvas.style.left = `${grid.offsetLeft}px`;
  trailCanvas.style.top = `${grid.offsetTop}px`;
  trailCanvas.width = grid.offsetWidth;
  trailCanvas.height = grid.offsetHeight;

  const overlayCanvas = document.getElementById('overlayCanvas');
  overlayCanvas.style.left = `${grid.offsetLeft}px`;
  overlayCanvas.style.top = `${grid.offsetTop}px`;
  overlayCanvas.width = grid.offsetWidth;
  overlayCanvas.height = grid.offsetHeight;

  // TODO do we need to redraw any active trail here?
}

// Initialisation
updateWordCounts(); // Set initial word counts
attachEventListeners();