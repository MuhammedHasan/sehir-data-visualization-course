/// <reference path="../node_modules/@types/d3/index.d.ts"/>

class MainComponent {

  viewInit() {
    this.loadData((data) => {
      let pie = new CountriesPie('svg', data);
      pie.viewInit();

      let form = new ContriesForm(['select', '#contries-checkbox-group'], data);
      form.viewInit();

      form.outputContinent((continent, countries) => pie.inputContinent(continent, countries));
    });
  }

  loadData(callback: (data) => void) {
    d3.json('countries.json', (rawData) => {
      let data = {};

      rawData.forEach(d => {
        if (!(d.continent in data)) data[d.continent] = [];
        data[d.continent].push([d.name, d.years.filter(y => y.year == 2012)[0].gdp]);
      });

      for (let continent in data)
        data[continent] = data[continent].sort((x, y) => y[1] - x[1]).slice(0, 10);

      callback(data);
    });
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
      .attr('visibility', 'visible');

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

  outputContinent(callback) {
    this.selectbox.on('change.o', _ =>
      callback(this.selectbox.property('value'), this.checkedCountries()));

    d3.selectAll("input[type='checkbox']").on('change.o', _ =>
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
