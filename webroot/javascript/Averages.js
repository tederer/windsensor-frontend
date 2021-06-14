var Averages = function Averages() {
   var SEPARATOR = '.';
   var DIRECTION = 'direction';
   var SPEED     = 'speed';
   var lastTimestamp;

   var mappings = [
      {dataKey:'averages.oneMinute.direction.average',        uiSelector:'#1min-direction'                ,type: DIRECTION},
      {dataKey:'averages.oneMinute.speed.average',            uiSelector:'#1min-speed-average'            ,type: SPEED},
      {dataKey:'averages.oneMinute.speed.minimum',            uiSelector:'#1min-speed-min'                ,type: SPEED},
      {dataKey:'averages.oneMinute.speed.maximum',            uiSelector:'#1min-speed-max'                ,type: SPEED},
      {dataKey:'averages.oneMinute.speed.trend.offset',       uiSelector:'#1min-speed-trend-offset'       ,type: SPEED},
      {dataKey:'averages.oneMinute.speed.trend.gradient',     uiSelector:'#1min-speed-trend-gradient'     ,type: SPEED},

      {dataKey:'averages.tenMinutes.direction.average',       uiSelector:'#10min-direction'               ,type: DIRECTION},
      {dataKey:'averages.tenMinutes.speed.average',           uiSelector:'#10min-speed-average'           ,type: SPEED},
      {dataKey:'averages.tenMinutes.speed.minimum',           uiSelector:'#10min-speed-min'               ,type: SPEED},
      {dataKey:'averages.tenMinutes.speed.maximum',           uiSelector:'#10min-speed-max'               ,type: SPEED},
      {dataKey:'averages.tenMinutes.speed.trend.offset',      uiSelector:'#10min-speed-trend-offset'      ,type: SPEED},
      {dataKey:'averages.tenMinutes.speed.trend.gradient',    uiSelector:'#10min-speed-trend-gradient'    ,type: SPEED}
   ];

   var roundAtFirstDecimal = function roundAtFirstDecimal(value) {
      var isNumber = (typeof value) === (typeof 1.234);
      if (isNumber) {
         value = Math.round(value * 10) / 10;
      }
      return value;
   };

   var getRoundedKts = function getRoundedKts(speedInKmh) {
   return roundAtFirstDecimal(kmhToKts(speedInKmh));
   };

   var setTimestamp = function setTimestamp(isoTimestamp) {
      var localTimestampAsString = 'n.a.';
      if (isoTimestamp !== undefined) {
         localTimestampAsString = isoTimestamp.toString();
         var timestampInMillis = Date.parse(isoTimestamp);
         if (!Number.isNaN(timestampInMillis)) {
               var locale = (navigator.language !== undefined) ? navigator.language : undefined;
               localTimestampAsString = (new Date(timestampInMillis)).toLocaleString(locale);
         }
      }
      $('#timestamp').text(localTimestampAsString);
   };

   this.poll = function poll() {
      $.getJSON( "/averages.json", function( data ) {
         var currentTimestamp = data.averages.timestamp;

         if (lastTimestamp === undefined || lastTimestamp !== currentTimestamp) {
               lastTimestamp = currentTimestamp;

               setTimestamp(currentTimestamp);

               mappings.forEach(mapping => {
                  var keyParts = mapping.dataKey.split(SEPARATOR);
                  var value = data[keyParts[0]];
                  var index = 1;

                  while (index < keyParts.length && (value !== undefined)) {
                     var key = keyParts[index];
                     value = value[key];
                     index++;
                  }

                  var formattedValue = 'n.a.';
                  if (index === keyParts.length) {
                     if(value !== undefined) {
                        switch (mapping.type) {
                           case SPEED:       formattedValue = getRoundedKts(value) + ' kts';
                                             break;
                           case DIRECTION:   formattedValue = directionToName(value) + ' (' + Math.round(value) + '°)';
                                             break;
                        }
                     }
                  }
                  $(mapping.uiSelector).text(formattedValue);
               });
         }
      });
   };
};