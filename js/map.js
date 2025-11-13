// ========================================
// MAP AND ELEVATION PROFILE
// Using Leaflet.js and Chart.js
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const mapElement = document.getElementById('route-map');
    const chartElement = document.getElementById('elevation-chart');

    if (!mapElement) return; // Not on a day page

    // Determine which day we're on based on the page
    const pagePath = window.location.pathname;
    let gpxFile = '';
    let dayNumber = 1;

    if (pagePath.includes('dia-1')) {
        gpxFile = 'assets/routes/etapa-1.gpx';
        dayNumber = 1;
    } else if (pagePath.includes('dia-2')) {
        gpxFile = 'assets/routes/etapa-2.gpx';
        dayNumber = 2;
    } else if (pagePath.includes('dia-4')) {
        gpxFile = 'assets/routes/etapa-3.gpx';
        dayNumber = 4;
    } else if (pagePath.includes('dia-5')) {
        gpxFile = 'assets/routes/etapa-4-opcional.gpx';
        dayNumber = 5;
    }

    // Initialize map
    const map = L.map('route-map').setView([6.2, -73.5], 10);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Store map reference for fit button
    window.routeMap = map;
    window.routeLayer = null;

    // Load and display GPX file
    if (gpxFile) {
        loadGPX(gpxFile, map, chartElement);
    } else {
        // Fallback for day 3 (no cycling)
        showNoRouteMessage(map);
    }

    // Fit map button
    const fitButton = document.getElementById('fit-map');
    if (fitButton) {
        fitButton.addEventListener('click', function() {
            if (window.routeLayer) {
                map.fitBounds(window.routeLayer.getBounds());
            }
        });
    }
});

// Load GPX file and display on map
function loadGPX(gpxPath, map, chartElement) {
    console.log('🗺️ Cargando GPX:', gpxPath);

    fetch(gpxPath)
        .then(response => {
            console.log('✅ GPX fetch response:', response.status);
            if (!response.ok) {
                throw new Error('Error al cargar GPX: ' + response.status);
            }
            return response.text();
        })
        .then(gpxText => {
            console.log('📄 GPX text loaded, length:', gpxText.length);

            const parser = new DOMParser();
            const gpxDoc = parser.parseFromString(gpxText, 'text/xml');

            // Check for parsing errors
            const parserError = gpxDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Error parsing GPX XML');
            }

            // Extract track points
            const trackPoints = gpxDoc.querySelectorAll('trkpt');
            console.log('📍 Track points found:', trackPoints.length);

            if (trackPoints.length === 0) {
                throw new Error('No se encontraron puntos de ruta en el archivo GPX');
            }

            const coordinates = [];
            const elevations = [];
            const distances = [];
            let totalDistance = 0;

            trackPoints.forEach((point, index) => {
                const lat = parseFloat(point.getAttribute('lat'));
                const lon = parseFloat(point.getAttribute('lon'));
                const eleElement = point.querySelector('ele');
                const elevation = eleElement ? parseFloat(eleElement.textContent) : 0;

                coordinates.push([lat, lon]);
                elevations.push(elevation);

                // Calculate distance
                if (index > 0) {
                    const prevLat = coordinates[index - 1][0];
                    const prevLon = coordinates[index - 1][1];
                    totalDistance += calculateDistance(prevLat, prevLon, lat, lon);
                }
                distances.push(totalDistance);
            });

            console.log('🚴 Route data processed:', {
                points: coordinates.length,
                totalDistance: totalDistance.toFixed(2) + ' km'
            });

            // Draw route on map
            const routeLayer = L.polyline(coordinates, {
                color: '#DC2F02',
                weight: 4,
                opacity: 0.8,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(map);

            console.log('✅ Route drawn on map');

            // Store layer reference
            window.routeLayer = routeLayer;

            // Fit map to route
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

            // Add start marker
            if (coordinates.length > 0) {
                L.marker(coordinates[0], {
                    icon: L.divIcon({
                        className: 'custom-marker start-marker',
                        html: '🏁',
                        iconSize: [30, 30]
                    })
                }).addTo(map).bindPopup('<strong>Inicio</strong>');

                // Add end marker
                L.marker(coordinates[coordinates.length - 1], {
                    icon: L.divIcon({
                        className: 'custom-marker end-marker',
                        html: '🎯',
                        iconSize: [30, 30]
                    })
                }).addTo(map).bindPopup('<strong>Meta</strong>');
            }

            // Create elevation profile chart
            if (chartElement && elevations.length > 0) {
                createElevationChart(chartElement, distances, elevations);
            }
        })
        .catch(error => {
            console.error('❌ Error loading GPX:', error);
            const mapContainer = document.querySelector('.route-map');
            if (mapContainer) {
                mapContainer.innerHTML = '<div class="map-error">❌ Error cargando la ruta: ' + error.message + '</div>';
            }
        });
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Create elevation profile chart
function createElevationChart(canvas, distances, elevations) {
    // Sample data for smoother chart (take every nth point)
    const sampleRate = Math.max(1, Math.floor(distances.length / 200));
    const sampledDistances = [];
    const sampledElevations = [];

    for (let i = 0; i < distances.length; i += sampleRate) {
        sampledDistances.push(distances[i].toFixed(1));
        sampledElevations.push(elevations[i].toFixed(0));
    }

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampledDistances,
            datasets: [{
                label: 'Elevación (m)',
                data: sampledElevations,
                borderColor: '#DC2F02',
                backgroundColor: 'rgba(220, 47, 2, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Perfil de Elevación',
                    font: {
                        size: 16,
                        family: 'Montserrat',
                        weight: 'bold'
                    },
                    color: '#1B4332'
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return 'Km ' + context[0].label;
                        },
                        label: function(context) {
                            return 'Elevación: ' + context.parsed.y + ' m';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Distancia (km)',
                        font: {
                            family: 'Open Sans',
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Elevación (m)',
                        font: {
                            family: 'Open Sans',
                            weight: 'bold'
                        }
                    },
                    beginAtZero: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Show message for days without cycling route
function showNoRouteMessage(map) {
    const center = [5.5, -73.5];
    map.setView(center, 8);

    L.marker(center, {
        icon: L.divIcon({
            className: 'custom-marker rest-marker',
            html: '🌲',
            iconSize: [40, 40]
        })
    }).addTo(map).bindPopup('Bosques de Pandora - Día de Descanso');

    // Add a circle to show the general area
    L.circle(center, {
        color: '#2D6A4F',
        fillColor: '#2D6A4F',
        fillOpacity: 0.1,
        radius: 20000
    }).addTo(map);
}

// ========================================
// ¡Feliz pedaleo! 🚴
// ========================================
