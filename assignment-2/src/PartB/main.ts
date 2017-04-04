/// <reference path="../../node_modules/@types/d3/index.d.ts"/>

interface Country {
  name: string;
  gdp: number;
  population: number;
}


class CountriesScatter {

  padding = 70;
  height = 500;
  width = 500;
  leftPadding = 75;

  populationScaler;
  gdpScaler;
  colorScaler;

  constructor() {
  }

  viewInit() {
    this.loadData((data) => {
      this.initScalers(data);
      this.render(data);
    });
  }

  render(data: Country[]) {
    let svgScatter = d3.select('#scatter').append('svg')
      .attr('height', this.height + 2 * this.padding)
      .attr('width', this.width + 2 * this.padding + this.leftPadding);

    svgScatter.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => this.gdpScaler(d.gdp) + this.padding + this.leftPadding)
      .attr('cy', (d) => this.populationScaler(d.population) + this.padding)
      .transition()
      .duration(1500)
      .attr('r', (d) => 10)
      .attr('fill', (d) => this.colorScaler(d.name))

    svgScatter.append('text')
      .attr('x', (this.width + 2 * this.padding + this.leftPadding) / 2)
      .attr('y', this.height + 2 * this.padding)
      .text('GDP GROWTH (%)')

    svgScatter.append('text')
      .attr('x', 0)
      .attr('y', (this.height + 2 * this.padding) / 2)
      .attr('transform', `rotate(-90, 0, ${(this.height + 2 * this.padding) / 2}) translate(-100, 40)`)
      .text('POPULATION GROWTH (%)')

    let svgLabels = d3.select('#labels').append('svg')
      .attr('height', 800)
      .attr('width', 200);

    svgLabels.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', 10)
      .attr('cy', (d, i) => i * 30 + 10)
      .attr('r', 10)
      .attr('fill', (d) => this.colorScaler(d.name));


    svgLabels.selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('x', 30)
      .attr('y', (d, i) => i * 30 + 15)
      .text((d) => d.name);

    let populationAxis = d3.axisLeft(this.populationScaler).ticks(10);

    svgScatter.append("g")
      .attr('id', 'yaxis')
      .attr("transform", `translate(${this.leftPadding + this.padding - 15},${this.padding})`)
      .call(populationAxis);

    let gdpAxis = d3.axisBottom(this.gdpScaler).ticks(5);

    svgScatter.append("g")
      .attr('id', 'xaxis')
      .attr("transform", `translate(${this.leftPadding + this.padding},${this.height + this.padding + 15})`)
      .call(gdpAxis);

  }

  initScalers(data: Country[]) {
    this.populationScaler = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.population), d3.max(data, (d) => d.population)])
      .range([this.height, 0]);

    this.gdpScaler = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.gdp), d3.max(data, (d) => d.gdp)])
      .range([0, this.width]);

    this.colorScaler = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range([...d3.schemeCategory20, ...d3.schemeCategory20b]);


  }

  loadData(callback: (data: Country[]) => void) {
    d3.json('countries.json', (rawData) => {
      let data = rawData
        .filter(d => d.continent == 'Europe')
        .map(d => {
          let year2000 = d.years.filter(y => y.year == 2000)[0];
          let year2012 = d.years.filter(y => y.year == 2012)[0];

          return {
            'name': d.name,
            'gdp': year2012.gdp - year2000.gdp,
            'population': year2012.population - year2000.population
          }
        });
      callback(data);
    });
  }

}

let scatter = new CountriesScatter();
scatter.viewInit();
