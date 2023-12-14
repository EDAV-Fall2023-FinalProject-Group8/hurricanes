// add your JavaScript/D3 to this file


// Set dimensions for the map
const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 960 - margin.left - margin.right,
   height = 500 - margin.top - margin.bottom;


//Create an SVG element to hold the map
const svg = d3.select("#map")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)


// Define a map projection
const projection = d3.geoMercator()
    .scale(400)
    .translate([width, height]);


// Define a path generator using the projection
const path = d3.geoPath()
    .projection(projection);


// Load the GeoJSON data for the map
d3.json("scripts/custom-geo.json").then(geoData => {
    // Draw the map
    svg.selectAll(".country")
        .data(geoData.features)
      .enter().append("path")
        .attr("class", "country")
        .attr("d", path);
});


// Helper function to determine the color based on the threshold
function colorForThreshold(threshold) {
    switch(threshold) {
        case "34_KT": return "blue";
        case "50_KT": return "orange";
        case "64_KT": return "red";
        default: return "black";
    }
}

function scaleRadius(radiusNm) {
    const scaleFactor = 0.2; // Adjust this based on your map's scale
    return radiusNm * scaleFactor;
}


// Load the hurricane data
d3.json("scripts/hurricanes.json").then(hurricaneData => {
    // Populate the dropdown menu
    const dropdown = d3.select("#dropdown-container").append("select");
    hurricaneData.forEach(h => {
        dropdown.append("option").text(h.id[0]).attr("value", h.id[0]);
    });

  // Function to update the map with the selected hurricane path
  function updateMap(hurricaneId) {
      const selectedHurricane = hurricaneData.find(h => h.id[0] === hurricaneId);

      // Clear existing paths and points
      svg.selectAll(".hurricane-path").remove();
      svg.selectAll(".wind-radius-circle").remove();
      svg.selectAll(".hurricane-point").remove()

      // Draw the hurricane path
      const path = svg.selectAll(".hurricane-path")
          .data([selectedHurricane.points]);

      path.enter()
          .append("path")
          .merge(path)
          .attr("class", "hurricane-path")
          .attr("d", d3.line()
              .x(d => projection([d.LONGITUDE, d.LATITUDE])[0])
              .y(d => projection([d.LONGITUDE, d.LATITUDE])[1])
          )
          .attr("fill", "none")
          .attr("stroke", "blue")
          .attr("stroke-width", 2);

      // Add circles for wind radii at each point
      selectedHurricane.points.forEach(point => {
          ["34_KT", "50_KT", "64_KT"].forEach(threshold => {
              const radiusKey = `AVG_RADIUS_${threshold}`;
              const radius = point[radiusKey]

              if (point.hasOwnProperty(radiusKey) && !isNaN(point[radiusKey]) && point[radiusKey] > 0) {

                  svg.append("circle")
                      .attr("class", `hurricane-radius-${threshold} wind-radius-circle`)
                      .attr("r", scaleRadius(point[radiusKey]))
                      .attr("cx", projection([point.LONGITUDE, point.LATITUDE])[0])
                      .attr("cy", projection([point.LONGITUDE, point.LATITUDE])[1])
                      .style("fill", "none")
                      .style("stroke", colorForThreshold(threshold))
                      .style("stroke-width", 1.5)
                      .style("stroke-opacity", 0.6);
              }
          });
      });

      // Add hover functionality for hurricane points
      svg.selectAll(".hurricane-point")
          .data(selectedHurricane.points)
          .enter()
          .append("circle")
          .attr("class", "hurricane-point")
          .attr("r", 3)  // Fixed radius for visualization
          .attr("cx", d => projection([d.LONGITUDE, d.LATITUDE])[0])
          .attr("cy", d => projection([d.LONGITUDE, d.LATITUDE])[1])
          .on("mouseover", function(event, d) {
              // Construct the tooltip content
              let tooltipContent = "Date: " + d.DATE + "<br>Wind Speed: " + d.WINDSPEED_KT + " kt<br>Location: " + d.LATITUDE + ", " + d.LONGITUDE;
              if (d.AVG_RADIUS_34_KT) tooltipContent += "<br>34 kt Radius: " + d.AVG_RADIUS_34_KT;
              if (d.AVG_RADIUS_50_KT) tooltipContent += "<br>50 kt Radius: " + d.AVG_RADIUS_50_KT;
              if (d.AVG_RADIUS_64_KT) tooltipContent += "<br>64 kt Radius: " + d.AVG_RADIUS_64_KT;

              // Display the tooltip
              d3.select("#tooltip")
                  .style("opacity", 1)
                  .html(tooltipContent)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
              d3.select("#tooltip").style("opacity", 0);
          });
  }


    // Event listener for the dropdown
    dropdown.on("change", function() {
        updateMap(this.value);
    });
});
