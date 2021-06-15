var directionNames = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESO', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

var directionToName = function directionToName(directionInDegrees) {
   var segmentSize = 360 / directionNames.length;
   var index = Math.floor(((directionInDegrees + segmentSize / 2) % 360) / segmentSize);
   return directionNames[index];
};