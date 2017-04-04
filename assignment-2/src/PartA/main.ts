/// <reference path="../../node_modules/@types/d3/index.d.ts"/>

d3.json('exchange_rates.json', (rawData) => {
  let data = {};
  for (let i of rawData) data[i['base']] = i['rates'];
  let rates: { [key: string]: { [key: string]: number } } = data;
  let countries: Array<string> = d3.keys(data);
  let height = 500, width = 1550, bottumPadding = 40, topPadding = 20, leftPadding = 60;

  let linearScaler = d3.scaleLinear()
    .domain([20, 0])
    .range([0, height]);

  let logScaler = d3.scaleLog()
    .domain([20, 1])
    .range([0, height]);

  let scaler = linearScaler;
  function xscaler(d) {
    let scalerName = d3.select('input[name=scaler]:checked').attr('value');
    if (scalerName == 'linear') {
      scaler = linearScaler;
      return scaler(Math.min(20, d));
    }
    else if (scalerName == 'log') {
      scaler = logScaler;
      return scaler(Math.min(20, d + 1));
    }
  }

  let svg = d3.select('svg')
    .attr('width', width + leftPadding)
    .attr('height', topPadding + height + bottumPadding);

  svg.append('line')
    .attr('x1', leftPadding - 10)
    .attr('x2', width + leftPadding)
    .attr('y1', height + topPadding + 1)
    .attr('y2', height + topPadding + 1);

  let rectWidth = 50;
  let currency = 'USD';

  let rects = svg.selectAll('rect')
    .data(d3.values(rates[currency]))
    .enter();

  rects.append('rect')
    .attr('x', (d, i) => i * rectWidth + leftPadding)
    .attr('y', (d) => xscaler(d) + topPadding)
    .attr('width', rectWidth / 2)
    .attr('height', (d) => height - xscaler(d));

  rects.append('text')
    .attr('x', (d, i) => i * rectWidth + leftPadding - 5)
    .attr('y', (d) => 15)
    .attr('class', 'rects-texts')
    .text((d) => d)
    .style('fill', 'white');

  svg.append('g').selectAll('text')
    .data(d3.keys(rates[currency]))
    .enter()
    .append('text')
    .attr('class', 'rects-labels')
    .attr('x', (d, i) => i * rectWidth + leftPadding)
    .attr('y', (d) => height + topPadding + bottumPadding / 2)
    .text(d => d);

  function render() {

    let rects = svg.selectAll('rect')
      .data(d3.values(rates[currency]));

    rects.transition().duration(250)
      .attr('y', (d) => xscaler(d) + topPadding)
      .attr('height', (d) => height - xscaler(d));

    svg.selectAll('.rects-texts')
      .data(d3.values(rates[currency]))
      .transition()
      .delay(250)
      .text((d) => d)
      .style('fill', (d) => d >= 20 ? 'black' : 'white');

    svg.selectAll('text.rects-labels')
      .data(d3.keys(rates[currency]))
      .text(d => d);

    svg.selectAll('g#axis').remove();

    var xAxis = d3.axisLeft(scaler).ticks(5);
    svg.append("g")
      .attr('id', 'axis')
      .attr("transform", "translate(" + (leftPadding - 5) + "," + topPadding + ")")
      .call(xAxis);
  }

  let select = d3.select('select');

  select.selectAll('option')
    .data(countries)
    .enter()
    .append('option')
    .attr('id', (d) => d)
    .attr('value', (d) => d)
    .text((d) => d);

  select.on('change', function() {
    currency = d3.select(this).property('value');
    render();
  });

  d3.select('#USD').attr("selected", '');
  render();

  d3.selectAll('input[name=scaler]').on('change', render);

});
