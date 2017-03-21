/// <reference path="node_modules/@types/d3/index.d.ts"/>

// let dataset = [];
//
// for (var i = 0; i < 25; i++) {
//   var newNumber = Math.random() * 500;
//   dataset.push(newNumber);
// }
//
// dataset.sort((x, y) => x - y);
// console.log(dataset);
//
// d3.select("body").selectAll("div")
//   .data(dataset)
//   .enter()
//   .append("div")
//   .attr("class", "bar")
//   .style("height", d => d + "px");

let width = 500, heigth = 250;


let dataset = [
  [5, 20], [480, 90], [250, 50], [100, 33], [330, 95],
  [410, 12], [475, 44], [25, 67], [85, 21], [220, 88]
];

var xScale = d3.scaleLinear()
  .domain([
    d3.min(dataset, d => d[0]),
    d3.max(dataset, d => d[0])
  ])
  .range([0, width]);

var yScale = d3.scaleLinear()
  .domain([
    d3.min(dataset, d => d[1]),
    d3.max(dataset, d => d[1])
  ])
  .range([0, heigth]);

var rScale = d3.scaleLinear()
  .domain([
    d3.min(dataset, d => d[1]),
    d3.max(dataset, d => d[1])
  ])
  .range([2, 5]);


var svg = d3.select("body")
  .append("svg")
  .attr("width", width + 50)
  .attr("height", heigth + 100);

// Draw circles of a fixed size by using data values as coordinates
svg.selectAll("circle")
  .data(dataset) // an array of [x,y] values
  .enter()
  .append("circle") // draw a circle for each array element [x,y]
  .attr("cx", function(d) { // d is [x,y]. cx gets x
    return xScale(d[0]);
  })
  .attr("cy", function(d) { // d is [x,y]. cy gets y
    return yScale(d[1]);
  })
  .attr("r", 5)
  .attr("r", function(d) {
    return rScale(d[1]); // remember that circle area (size) is  πr 2
  });

var xAxis = d3.axisBottom(xScale).ticks(5);
svg.append("g")
  .attr("class", "axis") //Assign ‘g’ a class called ‘axis’
  .attr("transform", "translate(0," + (heigth + 50) + ")")
  .call(xAxis);
