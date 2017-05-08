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
          'gdp': d.years.filter(x => x.year >= 2000).map(x => [x.year, x.gdp]),
          'population': d.years.filter(y => y.year == 2012)[0].population
        });
      });

      //for (let continent in data)
      //data[continent] = data[continent].sort((x, y) => y[1] - x[1]).slice(0, 10);

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

    let root = this.hierarchicalData();
    let nodes = this.tree(root).descendants();
    let links = this.tree(root).links();

    this.lines = this.el.selectAll("line")
      .data(links)
      .enter()
      .append("path")
      .attr('class', d => d.target.parent && d.target.parent.parent ? d.target.parent.data.name : '')
      .classed('World', d => d.target.parent)
      .style("stroke", "#ccc")
      .style("stroke-width", 1.5)
      .style("fill", "none");

    this.circles = this.el.selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr('class', d => d.parent && d.parent.parent ? d.parent.data.name : '')
      .classed('World', d => d.parent)
      .on('click', d => !(d.parent && d.parent.parent) ? this.collapse(d) : '')
      .on("mouseover", (d) => tooltip.show(d.data.population, d.data.gdp[d.data.gdp.length - 1][1]))
      .on("mouseout", (d) => tooltip.hide());

    this.texts = this.el.selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr('class', d => d.parent && d.parent.parent ? d.parent.data.name : '')
      .classed('World', d => d.parent)
      .text(d => d.data.name);
  }

  hierarchicalData() {
    let root = {
      name: 'World',
      children: Object.keys(this.data)
        .map(x => ({ 'name': x, children: this.data[x] }))
    };
    return d3.hierarchy(root);
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
      (d) => d.parent && d.parent.parent ? this.colors(d.parent.data.name) : this.colors(d.data.name));
    else this.circles.style('fill', '#5b5b5b');

    this.circles
      .transition()
      .attr("cx", (d) => this.project(d.x, d.y)[0])
      .attr("cy", (d) => this.project(d.x, d.y)[1]);

    this.texts
      .attr("x", (d) => this.project(d.x, d.y)[0] + 10)
      .attr("y", (d) => this.project(d.x, d.y)[1] + 5);

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
    if (node.hidden) {
      node.hidden = false;
      d3.selectAll(`.${node.data.name}`).attr('display', 'block');
    }
    else {
      node.hidden = true;
      d3.selectAll(`.${node.data.name}`).attr('display', 'none');
    }
  }
}

class Tooltip {
  el = d3.select('#tooltip');

  show(population, gdp) {
    this.el.select('#population').text(population);
    this.el.select('#gdp').text(gdp);
    this.el.classed('hidden', false);
    this.el.style("top", `${d3.event.pageY - 10}px`).style("left", `${d3.event.pageX + 10}px`)
  }

  hide() {
    this.el.classed('hidden', true);
  }
}

let tooltip = new Tooltip();

let main = new MainComponent();
main.viewInit();
