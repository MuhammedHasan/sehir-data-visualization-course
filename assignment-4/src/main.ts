/// <reference path="../node_modules/@types/d3/index.d.ts"/>

class MainComponent {

  viewInit() {
    this.loadData((d) => {
      let form = new FormComponent('#visualization-options');
      form.viewInit();

      let visualization = new VisualizationComponent('#visualization > svg', d);
      visualization.viewInit();
      form.broadcast((d) => visualization.listen(d));
    });
  }

  loadData(callback: (data) => void) {
    d3.json('countries.json', (rawData) => {
      let data = {};

      rawData.forEach(d => {
        if (!(d.continent in data)) data[d.continent] = [];
        data[d.continent].push({
          'name': d.name,
          'gdpByYears': d.years.filter(x => x.year >= 2000).map(x => [x.year, x.gdp]),
          'gdp': d.years.filter(x => x.year == 2012)[0].gdp,
          'population': d.years.filter(y => y.year == 2012)[0].population
        });
      });

      callback(data);
    });
  }

}

class FormComponent {

  data = { layout: '', colors: '', sortBy: '' };
  el;

  constructor(el) {
    this.el = d3.select(el);
  }

  viewInit() {
    this.formValues();
  }

  broadcast(callback: (options) => void) {
    this.el.selectAll('input').on('change', () => callback(this.formValues()));
    callback(this.data);
  }

  formValues() {
    this.data.layout = this.el.select('input[name="layout"]:checked').property("value");
    this.data.colors = this.el.select('input[name="colors"]:checked').property("value");
    this.data.sortBy = this.el.select('input[name="sort-by"]:checked').property("value");
    return this.data;
  }
}

class VisualizationComponent {

  data;
  el;

  width = 2000;
  height = 2000;

  tree = d3.tree().size([this.height * 0.9, this.width * 0.8]);

  colors;

  options;

  lines;
  circles;
  texts;

  hiddens = {};

  constructor(el, data) {
    this.el = d3.select(el);
    this.data = data;

    this.colors = d3.scaleOrdinal()
      .domain(Object.keys(data))
      .range(d3.schemeCategory10);
  }

  viewInit() {
    this.el = this.el
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g");

    this.bindData();

    this.lines = this.lines.enter()
      .append("path")
      .attr('class', d => d.target.parent && d.target.parent.parent ? d.target.parent.data.name : '')
      .classed('World', d => d.target.parent)
      .style("stroke", "#ccc")
      .style("stroke-width", 1.5)
      .style("fill", "none");

    this.circles = this.circles.enter()
      .append("circle")
      .attr('class', d => this.isCountryNode(d) ? d.parent.data.name : '')
      .classed('World', d => d.parent)
      .on('click', d => !(this.isCountryNode(d)) ? this.collapse(d) : graphTooltop.show(d.data.gdpByYears))
      .on("mouseover", (d) => tooltip.show(d.data.population, d.data.gdp))
      .on("mouseout", (d) => {
        tooltip.hide();
        graphTooltop.hide();
      });

    this.texts = this.texts.enter()
      .append("text")
      .attr('class', d => this.isCountryNode(d) ? d.parent.data.name : '')
      .classed('World', d => d.parent);
  }

  bindData() {
    let root = this.hierarchicalData();
    let nodes = this.tree(root).descendants();
    let links = this.tree(root).links();

    this.lines = this.el.selectAll("path").data(links);
    this.circles = this.el.selectAll("circle").data(nodes);
    this.texts = this.el.selectAll("text").data(nodes);
  }

  isCountryNode(d) {
    return d.parent && d.parent.parent;
  }

  sortBy(gdpOrPopulation) {
    if (gdpOrPopulation == 'continent') return;
    Object.keys(this.data).forEach(k =>
      this.data[k] = this.data[k].sort((x, y) => d3.ascending(x[gdpOrPopulation], y[gdpOrPopulation])));
    this.bindData();
  }

  hierarchicalData() {
    let root: any = {
      name: 'World',
      children: Object.keys(this.data)
        .map(x => ({
          name: x,
          children: this.data[x],
          gdp: this.totalProp(this.data[x], 'gdp'),
          population: this.totalProp(this.data[x], 'population')
        }))
    };
    root.gdp = this.totalProp(root.children, 'gdp');
    root.population = this.totalProp(root.children, 'population');
    return d3.hierarchy(root);
  }

  totalProp(nodeChildren, prop) {
    return d3.sum(nodeChildren.map(x => x[prop]));
  }

