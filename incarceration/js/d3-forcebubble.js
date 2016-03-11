var dataSource ='./data/pop_demo_test.csv'
var width = 1360, height = 750;
var blah;
var mycenters;
//var width = 800, height = 800;

$.when(
    $.getScript( "http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.13/d3.min.js" ),
    $.getScript( "https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js" ),
    $.getScript( "http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js" ),
    $.Deferred(function( deferred ){
        $( deferred.resolve );
    })
    ).done(function(){
    
    
    d3.csv(dataSource, function (error, data) {
    //data.sort(d3.ascending);
    //data.sort(function (a, b) {return d3.ascending(a.school,b.school);});
    blah = data;    

    //colors for bubbles
    var fill = d3.scale.ordinal().range(["#bdc9e1","#7bccc4","#bdc9e1","#7bccc4","#2b8cbe","#2b8cbe","#045a8d","#045a8d"])
    var svg = d3.select("#demoChart").append("svg")
        .attr("width", width)
        .attr("height", height);


    for (var j = 0; j < data.length; j++) {
      //can use this format to change size by value: +data[j].comb/2  
      data[j].radius = 15;
      data[j].x = Math.random() * width;
      data[j].y = Math.random() * height;
    }

    var padding = 2;
    var maxRadius = d3.max(_.pluck(data, 'radius'));

    var getCenters = function (vname, size) {
      var centers, map;
      centers = _.uniq(_.pluck(data, vname)).map(function (d) {
        console.log(d);
        return {name: d, value: 1};
      });
      mycenters = centers;
      
      map = d3.layout.treemap().size(size).ratio(1/1);
      map.nodes({children: centers});

      return centers;
    };

    var force = d3.layout.force()
        
    var nodes = svg.selectAll("circle")
      .data(data);
      
    nodes.enter().append("circle")
      .attr("class", "node")
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
      .attr("r", function (d) { return d.radius; })
      .on("mouseover", function (d) { showPopover.call(this, d); })
      .on("mouseout", function (d) { removePopovers(); })
       
       //[settings2]: column name to determine color of balls, replace school with your column
      .style("fill", function (d) { return fill(d.race); })

    draw('type');

    //filter
    $( ".btn" ).click(function() {
      draw(this.id);
    });

    function draw (varname) {
      var centers = getCenters(varname, [width-100, height-100]);
      force.on("tick", tick(centers, varname));
      labels(centers,varname)
      force.start();
    }

    function tick (centers, varname) {
      var foci = {};
      for (var i = 0; i < centers.length; i++) {
        foci[centers[i].name] = centers[i];
      }
      return function (e) {
        for (var i = 0; i < data.length; i++) {
          var o = data[i];
          var f = foci[o[varname]];
          o.y += ((f.y + (f.dy / 2)) - o.y) * e.alpha;
          o.x += ((f.x + (f.dx / 2)) - o.x) * e.alpha;
        }
        nodes.each(collide(.11))
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });
      }
    }
    
    function labels (centers,varname) {
        
      svg.selectAll(".label").remove();

      svg.selectAll(".label")
      .data(centers).enter().append("text")
      .attr("class", "label")
      .text(function (d) {          
                          var slist = $.grep(data, function(e){ 
                                    return e[varname] == d.name; 
                          }); 
                           //[settings4]: DO NOT replace d.name nor slist.length. Do replace 733 with the total count of data
                           //TODO: calculate total count of data dynamically
                          return d.name+": "+slist.length + "%";   //+" ("+Math.round(slist.length/100*100)+"%)" 
                        })
      .call(wrap, 120)
      .attr("transform", function (d) {
        return "translate(" + (d.x + (d.dx / 2 - 50)) + ", " + (d.y + 20) + ")";
      });
    }

   function removePopovers () {
      $('.popover').each(function() {
        $(this).remove();
      }); 
    }

    function showPopover (d) {
      $(this).popover({
        placement: 'auto top',
        container: 'body',
        trigger: 'manual',
        html : true,
        content: function() { 
         //[settings5]: replace all the following columns with your columns
          return "Race: " + d.race
          }
      });
      $(this).popover('show')
    }
    
    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")) || 0,
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
        
        //IE 7, 9, 10 throw error for getComputedTextLength
        try{
            tSpanLength=tspan.node().getComputedTextLength();
        }catch(e){
            tSpanLength=8 //just set it to 8 
        }
        
          if (tSpanLength > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(data);
      return function (d) {
        var r = d.radius + maxRadius + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + padding;
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }
  });//end of data

});