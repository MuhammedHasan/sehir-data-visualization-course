/// <reference path="../node_modules/@types/d3/index.d.ts"/>

interface Country {
  name: string;
  gdp: number;
  population: number;
}

class CountriesScatter {

  padding = 50;
  height = 500;
  width = 500;
  data;

  populationScaler;
  gdpScaler;
  colorScaler;

  viewInit() {
    this.loadData((data) => {
      let europe = data['Europe'];
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

let scatter = new CountriesScatter();
scatter.viewInit();