  diagonal(d) {
    return "M" + this.project(d.source.x, d.source.y)
      + "C" + this.project(d.source.x, (d.source.y + d.target.y) / 2)
      + " " + this.project(d.target.x, (d.source.y + d.target.y) / 2)
      + " " + this.project(d.target.x, d.target.y);
  }

  listen(options) {
    this.options = options;
    this.render();
  }

  render() {
    if (this.options.colors == "continent") this.circles.style("fill",
      (d) => this.isCountryNode(d) ? this.colors(d.parent.data.name) : this.colors(d.data.name));
    else this.circles.style('fill', '#5b5b5b');

    this.sortBy(this.options.sortBy);

    this.circles
      .transition()
      .attr("r", d => {
        if (this.isCountryNode(d))
          return Math.log(d.data.gdp / Math.pow(10, 9) + 1);
        else if (this.hiddens[d.data.name])
          return Math.log(d.data.gdp / Math.pow(10, 9) + 1) * 10;
        else
          return 10;
      })
      .attr("cx", (d) => this.project(d.x, d.y)[0])
      .attr("cy", (d) => this.project(d.x, d.y)[1]);

    this.texts
      .attr("x", (d) => this.project(d.x, d.y)[0] + 10)
      .attr("y", (d) => this.project(d.x, d.y)[1] + 5)
      .text(d => d.data.name);

    this.lines.attr("d", (d) => this.diagonal(d));

    if (this.options.layout == 'radial') {
      this.el.attr('transform', `translate(${this.width / 2},${this.height / 2})`)
    }
    else
      this.el.attr("transform", `translate(${this.width * 0.1}, ${this.height * 0.05})`);
  }

  project(x, y) {
    if (this.options.layout == 'radial') {
      var angle = (x - 90) / 180 * Math.PI / 5, radius = y / 2;
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
    }
    return [y, x];
  }

  collapse(node) {
    if (this.hiddens[node.data.name]) {
      this.hiddens[node.data.name] = false;
      d3.selectAll(`.${node.data.name}`).attr('display', 'block');
    }
    else {
      this.hiddens[node.data.name] = true;
      if (!node.parent)
        node.children.forEach(x => this.hiddens[x.data.name] = false);
      d3.selectAll(`.${node.data.name}`).attr('display', 'none');
    }
    this.render();
  }
}

class Tooltip {
  el = d3.select('#tooltip');

  show(population, gdp) {
    this.el.select('#population').text(population ? population.toLocaleString() : '');
    this.el.select('#gdp').text(gdp ? gdp.toLocaleString() : '');
    this.el.classed('hidden', false);
    this.el.style("top", `${d3.event.pageY - 10}px`).style("left", `${d3.event.pageX + 10}px`)
  }

  hide() {
    this.el.classed('hidden', true);
  }
}

class GraphTooltip {

  data = [[1, 10], [2, 20], [4, 300]];
  el = d3.select('#graph-tooltip');

  width = 350;
  height = 150;

  x = d3.scaleLinear().range([0, this.width]);
  y = d3.scaleLinear().range([this.height, 0]);

  line = d3.line()
    .x((d) => this.x(d[0]))
    .y((d) => this.y(d[1]));

  path;

  axisBottom;
  axisLeft;

  viewInit() {
    let vis = this.el.append('svg')
      .attr("width", this.width + 180)
      .attr("height", this.height + 80)
      .append('g')
      .attr('transform', 'translate(120, 30)');

    this.path = vis.append("path")
      .attr("class", "line");

    this.axisBottom = vis.append("g").attr('id', 'axisBottom')
      .attr("transform", `translate(0, ${this.height})`);
    this.axisLeft = vis.append("g").attr('id', 'axisLeft');
  }

  show(gdpByYears) {
    tooltip.hide();
    this.el.classed('hidden', false);
    this.data = gdpByYears;
    this.render();
    this.el.style("top", `${d3.event.pageY - 10}px`).style("left", `${d3.event.pageX + 10 - this.width}px`)
  }

  hide() {
    this.el.classed('hidden', true);
  }

  render() {
    this.x.domain([d3.min(this.data, (d) => d[0]), d3.max(this.data, (d) => d[0])]);
    this.y.domain([d3.min(this.data, (d) => d[1]), d3.max(this.data, (d) => d[1])]);

    this.path.data([this.data])
      .attr("d", (d) => this.line(<any>d));

    this.axisBottom.call(d3.axisBottom(this.x));
    this.axisLeft.call(d3.axisLeft(this.y));
  }

}

let tooltip = new Tooltip();

let graphTooltop = new GraphTooltip();
graphTooltop.viewInit();
graphTooltop.render();

let main = new MainComponent();
main.viewInit();
