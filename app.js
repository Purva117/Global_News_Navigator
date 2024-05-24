// Initialize Leaflet map
var map = L.map('map', {
    minZoom: 2,
    maxZoom: 6
}).setView([20, 0], 2); // Adjusted view to cover most locations

// Add base map layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize marker cluster group
var markers = L.markerClusterGroup();

// Function to group news by coordinates
function groupNewsByCoordinates(data) {
    const groupedNews = {};

    data.forEach(news => {
        const coordinates = news.coordinates;
        const summary = news.summary; // Use summary instead of headline

        if (coordinates) {
            const key = `${coordinates[0]},${coordinates[1]}`;
            if (!groupedNews[key]) {
                groupedNews[key] = [];
            }
            groupedNews[key].push(summary);
        }
    });

    return groupedNews;
}

// Load news data from JSON file
fetch('summarized_news_data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const groupedNews = groupNewsByCoordinates(data);

        for (const coordinates in groupedNews) {
            const summaries = groupedNews[coordinates];
            const popupContent = summaries.map(summary => {
                const bulletPoints = summary.split('\n').map(line => `<li>${line.trim().replace(/\u2022/g, '')}</li>`).join('');
                return `<ul>${bulletPoints}</ul>`;
            }).join('');
            const [lat, lng] = coordinates.split(',').map(Number);

            const marker = L.marker([lat, lng])
                .bindPopup(popupContent);

            // Add marker to cluster group
            markers.addLayer(marker);
        }

        // Add cluster group to map
        map.addLayer(markers);
    })
    .catch(error => console.error('Error loading news data:', error));
