// Getting references

function init() {
    getOptions();
}

// Initialze the dashboard - This will be the first call whenever we refresh the page
init();

// Create a function to get the options or names of different samples available 
function getOptions() {
    // Grab the reference element to dropdown element select element
    var selDataset = document.getElementById('selDataset');
    // Use the list of sample names to populate the select sample
    Plotly.d3.json('/names', function (error, samplenames) {
        console.log("I am here")
        for (var i = 0; i < samplenames.length; i++) {
            var currentOption = document.createElement('option');
            currentOption.text = samplenames[i];
            currentOption.value = samplenames[i];
            selDataset.appendChild(currentOption)
        }
        getData(samplenames[0], buildCharts);
    })
}

// Create a function to get the sample data from the urls - sample/sample and 'otu'
function getData(sample, callback) {

    Plotly.d3.json('/samples/'+sample, function (error, sampleData) {
        if (error) return console.warn(error);
        console.log("i am at get data")
        Plotly.d3.json('/otu', function (error, otuData) {
            console.log('otuData',otuData)
            if (error) return console.warn(error);
            callback(sampleData, otuData);
        });
    });
    Plotly.d3.json('/metadata/'+sample, function(error, metaData) {
        if (error) return console.warn(error);
        console.log('i am at metadata')
        updateMetaData(metaData);
    });
    // BONUS - Build the Gauge Chart
    buildGauge(sample);
}

function optionChanged(newsample){
    getData(newsample, updateCharts);
}
// Create a function to build the basic charts when the page loads
function buildCharts(sampleData, otuData) {

    //Loop through sample data and find the OTU Taxonomic Name
    var labels = sampleData[0]['otu_ids'].map(function (item) {
        return otuData[item]
    });
    //Build PIE Chart
    console.log("I am at charts")
    console.log(sampleData[0]['sample_values'].slice(0, 10))
    console.log(sampleData[0]['otu_ids'].slice(0, 10))
    console.log(labels.slice(0, 10))

    var piedata = [{

        values: sampleData[0]['sample_values'].slice(0, 10),
        labels: sampleData[0]['otu_ids'].slice(0, 10),
        hovertext: labels.slice(0, 10),
        hoverinfo: 'hovertext',
        type: 'pie'
    }];

    var pielayout = { height:400, width:400 };

    var PIE = document.getElementById('pie_chart');
    Plotly.plot(PIE, piedata, pielayout);

    // Build Bubble Chart

    var bubbleData = [{
        x: sampleData[0]['otu_ids'],
        y: sampleData[0]['sample_values'],
        text: labels,
        mode: 'markers',
        marker: {
            size: sampleData[0]['sample_values'],
            color: sampleData[0]['otu_ids'],
            colorscale: "Earth",
        }
    }];

    var bubbleLayout = { height:600, width:1200, hovermode: 'closest', xaxis: { title: 'OTU ID' } };
    var BUBBLE = document.getElementById('bubble');
    Plotly.plot(BUBBLE, bubbleData, bubbleLayout);
}

// Create a function to update the charts based on the sample selected/changed 
function updateCharts(sampleData, otuData) {

    
    var sampleValues = sampleData[0]['sample_values'];
    var otuIDs = sampleData[0]['otu_ids'];
    // Return the OTU Description for each otuID in the dataset
    var labels = otuIDs.map(function(item) {
        return otuData[item]
    });
      
    // Update the Bubble Chart with the new data
    var BUBBLE = document.getElementById('bubble');
    Plotly.restyle(BUBBLE, 'x', [otuIDs]);
    Plotly.restyle(BUBBLE, 'y', [sampleValues]);
    Plotly.restyle(BUBBLE, 'text', [labels]);
    Plotly.restyle(BUBBLE, 'marker.size', [sampleValues]);
    Plotly.restyle(BUBBLE, 'marker.color', [otuIDs]);
    
    // Update the Pie Chart with the new data
    // Use slice to select only the top 10 OTUs for the pie chart
    var PIE = document.getElementById('pie_chart');
    var pieUpdate = {
        values: [sampleValues.slice(0, 10)], 
        labels: [otuIDs.slice(0, 10)],
        hovertext: [labels.slice(0, 10)],
        hoverinfo: 'hovertext',
        type: 'pie'
    };
    
    Plotly.restyle(PIE, pieUpdate);
    
}

// Create a function to update the Sample Meta Data 
function updateMetaData(data) {
    // Reference to Panel element for sample metadata
    var PANEL = document.getElementById("sample-MetaData");
    // Clear any existing metadata
    PANEL.innerHTML = '';
    // Loop through all of the keys in the json response and
    // create new metadata tags
    for(var key in data) {
        h6tag = document.createElement("h6");
        h6Text = document.createTextNode(`${key}: ${data[key]}`);
        h6tag.append(h6Text);
        PANEL.appendChild(h6tag);
    }

    
}

// * BONUS Solution
// **/
function buildGauge(sample) {
    Plotly.d3.json('/wfreq/'+sample, function(error, wfreq) {
        if (error) return console.warn(error);
        // Enter the washing frequency between 0 and 180
        var level = wfreq*20;
        // Trig to calc meter point
        var degrees = 180 - level,
            radius = .5;
        var radians = degrees * Math.PI / 180;
        var x = radius * Math.cos(radians);
        var y = radius * Math.sin(radians);
        // Path: may have to change to create a better triangle
        var mainPath = 'M -.0 -0.05 L .0 0.05 L ',
            pathX = String(x),
            space = ' ',
            pathY = String(y),
            pathEnd = ' Z';
        var path = mainPath.concat(pathX,space,pathY,pathEnd);
        var data = [{ type: 'scatter',
        x: [0], y:[0],
            marker: {size: 12, color:'850000'},
            showlegend: false,
            name: 'Freq',
            text: level,
            hoverinfo: 'text+name'},
        { values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50],
        rotation: 90,
        text: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
        textinfo: 'text',
        textposition:'inside',
        marker: {
            colors:[
                'rgba(0, 105, 11, .5)', 'rgba(10, 120, 22, .5)',
                'rgba(14, 127, 0, .5)', 'rgba(110, 154, 22, .5)',
                'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
                'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)',
                'rgba(240, 230, 215, .5)', 'rgba(255, 255, 255, 0)']},
        labels: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
        hoverinfo: 'label',
        hole: .5,
        type: 'pie',
        showlegend: false
        }];
        var layout = {
        shapes:[{
            type: 'path',
            path: path,
            fillcolor: '850000',
            line: {
                color: '850000'
            }
            }],
        title: '<b>Belly Button Washing Frequency</b> <br> Scrubs per Week',
        height: 500,
        width: 500,
        xaxis: {zeroline:false, showticklabels:false,
                    showgrid: false, range: [-1, 1]},
        yaxis: {zeroline:false, showticklabels:false,
                    showgrid: false, range: [-1, 1]}
        };
        var GAUGE = document.getElementById('gauge');
        Plotly.newPlot(GAUGE, data, layout);
    });
}
