// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Find the button element
    const actionButton = document.getElementById('actionButton');
    
    // Add click event listener to the button
    if (actionButton) {
      actionButton.addEventListener('click', handleButtonClick);
    } else {
      console.error('Button with ID "actionButton" not found');
    }
  });
  
  /**
   * Handles the button click event
   */
  async function handleButtonClick() {
    // Prompt for read or write operation
    const action = prompt('Read or write?').toLowerCase().trim();
    
    if (action === 'read') {
      await handleReadOperation();
    } else if (action === 'write') {
      await handleWriteOperation();
    } else {
      alert('Invalid action. Please type "read" or "write".');
    }
  }
  
  /**
   * Handles the read operation
   */
  async function handleReadOperation() {
    // Prompt for the JSON path
    const path = prompt('Enter the JSON path (e.g., "users.0.name"):');
    
    if (!path) {
      alert('No path provided.');
      return;
    }
    
    try {
      // Send a request to the server to read data
      const response = await fetch(`/api/read?path=${encodeURIComponent(path)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Alert the data
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert(`Data at ${path}: ${JSON.stringify(data.value, null, 2)}`);
      }
    } catch (error) {
      alert(`Error reading data: ${error.message}`);
      console.error('Error reading data:', error);
    }
  }
  
  /**
   * Handles the write operation
   */
  async function handleWriteOperation() {
    // Prompt for the JSON path
    const path = prompt('Enter the JSON path to write to (e.g., "users.0.name"):');
    
    if (!path) {
      alert('No path provided.');
      return;
    }
    
    // Prompt for the data to write
    const value = prompt('Enter the value to write:');
    
    if (value === null) { // User canceled
      return;
    }
    
    try {
      // Parse the input to handle numbers, booleans, and objects
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // If parsing fails, use the string as is
        parsedValue = value;
      }
      
      // Send a request to the server to write data
      const response = await fetch('/api/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path, value: parsedValue })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Alert the result
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert(`Successfully wrote to ${path}`);
      }
    } catch (error) {
      alert(`Error writing data: ${error.message}`);
      console.error('Error writing data:', error);
    }
  }