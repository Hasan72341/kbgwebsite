// API Configuration for fetching data from GitHub
const BASE_URL = 'https://raw.githubusercontent.com/Hasan72341/KBG_Links/refs/heads/main';

export const API_ENDPOINTS = {
  about: `${BASE_URL}/about.json`,
  events: `${BASE_URL}/events.json`,
  home: `${BASE_URL}/home.json`,
  navbar: `${BASE_URL}/navbar.json`,
  footer: `${BASE_URL}/footer.json`,
  projects: `${BASE_URL}/projects.json`,
  team: `${BASE_URL}/team.json`,
};

// Utility function to fetch data from URLs
export const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
