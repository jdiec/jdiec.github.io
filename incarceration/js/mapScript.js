var prisonPopData;
var profitData;
var csvData;
var changeChoropleth;
var updateMapAndCost;

var light = 'light';
var moderate = 'moderate';
var midlite = 'midlite';
var midheavy = 'midheavy';
var heavy ='heavy';
var extreme = 'extreme';
var mybool = true;


/*CONVERTS NUMBER TO FILLKEY DATA*/
var popDataToColor = function(numData) {
    if (numData < 5000) {
      return "light";
    }
    else if (numData < 10000) {
      return "moderate";
    }
    else if (numData < 20000) {
      return "midlite";
    }
    else if (numData < 40000) {
      return "midheavy";
    }
    else if (numData < 60000) {
      return "heavy";
    }
    else {
      return "extreme";
    }
}

var mycsv;
//reads in json state data
//each state contains a fillkey and inmate population
d3.json("data/stateData.json", function(error1, json) {


  d3.csv("data/costData.csv", function(error2, costD) {
  //reads in data for number of prisoners by state across time
    d3.csv("data/prisonerData.csv", function(error3, d) {

        costData = costD;
        csvData = d;
        prisonPopData = json;
        var i = 0;

        /*CODE TO BUILD LEGEND*/
        var colors = d3.scale.quantize()
        .range(['#ffffb2','#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026']);
        
        var legend = d3.select('#legend')
          .append('ul')
            .attr('class', 'list-inline');

        var keys = legend.selectAll('li.key')
            .data(colors.range());

        keys.enter().append('li')
            .attr('class', 'key')
            .style('border-top-color', String)
            .text(function(d) {
                if (d == '#ffffb2') {
                  return 0;
                }
                else if (d == '#fed976') {
                  return 5000;
                }
                else if (d == '#feb24c') {
                  return 10000;
                }
                else if (d == '#fd8d3c') {
                  return 20000;
                }
                else if (d == '#f03b20') {
                  return 40000;
                }
                else {
                  return 60000;
                }
            });
        /*END LEGEND CODE*/

        //edit the state data to start at the first entry, 1982
        for (property in prisonPopData) {
            if (prisonPopData.hasOwnProperty(property)) {
              var state = prisonPopData[property];
              state.inmatePop = csvData[i]["1982"];
              state.fillKey = popDataToColor(parseInt((state.inmatePop).replace(/,/g, ''), 10));
            }
            i++;
          }


      

        var prisonPopMap = new Datamap({
        scope: 'usa',
        element: document.getElementById('inmateMap'),
        geographyConfig: {
          highlightBorderColor: '#bada55',
          highlightFillColor: '#bada55',
         popupTemplate: function(geography, data) {
            return '<div class="hoverinfo"> <b>' + geography.properties.name + '</b>  <h5>Number of Prisoners: ' +  (data.inmatePop) + ' </h5>'
          },
          highlightBorderWidth: 3
        },
        //taken from colorbrewer
        fills: {
        'light': '#ffffb2',
        'moderate': '#fed976',
        'midlite': '#feb24c',
        'midheavy': '#fd8d3c',
        'heavy': '#f03b20',
        'extreme': '#bd0026',
        defaultFill: '#ffffb2'
      },
      data:prisonPopData
      });
      prisonPopMap.labels();

      var odm = document.getElementById('odometer');
      var staticCash = document.getElementById('staticCash');
      function formatNumber (num) {
            return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

      //update map and cost number when slider is changed
      //uses the changeChoropleth helper function
      updateMapAndCost = function(year) {
          changeChoropleth(year);
           var index = parseFloat(year)-1982;
           var yearlyCost = parseFloat(costData[index]["Cost"])*1000000000;
           odm.style.display = 'none';
           staticCash.style.display = 'block';
           staticCash.innerHTML = formatNumber(yearlyCost);
        }


      var year = "1982";


      //this function corresponds to the input slider
      //year is a string
      changeChoropleth = function(year) {
        var iterator = 0;
        for (property in prisonPopData) {
            if (prisonPopData.hasOwnProperty(property)) {
              var state = prisonPopData[property];
              state.inmatePop = csvData[iterator][year];
              state.fillKey = popDataToColor(parseInt((state.inmatePop).replace(/,/g, ''), 10));
            }
            iterator++;
          }

        prisonPopMap.updateChoropleth(prisonPopData);
      }

      var slider = document.getElementById('slider');
      //animates the choropleth and slider bar
      var animateChoropleth = window.setInterval(function() {
        var newSliderYear = parseInt(slider.value)+1;
        slider.value = (newSliderYear);
        var iterator = 0;
      
          for (property in prisonPopData) {
            if (prisonPopData.hasOwnProperty(property)) {
              var state = prisonPopData[property];
              state.inmatePop = csvData[iterator][year];
              state.fillKey = popDataToColor(parseInt((state.inmatePop).replace(/,/g, ''), 10));
            }
            iterator++;
          }

        prisonPopMap.updateChoropleth(prisonPopData);
        if (parseInt(year) < 2009) {
          year = "" + (parseInt(year)+1);
        }
        else {
          stopAnimation();
        }
      }, 370);
      
      function stopAnimation() {
          clearInterval(animateChoropleth);
      }


      
    });
  });
});

setTimeout(function(){
    odometer.innerHTML = 74100000000;
}, 500);