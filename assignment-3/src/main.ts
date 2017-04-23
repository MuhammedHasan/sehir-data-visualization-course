/// <reference path="../node_modules/@types/d3/index.d.ts"/>

class MainComponent {

    viewInit() {
        this.loadData((data) => {
            new CountriesPie('svg', data).viewInit();
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
    outherRadius = 100;
    arc = d3.arc().innerRadius(0).outerRadius(this.outherRadius);
    color = d3.scaleOrdinal(d3.schemeCategory10);

    populationScaler;
    gdpScaler;
    colorScaler;

    constructor(selector, data) {
        this.data = data;
        this.svg = d3.select(selector);
    }

    viewInit() {
        let europe = this.data['Europe'];
        this.svg.attr('height', this.height).attr('width', this.width);
        this.svg.append("g")
            .attr("transform", "translate(" + this.outherRadius + ", " + this.outherRadius + ")")
            .selectAll("path")
            .data(this.pie(europe.map(x => x[1])))
            .enter()
            .append("path")
            .attr("d", (d: any) => this.arc(d))
            .attr("fill", (d, i: any) => this.color(i))
        console.log(europe);
    }

    render() { }

}

let main = new MainComponent();
main.viewInit();
