/// <reference path="../../node_modules/@types/d3/index.d.ts"/>

d3.json('exchange_rates.json', (rawData) => {
  let data = {};
  for (let i of rawData) data[i['base']] = i['rates'];
  let rates: { [key: string]: { [key: string]: number } } = data;
  let countries: Array<string> = d3.keys(data);
  let height = 500, width = 1550, bottumPadding = 40, topPadding = 20;

  d3.select('select').selectAll('option')
    .data(countries)
    .enter()
    .append('option')
    .attr('value', (d) => d)
    .text((d) => d);

  let currency = 'USD';

  let xsca = d3.scaleLinear()
    .domain([0, 20])
    .range([0, height]);

  function xscaler(d) {
    return xsca(Math.min(20, d));
  }

  let svg = d3.select('svg')
    .attr('width', width)
    .attr('height', topPadding + height + bottumPadding);

  let rectWidth = 50;

  let rects = svg.selectAll('rect')
    .data(d3.values(rates[currency]))
    .enter();

  rects.append('rect')
    .attr('x', (d, i) => i * rectWidth)
    .attr('y', (d) => height + topPadding - xscaler(d))
    .attr('height', (d) => xscaler(d))
    .attr('width', rectWidth / 2);

  rects.append('text')
    .attr('x', (d, i) => i * rectWidth)
    .attr('y', (d) => height + topPadding - xscaler(d) - 5)
    .text((d) => d > 20 ? d : "");

  svg.append('g').selectAll('text')
    .data(d3.keys(rates[currency]))
    .enter()
    .append('text')
    .attr('x', (d, i) => i * rectWidth)
    .attr('y', (d) => height + topPadding + bottumPadding / 2)
    .text(d => d);


});
