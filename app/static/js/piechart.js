function get_info_on_var(variable) {
  var rel_meta = meta_data.find(function(d) { return d.Variabele == variable; })

  var label = rel_meta['Label_1'];
  var definition = rel_meta['Definition'];

  return [ label, definition ]
}

function updateArea(selectObject) {
  selected_area = selectObject.value;
  updatePlot();
};

function updateAttr(selectObject) {
  selected_attr = selectObject.value;
  updatePlot();
};

function updatePlot() {
  var fetch_url =
      "/d3_plot_data?area_name=" + selected_area + "&type=" + selected_attr;
  fetch(fetch_url)
      .then(function(response) { return response.json(); })
      .then((data) => {
        data = d3.map(data[0]).entries();
        console.log(data);
        update(data);
      });
}

function arcTween(dd) {
  this._current = this._current || dd;
  var interpolate = d3.interpolate(this._current, dd);
  this._current = interpolate(0);
  return function(t) { return arc(interpolate(t)); };
}

function update(data) {
  var duration = 700;
  var key = function(d) { return get_info_on_var(d.data.key)[0]; };

  /* ------- PIE SLICES -------*/
  var slice =
      svg.select(".slices").selectAll("path.slice").data(pie(data), key);

  // insert new slices
  slice.enter()
      .insert("path")
      .style("fill", function(d) { return color(key(d)); })
      .attr("d", arc)
      .attr("stroke", "black")
      .attr("stroke-width", "2px")
      .attr("class", "slice")
      .each(function(d) { this._current = d; }); // store the initial angles

  // update existing slices
  slice.transition().duration(duration).attrTween("d", arcTween);

  slice.exit().remove();

  /* ------- VALUE LABELS -------*/
  var percent = svg.select(".percent").selectAll("text").data(pie(data), key);

  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

  percent.enter()
      .append("text")
      .attr("dy", ".35em")
      .text(function(d) { return d.data.value.toString() + "%"})
      .attr("transform",
            function(d) {
              var pos = arc.centroid(d);
              return "translate(" + pos + ")";
            })
      .style("text-anchor",
             function(d) { return midAngle(d) > Math.PI ? "start" : "end"; })
      .each(function(d) { this._current = d; }); // store the initial angles

  percent.transition()
      .duration(duration)
      .text(function(d) { return d.data.value.toString() + "%"})
      .attrTween("transform",
                 function(d) {
                   this._current = this._current || d;
                   var interpolate = d3.interpolate(this._current, d);
                   this._current = interpolate(0);
                   return function(t) {
                     var d2 = interpolate(t);
                     var pos = arc.centroid(d2);
                     // pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                     return "translate(" + pos + ")";
                   };
                 })
      .styleTween("text-anchor", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) > Math.PI ? "start" : "end";
        };
      });

  percent.exit().remove();

  /* ------- TEXT LABELS -------*/
  var text = svg.select(".labels").selectAll("text").data(pie(data), key);

  text.enter()
      .append("text")
      .attr("dy", ".35em")
      .text(key)
      .attr("width", "100px")
      .attr("transform",
            function(d) {
              var pos = outerArc.centroid(d);
              pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
              return "translate(" + pos + ")";
            })
      .style("text-anchor",
             function(d) { return midAngle(d) < Math.PI ? "start" : "end"; })
      .each(function(d) { this._current = d; }); // store the initial angles

  text.transition()
      .duration(duration)
      .attr("width", "100px")
      .attrTween("transform",
                 function(d) {
                   this._current = this._current || d;
                   var interpolate = d3.interpolate(this._current, d);
                   this._current = interpolate(0);
                   return function(t) {
                     var d2 = interpolate(t);
                     var pos = outerArc.centroid(d2);
                     pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                     return "translate(" + pos + ")";
                   };
                 })
      .styleTween("text-anchor", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start" : "end";
        };
      });

  text.exit().remove();

  /* ------- SLICE TO TEXT POLYLINES -------*/
  var polyline =
      svg.select(".lines").selectAll("polyline").data(pie(data), key);

  polyline.enter()
      .append("polyline")
      .attr("points",
            function(d) {
              var pos = outerArc.centroid(d);
              pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
              return [ arc.centroid(d), outerArc.centroid(d), pos ];
            })
      .attr("opacity", "0.3")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", "2px")
      .each(function(d) { this._current = d; }); // store the initial angles

  polyline.transition().duration(duration).attrTween("points", function(d) {
    this._current = this._current || d;
    var interpolate = d3.interpolate(this._current, d);
    this._current = interpolate(0);
    return function(t) {
      var d = interpolate(t);
      var pos = outerArc.centroid(d);
      pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
      return [ arc.centroid(d), outerArc.centroid(d), pos ];
    };
  });

  polyline.exit().remove();
};
