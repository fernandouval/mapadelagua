let cuencaMap = function (options) {
    let self = {};

    for (let key in options) {
        self[key] = options[key];
    }

    self.parent_select = "#" + self.parent_id;

    self.custom_color = {
        'Alta': "#ffeda0",
        'Media': "#feb24c",
        'Baja': "#f03b20",
    };

    self.init = function (feature) {
        self.svg = d3.select(self.parent_select)
            .attr("width", self.width)
            .attr("height", self.height);

        self.svg.selectAll('g').remove();

        self.g = self.svg.append('g');
        self.g1 = self.g.append('g');
        self.g2 = self.g.append('g');
        self.labels = self.g.append('g');
    };

    self.render = function (feature, deps, proj, color) {
        let path = d3.geoPath();
        let d = feature;
        let bounds = path.bounds(d),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2,
            scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / self.width, dy / self.height))),
            translate = [self.width / 2 - scale * x, self.height / 2 - scale * y];

        let zoom = d3.zoom()
            // .scaleExtent([scale, 2 * scale])
            .scaleExtent([scale, scale])
            .on("zoom", function () {
                self.g.attr("transform", d3.event.transform);
            });

        let t = textures.lines()
            .orientation("vertical", "horizontal")
            .size(5/scale)
            .strokeWidth(1.25 / scale)
            .stroke(color);

        self.svg.call(t);

        self.g2
            .append("path")
            .datum(feature)
            .attr("d", path)
            .style("stroke", color)
            .style("stroke-width", 2.5 / scale)
            .style("fill", t.url());

        self.svg
            .call(zoom)
            // .on("mousedown.zoom", null)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));

        self.renderDepartamentos(deps, proj, scale);
    };

    self.renderDepartamentos = function (deps, proj, scale) {
        let path = d3.geoPath().projection(proj);
        self.g1
            .selectAll("path")
            .data(deps.features)
            .enter()
            .append("path")
            .style("fill", "rgba(17, 17, 17, 0.25)")
            .style("stroke", "#111")
            .style("stroke-width", 2.5 / scale)
            .attr("id", function (d, i) {
                return i;
            })
            .attr("d", path);

        self.labels
            .selectAll("text")
            .data(deps.features)
            .enter()
            .append("text")
            .text(function (d) {
                return d.properties.name;
            })
            .attr('font-size', (15 / scale) + 'px')
            .attr('fill', '#fff')
            .attr("id", function (d, i) {
                d.centroid = path.centroid(d);
                return 'label-' + i;
            })
            .attr('x', function (d) { return d.centroid[0]; })
            .attr('y', function (d) { return d.centroid[1]; })
            .style('text-anchor', 'middle');
    };

    self.init();
    return self;
};