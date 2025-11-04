// This utility function automatically adds the JWT to our requests

export const authFetch = async (url, options = {}) => {
  // 1. Get token from localStorage
  const token = localStorage.getItem('token'); 

  // 2. Prepare headers
  const headers = {
    // DO NOT set a default 'Content-Type' here!
    ...options.headers, // Merge any headers from the original request
  };

  // 3. If a token exists, add it to the Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // --- CRITICAL: Conditionally set Content-Type ---
  // Only set Content-Type if the body IS NOT FormData
  // (FormData requires the browser to set Content-Type automatically)
  if (!(options.body instanceof FormData)) {
      // Set default only for non-file uploads
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'; 
  }
  // --- END FIX ---


  // 4. Make the fetch request
  try {
    const response = await fetch(url, {
      ...options, // Spread original options (like method, body)
      headers,    // Use the potentially modified headers
    });
    
    // 5. Handle if the token is expired (401)
    if (response.status === 401) {
      // Log the user out
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Reload the page to trigger the login modal
      window.location.href = '/'; 
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    return response; // Return the raw response object

  } catch (error) {
     console.error("Fetch Error in authFetch:", error); 
    return Promise.reject(error);
  }
};