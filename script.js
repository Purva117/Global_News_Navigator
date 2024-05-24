// Load news articles data
fetch('news_data.json')
    .then(response => response.json())
    .then(data => {
        // Loop through each news article
        data.forEach(article => {
            // Extract headline and location
            var headline = article.headline;
            var location = article.location;

            // Find the corresponding SVG path element for the location
            var svgPaths = document.querySelectorAll('path[title="' + location + '"]');

            // If SVG path elements found, add headline as text elements
            if (svgPaths.length > 0) {
                svgPaths.forEach(svgPath => {
                    // Get bounding box of SVG path
                    var bbox = svgPath.getBBox();

                    // Calculate position for text element
                    var x = bbox.x + bbox.width / 2;
                    var y = bbox.y + bbox.height / 2;

                    // Set the maximum width of the bounding box
                    var maxWidth = 200; // Set your predefined maximum width here

                    // Create a bounding box around the text element
                    var textBoundingBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    textBoundingBox.setAttribute('x', x - maxWidth / 2); // Adjust x position for left alignment
                    textBoundingBox.setAttribute('y', y - 20); // Adjust height as needed
                    textBoundingBox.setAttribute('width', maxWidth); // Set maximum width
                    textBoundingBox.setAttribute('height', 40); // Adjust height as needed
                    textBoundingBox.setAttribute('fill', 'white');
                    textBoundingBox.setAttribute('opacity', '1'); // Set opacity to 100%
                    
                    // Create text element
                    var textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textElement.setAttribute('x', x - maxWidth / 2 + 5); // Adjust x position for left alignment
                    textElement.setAttribute('y', y);
                    textElement.setAttribute('text-anchor', 'start'); // Set text anchor to start for left alignment
                    textElement.setAttribute('dominant-baseline', 'middle'); // Set vertical alignment to middle
                    textElement.setAttribute('lengthAdjust', 'spacingAndGlyphs'); // Adjust spacing to make text fit
                    textElement.setAttribute('textLength', maxWidth - 10); // Adjust text length to fit within bounding box
                    textElement.textContent = headline;

                    // Append bounding box and text element to SVG
                    svgPath.parentNode.appendChild(textBoundingBox);
                    svgPath.parentNode.appendChild(textElement);
                });
            }
        });
    })
    .catch(error => console.error('Error loading news data:', error));
