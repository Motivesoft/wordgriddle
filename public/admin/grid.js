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
  }
  
  // Function to update word counts
  function updateWordCounts() {
    const lists = ["list1", "list2", "list3"];
    lists.forEach((listId) => {
      const list = document.getElementById(listId).querySelector("ul");
      const countElement = document.getElementById(`count${listId.slice(-1)}`);
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
    const lists = ["list1", "list2", "list3"];
    const wordLists = {};
  
    lists.forEach((listId) => {
      const list = document.getElementById(listId).querySelector("ul");
      const words = Array.from(list.children).map((li) => li.textContent.trim());
      wordLists[listId] = words;
    });
  
    return wordLists;
  }
  
  // Function to reset the grid and clear the title
  function handleNew() {
    createGrid(3); // Reset to 3x3 grid
    document.getElementById("title").value = ""; // Clear the title field
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
      console.log("Data from Solve API:", data);
      alert("Solve API response: " + JSON.stringify(data));
    } catch (error) {
      console.error("Error calling Solve API:", error);
      alert("Error calling Solve API");
    }
  }
  
  // Function to save data to a web API (Save button)
  async function handleSave() {
    const wordLists = getWordLists();
    const title = document.getElementById("title").value;
  
    try {
      const response = await fetch("https://api.example.com/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, wordLists }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to save data");
      }
  
      const data = await response.json();
      console.log("Data from Save API:", data);
      alert("Save API response: " + JSON.stringify(data));
    } catch (error) {
      console.error("Error calling Save API:", error);
      alert("Error calling Save API");
    }
  }
  
  // Function to handle the Public button
  function handlePublic() {
    alert("Public button clicked");
  }
  
  // Initialize with a default grid
  createGrid(3);
  updateWordCounts(); // Set initial word counts