/// <reference path="../node_modules/@types/d3/index.d.ts"/>


let tooltip = d3.select('#tooltip');
let stacked;

class MainComponent {

  viewInit() {
    this.loadData((data, data2) => {
      let pie = new CountriesPie('#pie > svg', data);
      pie.viewInit();

      stacked = new StackedBar('#tooltip-stacked-bar svg', data2);
      stacked.viewInit();
      stacked.hide();

      let form = new ContriesForm(['select', '#contries-checkbox-group'], data);
      form.viewInit();

      form.outputContinent((continent, countries) => pie.inputContinent(continent, countries), 'p');
      form.outputContinent((continent, countries) => stacked.inputContinent(continent, countries), 's');
    });
  }

  loadData(callback: (data, rawData) => void) {
    d3.json('countries.json', (rawData) => {
      let data = {};
      let data2 = {};

      rawData.forEach(d => {
        if (!(d.continent in data)) {
          data[d.continent] = [];
          data2[d.continent] = [];
        }
        data[d.continent].push([d.name, d.years.filter(y => y.year == 2012)[0].gdp]);
        data2[d.continent].push([d.name, d.years.filter(y => y.year >= 2000).map(x => x.gdp)]);
      });

      for (let continent in data) {
        data[continent] = data[continent].sort((x, y) => y[1] - x[1]).slice(0, 10);
        data2[continent] = data2[continent].sort((x, y) => y[1][y.length] - x[1][x.length]).slice(0, 10);
      }

      callback(data, data2);
    });
  }

}

class StackedBar {

  data;
  el;

  countries;
  continent: string;

  constructor(selector, data) {
    this.data = data;
    this.el = d3.select(selector);
  }

  inputContinent(continent, countries) {
    this.continent = continent;
    this.countries = countries;
    this.render();
  }

  viewInit() {
    this.el.attr('width', 300).attr('height', 150);
  }


  render() {
    this.el.selectAll("*").remove();

    let data = this.data[this.continent].filter(x => this.countries.indexOf(x[0]) !== -1)

    let colors = d3.scaleOrdinal()
      .domain(this.data[this.continent].map(x => x[0]))
      .range(<any>d3.schemeCategory10);

    let dataset = [];
    for (let i = 0; i < 13; i++) dataset.push({});

    for (let c of data) {
      for (let i = 0; i < 13; i++) {
        dataset[i][c[0]] = c[1][i];
      }
    }

    var stack = d3.stack()
      .keys(this.countries)
      .offset(d3.stackOffsetExpand)
      .order(d3.stackOrderReverse);

    var stack_data = stack(dataset);

    var xScale = d3.scaleBand()
      .domain(<any>d3.range(<any>stack_data[0].length))
      .rangeRound([0, 300])
      .padding(0.05);

    var yScale = d3.scaleLinear()
      .domain(<any>[
        d3.min(stack_data, (d: any) => d3.min(d, (x) => x[0])),
        d3.max(stack_data, (d: any) => d3.max(d, (x) => x[1]))
      ])
      .range([0, 150]);

    this.el.selectAll("g")
      .data(stack_data)
      .enter()
      .append("g")
      .attr("class", "stacked_bars")
      .attr("fill", (d, i) => {
        return colors(d.key);
      })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter()
      .append("rect")
      .attr("x", function(d, i) {
        return xScale(i);
      })
      .attr("y", function(d) {
        return yScale(d[0]);
      })
      .attr("height", function(d) {
        return yScale(d[1]) - yScale(d[0]);
      })
      .attr("width", xScale.bandwidth());


  }

  show() {
    this.el.classed("hidden", false)
  }

  hide() {
    this.el.classed("hidden", true);
  }

  move(x, y) {
    this.el.style("top", `${d3.event.pageY - 10}px`).style("left", `${d3.event.pageX + 10}px`)
  }

}


class CountriesPie {

  data;
  svg;
  padding = 50;
  height = 500;
  width = 500;
  pie = d3.pie();
  outherRadius = 250;
  arc = d3.arc().innerRadius(0).outerRadius(this.outherRadius);


  populationScaler;
  gdpScaler;
  colorScaler;
  countries;

