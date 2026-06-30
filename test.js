const query = `
[out:json][timeout:10];
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"](around:1000, 28.753, 77.498);
  node["highway"~"motorway_junction"](around:1000, 28.753, 77.498);
);
out geom;
`;

fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query))
  .then(r => r.json())
  .then(data => {
    if (data.elements) {
      console.log('Elements count:', data.elements.length);
    } else {
      console.log('No elements, data is:', data);
    }
  })
  .catch(console.error);
