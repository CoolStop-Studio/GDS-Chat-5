document.addEventListener('DOMContentLoaded', function() {
  // Predefined routes with named parameters
  const predefinedRoutes = [
      { name: "read", route: "api/read", params: ["path"] },
      { name: "write", route: "api/write", params: ["path", "value"] }
  ];
  
  // DOM elements
  const routeCardsContainer = document.getElementById('route-cards-container');
  const predefinedTab = document.getElementById('predefined-tab');
  const customTab = document.getElementById('custom-tab');
  const predefinedRouteContent = document.getElementById('predefined-routes');
  const customRouteContent = document.getElementById('custom-route');
  const paramInputsContainer = document.getElementById('param-inputs');
  const sendRequestButton = document.getElementById('send-request');
  const responseOutput = document.getElementById('response-output');
  const createCustomRouteButton = document.getElementById('create-custom-route');
  const paramCountInput = document.getElementById('param-count');
  const customParamContainer = document.getElementById('custom-params-container');
  
  // Current route state
  let selectedRoute = null;
  
  // Create route cards for predefined routes
  function createRouteCards() {
      routeCardsContainer.innerHTML = '';
      
      predefinedRoutes.forEach(route => {
          const card = document.createElement('div');
          card.className = 'route-card';
          card.innerHTML = `
              <h4>${route.name}</h4>
              <p><strong>Path:</strong> ${route.route}</p>
              <p><strong>Parameters:</strong> ${route.params.join(', ')}</p>
          `;
          
          card.addEventListener('click', () => selectRoute(route));
          routeCardsContainer.appendChild(card);
      });
  }
  
  // Handle tab switching
  predefinedTab.addEventListener('click', () => {
      predefinedTab.classList.add('active');
      customTab.classList.remove('active');
      predefinedRouteContent.classList.remove('hidden');
      customRouteContent.classList.add('hidden');
  });
  
  customTab.addEventListener('click', () => {
      customTab.classList.add('active');
      predefinedTab.classList.remove('active');
      customRouteContent.classList.remove('hidden');
      predefinedRouteContent.classList.add('hidden');
      
      // Reset custom param fields
      updateCustomParamFields();
  });
  
  // Select a route and update parameter inputs
  function selectRoute(route) {
      // Reset previous selection
      document.querySelectorAll('.route-card').forEach(card => {
          card.classList.remove('selected');
      });
      
      // If this is from predefined routes, highlight the card
      if (predefinedRoutes.includes(route)) {
          const cards = document.querySelectorAll('.route-card');
          const index = predefinedRoutes.indexOf(route);
          if (cards[index]) {
              cards[index].classList.add('selected');
          }
      }
      
      selectedRoute = route;
      updateParameterInputs(route);
      sendRequestButton.disabled = false;
  }
  
  // Update parameter input fields based on selected route
  function updateParameterInputs(route) {
      paramInputsContainer.innerHTML = '';
      
      if (!route || !route.params || route.params.length === 0) {
          paramInputsContainer.innerHTML = '<p class="instructions">No parameters needed for this route</p>';
          return;
      }
      
      for (let i = 0; i < route.params.length; i++) {
          const paramName = route.params[i];
          const paramContainer = document.createElement('div');
          paramContainer.className = 'param-input';
          
          paramContainer.innerHTML = `
              <div class="form-group">
                  <label for="param-${i}">${paramName}:</label>
                  <input type="text" id="param-${i}" data-param-name="${paramName}" placeholder="Enter ${paramName}" required>
              </div>
              <div class="form-group">
                  <label for="param-type-${i}">Type:</label>
                  <select id="param-type-${i}">
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                  </select>
              </div>
          `;
          
          paramInputsContainer.appendChild(paramContainer);
      }
  }
  
  // Update custom parameter fields based on the count
  function updateCustomParamFields() {
      if (!customParamContainer) {
          // Create the container if it doesn't exist
          customParamContainer = document.createElement('div');
          customParamContainer.id = 'custom-params-container';
          document.getElementById('custom-route-form').insertBefore(
              customParamContainer, 
              document.getElementById('create-custom-route')
          );
      } else {
          customParamContainer.innerHTML = '';
      }
      
      const count = parseInt(paramCountInput.value) || 0;
      
      for (let i = 0; i < count; i++) {
          const paramField = document.createElement('div');
          paramField.className = 'form-group';
          paramField.innerHTML = `
              <label for="custom-param-${i}">Parameter ${i + 1} Name:</label>
              <input type="text" id="custom-param-${i}" placeholder="e.g., id, name, value" required>
          `;
          
          customParamContainer.appendChild(paramField);
      }
  }
  
  // Listen for changes to param count
  paramCountInput.addEventListener('change', updateCustomParamFields);
  paramCountInput.addEventListener('input', updateCustomParamFields);
  
  // Create custom route
  createCustomRouteButton.addEventListener('click', () => {
      const routeName = document.getElementById('route-name').value.trim();
      const routePath = document.getElementById('route-path').value.trim();
      const paramCount = parseInt(paramCountInput.value) || 0;
      
      if (!routeName || !routePath) {
          alert('Please enter both route name and path.');
          return;
      }
      
      // Collect parameter names for custom route
      const customParams = [];
      
      for (let i = 0; i < paramCount; i++) {
          const paramInput = document.getElementById(`custom-param-${i}`);
          if (paramInput && paramInput.value.trim()) {
              customParams.push(paramInput.value.trim());
          } else {
              customParams.push(`param${i + 1}`);
          }
      }
      
      const customRoute = {
          name: routeName,
          route: routePath,
          params: customParams,
          custom: true
      };
      
      selectRoute(customRoute);
      
      // Switch to parameter section
      document.getElementById('parameter-section').scrollIntoView({ behavior: 'smooth' });
  });
  
  // Send API request
  sendRequestButton.addEventListener('click', async () => {
      if (!selectedRoute) {
          alert('Please select a route first.');
          return;
      }
      
      // Collect parameter values
      const paramData = {};
      const errors = [];
      
      for (let i = 0; i < selectedRoute.params.length; i++) {
          const paramInput = document.getElementById(`param-${i}`);
          const paramType = document.getElementById(`param-type-${i}`).value;
          const paramName = selectedRoute.params[i];
          
          if (!paramInput || !paramInput.value.trim()) {
              errors.push(`Parameter '${paramName}' is required.`);
              continue;
          }
          
          let value = paramInput.value.trim();
          
          // Convert value based on type
          try {
              switch (paramType) {
                  case 'number':
                      value = Number(value);
                      if (isNaN(value)) throw new Error(`Parameter '${paramName}' must be a valid number.`);
                      break;
                  case 'boolean':
                      value = value.toLowerCase();
                      if (value !== 'true' && value !== 'false') 
                          throw new Error(`Parameter '${paramName}' must be 'true' or 'false'.`);
                      value = value === 'true';
                      break;
                  case 'json':
                      value = JSON.parse(value);
                      break;
              }
          } catch (error) {
              errors.push(error.message);
              continue;
          }
          
          // Store parameter with its proper name
          paramData[paramName] = value;
      }
      
      if (errors.length > 0) {
          alert(`Validation errors:\n${errors.join('\n')}`);
          return;
      }
      
      // Send actual API request
      responseOutput.innerText = 'Sending request...';
      
      try {
          // Determine HTTP method based on route
          let method = 'GET';
          if (selectedRoute.name === 'write') method = 'POST';
          else if (selectedRoute.name === 'update') method = 'PUT';
          else if (selectedRoute.name === 'delete') method = 'DELETE';
          
          // Build request URL
          let url = `/${selectedRoute.route}`;
          
          // Add URL parameters for GET requests with ID or path
          if (method === 'GET' && (paramData.id || paramData.path)) {
              const paramValue = paramData.id || paramData.path;
              url += `/${paramValue}`;
          }
          
          const response = await fetch(url, {
              method,
              headers: {
                  'Content-Type': 'application/json'
              },
              body: method !== 'GET' ? JSON.stringify(paramData) : undefined
          });
          
          const data = await response.json();
          responseOutput.innerText = JSON.stringify(data, null, 2);
      } catch (error) {
          responseOutput.innerText = `Error: ${error.message}`;
      }
  });
  
  // Initialize the application
  createRouteCards();
  updateCustomParamFields();
});