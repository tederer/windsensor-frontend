var formatColorAsText = function formatColorAsText(color) {
   return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
};

var ColorMapping = function ColorMapping(speedInKts, color) {
   this.getSpeedInKts = function getSpeedInKts() {
      return speedInKts;
   };

   this.getColorAsText = function getColorAsText() {
      return formatColorAsText(color);
   }

   this.getColor = function getColor() {
      return color;
   }
};

var blendColor = function blendColor(colorA, colorB, contributionA) {
   var r = Math.round(colorA.r * contributionA + colorB.r * (1 - contributionA));
   var g = Math.round(colorA.g * contributionA + colorB.g * (1 - contributionA));
   var b = Math.round(colorA.b * contributionA + colorB.b * (1 - contributionA));
   return {r:r, g:g, b:b};
};

var ColorGradient = function ColorGradient(colorMapping) {
   var colorGradient;
   var chartDimension;
   var currentMaxKtsScaleValue;

   var chartAreaChanged = function chartAreaChanged(chartArea) {
      return chartArea !== undefined && (chartDimension === undefined || chartDimension.width !== chartArea.width || chartDimension.height !== chartArea.height);
   };

   var maxKtsScaleValueChanged = function maxKtsScaleValueChanged(maxKtsScaleValue) {
      return currentMaxKtsScaleValue === undefined || currentMaxKtsScaleValue !== maxKtsScaleValue;
   };

   var colorMappingExistsFor = function colorMappingExistsFor(speedInKts) {
      return colorMapping.filter(mapping => speedInKts === mapping.getSpeedInKts()).length > 0;
   };

   this.get = function get(maxKtsScaleValue, context) {
      var chartArea = context.chart.chartArea;

      if ((chartArea !== undefined && maxKtsScaleValueChanged(maxKtsScaleValue)) || chartAreaChanged(chartArea)) {
         chartDimension          = {width: chartArea.width, height: chartArea.height};
         currentMaxKtsScaleValue = maxKtsScaleValue;
         colorGradient           = context.chart.ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);

         for (var i = 0; i < colorMapping.length; i++) {
            if (maxKtsScaleValue >= colorMapping[i].getSpeedInKts()) {
               var offset = colorMapping[i].getSpeedInKts() / maxKtsScaleValue;
               colorGradient.addColorStop(offset, colorMapping[i].getColorAsText());
            }
         }

         if (!colorMappingExistsFor(maxKtsScaleValue)) {
            var index = 0;
            for (var i = 0; i < colorMapping.length; i++) {
               if (colorMapping[i].getSpeedInKts() <= maxKtsScaleValue) {
                  index = i;
               }
            }

            if (colorMapping[index].getSpeedInKts() < maxKtsScaleValue) {
               var colorAsText;
               if (index === (colorMapping.length - 1)) {
                  colorAsText = colorMapping[colorMapping.length - 1].getColorAsText();
               } else {
                  var distanceHighestMappingOnScaleToNextHigherMapping = colorMapping[index + 1].getSpeedInKts() - colorMapping[index].getSpeedInKts();
                  var distanceHighestMappingOnScaleToMaxScaleValue     = maxKtsScaleValue - colorMapping[index].getSpeedInKts();
                  var relativeDistance                                 = distanceHighestMappingOnScaleToMaxScaleValue / distanceHighestMappingOnScaleToNextHigherMapping;
                  var colorAtHighestScaleValue                         = blendColor(colorMapping[index].getColor(), colorMapping[index + 1].getColor(), 1 - relativeDistance);
                  colorAsText                                          = formatColorAsText(colorAtHighestScaleValue);
               }
               colorGradient.addColorStop(1, colorAsText);
            }
         }
      }
      return colorGradient;     
   }
};
