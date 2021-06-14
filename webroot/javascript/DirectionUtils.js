var directionNames = ['N', 'NNE', 'NE', 'E', 'SE', 'SSE', 'S', 'SSW', 'SW', 'W', 'NW', 'NNW'];

var directionToName = function directionToName(directionInDegrees) {
   var segmentSize = 360 / directionNames.length;
   var index = Math.floor(directionInDegrees / segmentSize);
   return directionNames[index];
};