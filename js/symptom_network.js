function drawNetwork(state, period, id){
    var width = 960, height = 600;

    // https://beta.observablehq.com/@mbostock/d3-force-directed-graph
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("center", d3.forceCenter(width/2, height/2));

    //  define the svg
    var svg = d3.select(id);

    // helper functions
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    // function dragended(d) {
    //     if (!d3.event.active) simulation.alphaTarget(0);
    // }

    function releasenode(d) {
        d.fx = null;
        d.fy = null;
    }

    // https://stackoverflow.com/questions/6823286/create-unique-colors-using-javascript
    function randomColors(n){
        var r = [], color;
        d3.range(n).forEach(function(d){
            color = hsvToRgb(d*360/(n-1), 100, 100); 
            r.push("rgb(" + color.join() + ")");
        })
        return r;
    }

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var corrWidthScale = d3.scalePow()
        .domain([0.5, 1])
        .range([1, 4]);

    var corrOpacityScale = d3.scalePow()
        .domain([0.5, 0.75])
        .range([0.05, 1.0])

    // define colors
    var numUniqueClusters = 64;
    var colors = randomColors(numUniqueClusters);
    var mapping = d3.shuffle(d3.range(numUniqueClusters));

    // load the data
    var state = 'AL', period = '2005-01', id = "#networksvg"; // defaults
    var nodes = [], links = [];
    // var queryFileName = "./network_query.php?state=" + state + "&period=" + period + "&query=0"
    var queryFileName = "./nodes.json";
    var nodeJson = d3.json(queryFileName);
    queryFileName = "./edges.json";
    // queryFileName = "./network_query.php?state=" + state + "&period=" + period + "&query=1"
    var edgeJson = d3.json(queryFileName);

    Promise.all([nodeJson, edgeJson]).then(function(values){
        var nodeData = values[0], edgeData = values[1];
        nodeData.forEach(function(d) {
            nodes.push({ id: d.symptom, cluster: d.cluster });
        });
        edgeData.forEach(function(d) {
            if (d.symptom != d.pair & d[period] < 1) {
                links.push({
                    source: d.symptom,
                    target: d.pair,
                    value: d[period]
                });
            }
        });

        // define the links
        // https://bl.ocks.org/almsuarez/baa897c189ed64ba2bb32cde2876533b
        var link = svg.append("g")
            .attr('class', 'links')
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", 1)// function(d) { return corrWidthScale(d.value); });
            .style("opacity", function(d) { return corrOpacityScale(d.value); })
            //.style("stroke", function(d) { return corrDarknessScale(d.value); })

        link.on('mouseover.tooltip', function(d) {
            tooltip.transition()
                .duration(300)
                .style("opacity", .8);
            tooltip.html("Source: "+ d.source.id + 
                         "<br/>Target: " + d.target.id +
                         "<br/>Correlation: "  + d.value)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on("mouseout.tooltip", function() {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        })
        .on("mousemove", function() {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        });

        // define the nodes
        // https://bl.ocks.org/heybignick/3faf257bbbbc7743bb72310d03b86ee8
        var node = svg.append("g")
            .attr('class', 'nodes')
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged))            

        // define the circles
        var circles = node.append("circle")
            .attr("r", 6)
            .style("fill", function(d) { return colors[mapping[d.cluster]]; })

        // define the node labels
        var labels = node.append("text")
            .text(function(d) { return d.id; })            
            .attr("x", 8)
            .attr("y", 9);

        node.on('dblclick', releasenode);
          // .on('mouseover.tooltip', function(d) {
          //     tooltip.transition()
          //       .duration(300)
          //       .style("opacity", .8);
          //     tooltip.html(d.id)
          //       .style("left", (d3.event.pageX) + "px")
          //       .style("top", (d3.event.pageY + 10) + "px");
          //   })
          // .on("mouseout.tooltip", function() {
          //     tooltip.transition()
          //       .duration(100)
          //       .style("opacity", 0);
          //   })
          // .on("mousemove", function() {
          //   tooltip.style("left", (d3.event.pageX) + "px")
          //     .style("top", (d3.event.pageY + 10) + "px");
          // })

        // node.append("title")
        //     .text(function(d) { return d.id; });
        // https://bl.ocks.org/almsuarez/baa897c189ed64ba2bb32cde2876533b

        simulation.nodes(nodes).on("tick", ticked);
        simulation.force("link").links(links);

        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            node
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })

        };
    });
}