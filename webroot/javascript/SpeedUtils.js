// beaufort             0  1  2  3  4   5   6   7   8   9   10  11  12
var minimumKtsForBft = [0, 1, 4, 7, 11, 16, 22, 28, 34, 41, 48, 56, 64];

var kmhToKts = function kmhToKts(speedInKmh) {
   return speedInKmh / 1.852;
};

var ktsToKmh = function ktsToKmh(speedInKts) {
   return speedInKts * 1.852;
};

var kmhToBft = function kmhToBft(speedInKmh) {
   ktsToBft(kmhToKts(speedInKmh));
};

var ktsToBft = function ktsToBft(speedInKts) {
   var index = minimumKtsForBft.length - 1;
   while(minimumKtsForBft[index] > speedInKts) {
      index--;
   }
   return index;
};

var bftToKmh = function bftToKmh(speedInBft) {
   return ktsToKmh(bftToKts(speedInBft));
};

var bftToKts = function bftToKts(speedInBft) {
   return minimumKtsForBft[speedInBft];
};