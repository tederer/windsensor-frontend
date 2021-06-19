var Windchart = function Windchart() {
   var AVERAGE = 'average';
   var MINIMUM = 'minimum';
   var MAXIMUM = 'maximum';

var colorMapping = [ new ColorMapping(bftToKts(0), {r:   0, g:   0, b:   0}),
                     new ColorMapping(bftToKts(4), {r:   0, g:   0, b: 255}),
                     new ColorMapping(bftToKts(5), {r:   0, g: 255, b:   0}),
                     new ColorMapping(bftToKts(6), {r:   0, g: 255, b:   0}),
                     new ColorMapping(bftToKts(7), {r: 255, g: 128, b:   0}),
                     new ColorMapping(bftToKts(8), {r: 255, g:   0, b:   0})];

                     // color gradient based on windfinder.com
/*var colorMapping = [ new ColorMapping( 0, {r: 108, g:  61, b: 163}),
                     new ColorMapping( 3, {r:  88, g:  68, b: 163}),
                     new ColorMapping( 7, {r:  61, g:  99, b: 163}),
                     new ColorMapping(11, {r:  61, g: 128, b: 161}),
                     new ColorMapping(15, {r:  62, g: 152, b: 148}),
                     new ColorMapping(19, {r:  67, g: 148, b:  67}),
                     new ColorMapping(23, {r:  66, g: 161, b:  61}),
                     new ColorMapping(27, {r: 163, g: 162, b:  61}),
                     new ColorMapping(31, {r: 163, g: 143, b:  61}),
                     new ColorMapping(35, {r: 163, g: 126, b:  61}),
                     new ColorMapping(39, {r: 155, g: 105, b:  61}),
                     new ColorMapping(43, {r: 144, g:  86, b:  70}),
                     new ColorMapping(47, {r: 133, g:  67, b:  73}),
                     new ColorMapping(51, {r: 136, g:  61, b:  88}),
                     new ColorMapping(53, {r: 153, g:  61, b: 112})
                     ];*/

   var chart;
   var sampleData;
   var colorGradient = new ColorGradient(colorMapping);

   var toTimeAsText = function toTimeAsText(dateInMillis) {
      var result = 'n.a.';
      if (dateInMillis !== undefined) {
         var date = new Date(dateInMillis);
         var hours = date.getHours();
         var minutes = date.getMinutes();
         
         if (minutes < 10) {
            minutes = '0' + minutes;
         }
         result = hours + ':' + minutes;
      }
      return result;
   };

   var convertSampleData = function convertSampleData(samples) {
      var result = {};
      result.minimumSpeeds = [];
      result.averageSpeeds = [];
      result.maximumSpeeds = [];
      result.timestamps    = [];
      var maxSpeedInKts    = 0;

      /* draws a straight line from 0 to 12 bft to test the color gradient
      for(var speed=0; speed <= 65; speed = speed + 5) {
         var x = speed / 65;
         result.minimumSpeeds.push({x: x, y: Math.max(0, speed - 5)});
         result.averageSpeeds.push({x: x, y: speed});
         result.maximumSpeeds.push({x: x, y: speed + 5});
      }
      result.maxKtsScaleValue = 70;
      */
      
      if (samples.length >= 2) {
         var oldestTimestampInMillis = (new Date(samples[0].timestamp)).getTime();
         var newestTimestampInMillis = (new Date(samples[samples.length - 1].timestamp)).getTime();
         var middleTimestampInMillis = oldestTimestampInMillis + (newestTimestampInMillis - oldestTimestampInMillis) / 2;
         durationInMillis            = newestTimestampInMillis - oldestTimestampInMillis;

         samples.forEach(sample => {
            var sampeTimestampInMillis = (new Date(sample.timestamp)).getTime();
            var relativeDuration = (sampeTimestampInMillis - oldestTimestampInMillis) / durationInMillis;
            result.averageSpeeds.push({x: relativeDuration, y: kmhToKts(sample.averageSpeed)});
            result.maximumSpeeds.push({x: relativeDuration, y: kmhToKts(sample.maximumSpeed)});
            result.minimumSpeeds.push({x: relativeDuration, y: kmhToKts(sample.minimumSpeed)});
            if (kmhToKts(sample.maximumSpeed) > maxSpeedInKts) {
               maxSpeedInKts = kmhToKts(sample.maximumSpeed);
            }
         });
         
         var maxSpeedInBft = ktsToBft(maxSpeedInKts);
         
         result.timestamps.push(oldestTimestampInMillis);
         result.timestamps.push(middleTimestampInMillis);
         result.timestamps.push(newestTimestampInMillis);
         result.timestamps = result.timestamps.map(toTimeAsText);
         result.maxKtsScaleValue = bftToKts(Math.min(12, (maxSpeedInKts !== minimumKtsForBft[maxSpeedInBft]) ? maxSpeedInBft + 1 : maxSpeedInBft));
      }

      return result;
   };

   var applyToDataset = function applyToDataset(label, datasetConsumer) {
      var dataset = chart.data.datasets.filter(dataset => dataset.label === label);
      if(dataset.length > 0) {
         datasetConsumer(dataset[0]);
      }
   };

   var applyToScale = function applyToScale(id, scaleConsumer) {
      var scale = chart.options.scales[id];
      if (scale !== undefined) {
         scaleConsumer(scale);
      }
   };

   var update = function update(data) {
      applyToDataset(MINIMUM,       dataset => dataset.data = data.minimumSpeeds);
      applyToDataset(AVERAGE,       dataset => dataset.data = data.averageSpeeds);
      applyToDataset(MAXIMUM,       dataset => dataset.data = data.maximumSpeeds);
      applyToScale('ktsScale',        scale => scale.max    = data.maxKtsScaleValue);
      applyToScale('beaufortScale',   scale => scale.max    = data.maxKtsScaleValue);
      chart.update();
   };

   this.display = function display(samplesMessage) {
      sampleData = convertSampleData(samplesMessage.twoHoursHistory.data);

      if (chart === undefined) {
         var chartConfig = {
            type: 'line',
            data: {
               datasets: [{
                     label: AVERAGE,
                     borderColor: context => colorGradient.get(sampleData.maxKtsScaleValue, context),
                     backgroundColor: 'rgb(0,0,0)',
                     yAxisID: 'ktsScale',
                     data: sampleData.averageSpeeds,
               }, {
                     label: MAXIMUM,
                     borderColor: 'rgb(230, 230, 230)',
                     backgroundColor: 'rgb(230, 230, 230)',
                     yAxisID: 'ktsScale',
                     data: sampleData.maximumSpeeds
               }, {
                     label: 'minimum',
                     borderColor: 'rgb(230, 230, 230)',
                     backgroundColor: 'rgb(230, 230, 230)',
                     yAxisID: 'ktsScale',
                     data: sampleData.minimumSpeeds
               }]
            },
            options: {
               scales: {
                  x: {
                     type: 'linear',
                     position: 'bottom',
                     min: 0,
                     max: 1,
                     ticks: {
                        stepSize: 0.5,
                        callback: function(value, index) {
                           var tickLabel = sampleData.timestamps[index];
                           return tickLabel !== undefined ? tickLabel : 'n.a.';
                        }
                     }
                  },
                  ktsScale: {
                     title: {
                        display: true,
                        text: 'kts'
                     },
                     position: 'left',
                     min: 0,
                     max: sampleData.maxKtsScaleValue,
                     beginAtZero: true,
                     grid: {
                        display: false
                     }
                  },
                  beaufortScale: {
                     title: {
                        display: true,
                        text: 'bft'
                     },
                     position: 'right',
                     min: 0,
                     max: sampleData.maxKtsScaleValue,
                     beginAtZero: true,
                     ticks: {
                        stepSize: 1,
                        callback: function(value) {
                           var bft;
                           var index = minimumKtsForBft.indexOf(value);
                           if (index >= 0) {
                              bft = index; 
                           }
                           return bft;
                        }
                     }
                  }
   
               },
               elements: {
                  point: {
                     radius: 0
                  }
               },
               plugins: {
                  legend: {
                     display: false
                  }
               }
            }
         };
         
         chart = new Chart($('#windChart'), chartConfig);
         update(sampleData);
      } else {
         update(sampleData);
      }
   };
};