/// <reference path="../node_modules/@types/d3/index.d.ts"/>

class CountriesPie {

  padding = 50;
  height = 500;
  width = 500;
  data;
  pie = d3.pie();
  outherRadius = 100;
  arc = d3.arc().innerRadius(0).outerRadius(this.outherRadius);
  svg = d3.select('svg').attr('height', this.height).attr('width', this.width);
  color = d3.scaleOrdinal(d3.schemeCategory10);

  populationScaler;
  gdpScaler;
  colorScaler;

  viewInit() {
    this.loadData((data) => {
      let europe = data['Europe'];
      this.svg.append("g")
        .attr("transform", "translate(" + this.outherRadius + ", " + this.outherRadius + ")")
        .selectAll("path")
        .data(this.pie(europe.map(x => x[1])))
        .enter()
        .append("path")
        .attr("d", (d: any) => this.arc(d))
        .attr("fill", (d, i: any) => this.color(i))
      console.log(europe);
    });
  }

  render() { }

  loadData(callback: (data) => void) {
    d3.json('countries.json', (rawData) => {
      let data = {};

      rawData.forEach(d => {
        if (!(d.continent in data)) data[d.continent] = [];
        data[d.continent].push([d.name, d.years.filter(y => y.year == 2012)[0].gdp]);
      });

      for (let continent in data)
        data[continent] = data[continent].sort((x, y) => y[1] - x[1]).slice(0, 10);

      this.data = data;
      callback(data);
    });
  }

}

let pie = new CountriesPie();
pie.viewInit();
