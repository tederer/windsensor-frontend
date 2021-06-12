var Windchart = function Windchart() {
   var AVERAGE = 'average';
   var MINIMUM = 'minimum';
   var MAXIMUM = 'maximum';

   var colorMapping = [ new ColorMapping(bftToKts(0), {r:   0, g:   0, b: 255}),
                        new ColorMapping(bftToKts(4), {r:   0, g: 255, b:   0}),
                        new ColorMapping(bftToKts(7), {r: 255, g:   0, b:   0})];

   var colorGradient = new ColorGradient(colorMapping);

   var chart;
   var sampleData;

   var convertSampleData = function convertSampleData(samples) {
      var result = {};
      result.minimumSpeeds = [];
      result.averageSpeeds = [];
      result.maximumSpeeds = [];
      var maxSpeedInKts = 0;

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
         
         result.oldestTimestampInMillis = oldestTimestampInMillis;
         result.middleTimestampInMillis = middleTimestampInMillis;
         result.newestTimestampInMillis = newestTimestampInMillis;
         result.maxKtsScaleValue        = bftToKts(Math.min(12, (maxSpeedInKts !== minimumKtsForBft[maxSpeedInBft]) ? maxSpeedInBft + 1 : maxSpeedInBft));
      }
      return result;
   };

   var getTimeAsText = function getTimeAsText(dateInMillis) {
      var date = new Date(dateInMillis);
      var hours = date.getHours();
      var minutes = date.getMinutes();
      
      if (minutes < 10) {
         minutes = '0' + minutes;
      }
      
      return hours + ':' + minutes;
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
                           var results = [sampleData.oldestTimestampInMillis, sampleData.middleTimestampInMillis, sampleData.newestTimestampInMillis].map(getTimeAsText);
                           return results[index];
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