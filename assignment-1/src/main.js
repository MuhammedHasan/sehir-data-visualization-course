var data = {
    "Tracksuit": [300, 0],
    "Shoes": [100, 0],
    "Racket": [200, 0],
    "Tennis Ball": [20, 0],
    "Sunglasses": [150, 1],
    "Watch": [1000, 1],
    "Necklace": [500, 1],
    "Coffee": [5, 1],
    "Apple": [2, 2],
    "Cucumber": [1, 2],
    "Chicken": [10, 2],
    "Rice": [15, 2]
};

var rainbowColors = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3",
    "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd"
];

var budget = (function() {

    function Budget() {
        this.initial = 0;
        this.expenses = 0;
        this.expenseCategority = [0, 0, 0];
    };

    Budget.prototype.render = function() {
        d3.select("#initial-budget").text(this.initial);
        d3.select("#total-expenses").text(this.expenses);
        var remaining = this.initial - this.expenses;
        var remainingColor = remaining >= 0 ? "black" : "red";
        d3.select("#remaining-budget").style("color", remainingColor).text(remaining);
        if (chart) chart.render();
    };

    Budget.prototype.set = function() {
        var input = document.getElementById("budget-input");
        this.initial = input.value;
        input.value = 0;
        this.render();
    };

    Budget.prototype.reset = function() {
        this.initial = 0;
        this.expenses = 0;
        this.expenseCategority = [0, 0, 0];
        this.render();
    };

    Budget.prototype.spend = function(x, categority) {
        this.expenses += x;
        this.expenseCategority[categority] += x;
        this.render();
    };

    var budget = new Budget();
    budget.render();

    return budget;
})();

var budgetTable = (function() {

    function BudgetTable() {
        this.colors = ["rgb(158, 255, 48)", "orange", "rgb(107, 157, 255)"];
        this.count = 1;
        this.selectedColor = undefined;
    };

    BudgetTable.prototype.render = function() {
        d3.select("tbody").selectAll("tr").selectAll("td")
            .data(this.colors)
            .style("background-color", function(d) {
                return d
            });
        document.getElementById("count-input").value = this.count;
    };

    BudgetTable.prototype.change = function(c) {
        this.count = c + parseInt(document.getElementById("count-input").value);
        this.render();
    };

    BudgetTable.prototype.changeColor = function(c) {
        if (this.selectedColor) this.colors[c] = this.selectedColor;
        this.render();
    };

    BudgetTable.prototype.spend = function(itemName, ctg) {
        var expendData;
        var categority;
        if (itemName == "Other") {
            var input = document.getElementById("other-input")
            expend = input.value;
            input.value = 0;
            categority = ctg;
        } else {
            expend = data[itemName][0];
            categority = data[itemName][1];
        }
        this.change(0);
        budget.spend(expend * this.count, categority);
    }

    var budgetTable = new BudgetTable();
    budgetTable.render();

    d3.select("tbody").selectAll("td").each(function() {
        var el = d3.select(this);
        if (el.text() != "Other")
            el.on("click", function() {
                budgetTable.spend(el.text());
            });
    });

    d3.select("#rainbow").selectAll("div").data(rainbowColors)
        .enter()
        .append("div")
        .attr("class", "rainbow-item")
        .style("background-color", function(d) {
            return d;
        })
        .on("click", function(d) {
            budgetTable.selectedColor = d;
        });

    return budgetTable;
})();
var chart = (function() {

    var width = 650,
        height = 500;

    function BarChart() {
        this.svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height);
    };

    BarChart.prototype.render = function() {
        var that = this;

        var percentage = [0, 0, 0];

        this.svg.selectAll("*").remove();

        var e = d3.sum(budget.expenseCategority);

        if (e == 0) return;

        for (var i = 0; i < budget.expenseCategority.length; i++) {
            percentage[i] = budget.expenseCategority[i] / e;
        }

        var xScale = [50, 250, 450];

        var data = d3.zip(percentage, xScale);

        this.svg.selectAll("rect").data(data)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return height - 30 - ((height - 60) * d[0]);
            })
            .attr("x", function(d) {
                return d[1];
            })
            .attr("height", function(d) {
                return ((height - 60) * d[0]);
            })
            .attr("width", 50);

        this.svg.append("g").selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("x", function(d) {
                return d[1] + 10;
            })
            .transition(100)
            .attr("y", function(d) {
                return height - 40 - ((height - 60) * d[0]);
            })
            .text(function(d) {
                return parseInt(100 * d[0]) + " %";
            });

        this.svg.append("g").selectAll("text")
            .data(d3.zip(data, ["Sports", "Luxury", "Food"]))
            .enter()
            .append("text")
            .attr("y", function(d) {
                return height - 10;
            })
            .attr("x", function(d) {
                return d[0][1] + 5;
            })
            .text(function(d) {
                return d[1];
            });
    }

    var chart = new BarChart();
    chart.render();

    return chart;
})();