  continent: string;

  inputContinent(continent, countries) {
    this.continent = continent;
    this.countries = countries;
    this.render();
  }

  constructor(selector, data) {
    this.data = data;
    this.svg = d3.select(selector);
  }

  viewInit() {
    this.countries = this.data['Europe'].map(x => x[0]);
    this.svg.attr('height', this.height).attr('width', this.width);

    let gs = this.svg.append("g")
      .on("click", () => stacked.show())
      .attr("transform", "translate(" + this.outherRadius + ", " + this.outherRadius + ")")
      .selectAll("path")
      .data(this.pie(this.data['Europe'].map(x => x[1])))
      .enter();

    gs.append("path");
    gs.append("text");
  }

  render() {
    let data = this.data[this.continent].filter(x => this.countries.indexOf(x[0]) !== -1);
    let color = d3.scaleOrdinal()
      .domain(this.data[this.continent].map(x => x[0]))
      .range(<any>d3.schemeCategory10);

    let pieData = this.pie(data.map(x => x[1]));

    let paths = this.svg.selectAll("g path")
      .data(pieData);

    paths.exit().attr('visibility', 'hidden');

    paths.attr("d", (d: any) => this.arc(d))
      .attr("fill", (d, i: any) => color(data[i][0]))
      .attr('visibility', 'visible')
      .on("mouseover", () => tooltip.classed("hidden", false))
      .on("mousemove", (d, i) => {
        tooltip.select('strong').text(data[i][0]);
        tooltip.select('span').text(data[i][1]);
        return tooltip.style("top", `${d3.event.pageY - 10}px`).style("left", `${d3.event.pageX + 10}px`)
      })
      .on("mouseout", () => {
        tooltip.classed("hidden", true)
      });

    let texts = this.svg.selectAll("g text")
      .data(d3.zip(pieData, data.map(x => x[0])));

    texts.exit().attr('visibility', 'hidden');

    texts.attr("transform", d => {
      let arc = this.arc.centroid(d[0]);
      return `translate(${arc[0] * 1.3},${arc[1] * 1.3})`;
    })
      .attr('visibility', 'visible')
      .text(d => d[1]);
  }

}

class ContriesForm {

  selectbox;
  checkboxGroup;
  data;

  constructor(selector, data) {
    this.data = data;
    this.selectbox = d3.select(selector[0]);
    this.checkboxGroup = d3.select(selector[1]);
  }

  viewInit() {
    this.selectbox.selectAll('option:not([hidden])')
      .data(Object.keys(this.data))
      .enter()
      .append('option')
      .attr('value', d => d)
      .text(d => d);

    let checboxes = this.checkboxGroup.selectAll('input')
      .data(this.data['Europe'])
      .enter()
      .append('div')
      .attr('class', 'countries-checkbox')
      .attr('class', 'hidden');

    checboxes.append('input')
      .attr('type', 'checkbox')
      .property('checked', true)
      .attr('value', d => d[0]);

    checboxes.append('span').text(d => d[0]);
    this.selectbox.on('change.r', _ => this.render());
  }

  outputContinent(callback, a) {
    this.selectbox.on('change.' + a, _ =>
      callback(this.selectbox.property('value'), this.checkedCountries()));

    d3.selectAll("input[type='checkbox']").on('change.' + a, _ =>
      callback(this.selectbox.property('value'), this.checkedCountries()));
  }

  render() {
    this.checkboxWithCountries().exit().attr('class', 'hidden');
    this.checkboxWithCountries().attr('class', 'countries-checkbox')
      .select('span')
      .text(d => d[0])
    this.checkboxWithCountries().select('input').property('checked', true).attr('value', d => d[0]);
  }

  checkboxWithCountries() {
    return this.checkboxGroup.selectAll('div')
      .data(this.data[this.selectbox.property('value')]);
  }

  checkedCountries() {
    let countries = [];
    d3.selectAll(".countries-checkbox > input[type='checkbox']").each(function(d) {
      let cb = d3.select(this);
      if (cb.property("checked")) {
        countries.push(cb.property("value"));
      }
    });
    return countries;
  }

}

let main = new MainComponent();
main.viewInit();
