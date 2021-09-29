function Sprite(byteString) {
  var raw = byteString.replace("0x", '');
  var color_1_index = parseInt(raw.substr(0, 2), 16);
  var color_2_index = parseInt(raw.substr(2, 2), 16);
  var color_3_index = parseInt(raw.substr(4, 2), 16);
  var color_4_index = parseInt(raw.substr(6, 2), 16);
  var skin_1_index = parseInt(raw.substr(8, 2), 16);
  var skin_2_index = parseInt(raw.substr(10, 2), 16);

  this.maxX = 30;
  this.maxY = 30;
  this.pressData = [];
  this.mainColor = this.getSafeColorByIndex(skin_1_index);
  this.assistColor = this.getSafeColorByIndex(skin_2_index);
  this.control_color_1 = this.getSafeColorByIndex(color_1_index);
  this.control_color_2 = this.getSafeColorByIndex(color_2_index);
  this.control_color_3 = this.getSafeColorByIndex(color_3_index);
  this.control_color_4 = this.getSafeColorByIndex(color_4_index);

  var offset = 12;
  for (var i = 0; i < 7; i++) {
    var strCount = parseInt(raw.substr(offset, 8), 16);
    offset += 8;
    var str = raw.substr(offset, strCount * 2)
    offset += strCount * 2
    this.pressData.push(str)
  }

}

Sprite.prototype.getUnCompressCode = function() {
  var imageCode = [];
  for (var partData of this.pressData) {
    this.getUnCompressPart(partData, imageCode)
  }
  return imageCode;
}


Sprite.prototype.getUnCompressPart = function(partData, imageCode) {
  partData = partData.replace("0x", '');
  var compressByte = this.Str2Bytes(partData);
  var binStr = '';
  for (var v of compressByte) {
    binStr += this.getBinStr(v)
  }

  var startIndex = 0;
  startIndex += 1;
  var isStartX = true;
  if (binStr[startIndex] == "0") {
    isStartX = true;
  } else {
    isStartX = false;
  }
  startIndex += 1;


  var colorNum = parseInt(binStr.substr(startIndex, 6), 2);

  startIndex += 6;
  colorNum += 1;

  var stepNum = this.getBitNum(colorNum)

  var colorList = [];
  var colorWidth = 8;


  for (var i = 0; i < colorNum; i++) {
    var colorIndex = parseInt(binStr.substr(startIndex, colorWidth), 2);
    startIndex += colorWidth;
    var colorItem = {
      R: 0,
      G: 0,
      B: 0,
      A: 0
    };
    var zeroColor = {
      R: 0,
      G: 0,
      B: 0,
      A: 0
    };

    if (colorIndex == 216) {
      if (this.colorIsEqual(this.mainColor, zeroColor)) {
        throw "you not set mainColor";
      }
      colorItem = this.mainColor
    } else if (colorIndex == 217) {
      if (this.colorIsEqual(this.assistColor, zeroColor)) {
        throw "you not set assistColor";
      }
      colorItem = this.assistColor
    } else if (colorIndex == 218) {
      if (this.colorIsEqual(this.control_color_1, zeroColor)) {
        throw "you not set control_color_1";
      }
      colorItem = this.control_color_1
    } else if (colorIndex == 219) {
      if (this.colorIsEqual(this.control_color_2, zeroColor)) {
        throw "you not set control_color_2";
      }
      colorItem = this.control_color_2
    } else if (colorIndex == 220) {
      if (this.colorIsEqual(this.control_color_3, zeroColor)) {
        throw "you not set control_color_3";
      }
      colorItem = this.control_color_3
    } else if (colorIndex == 221) {
      if (this.colorIsEqual(this.control_color_4, zeroColor)) {
        throw "you not set control_color_4";
      }
      colorItem = this.control_color_4
    } else {
      colorItem = this.getSafeColorByIndex(colorIndex)
    }
    colorList.push(colorItem);
  }

  var startXInt = 0
  var startYInt = 0

  var maxpos = this.maxX
  if (this.maxY > maxpos) {
    maxpos = this.maxY
  }
  var maxBit = this.getBitNum(maxpos);

  var startXstr = binStr.substr(startIndex, maxBit);
  var Min_X = parseInt(startXstr, 2);
  startIndex += maxBit;

  var startYstr = binStr.substr(startIndex, maxBit);
  var Min_Y = parseInt(startYstr, 2);
  startIndex += maxBit;

  var endXstr = binStr.substr(startIndex, maxBit);
  var Max_X = parseInt(endXstr, 2);
  startIndex += maxBit

  var endYstr = binStr.substr(startIndex, maxBit);
  var Max_Y = parseInt(endYstr, 2);
  startIndex += maxBit

  var colorBitStr = binStr.substr(startIndex, 5);
  var colorBitInt = parseInt(colorBitStr, 2);
  startIndex += 5

  var posBitNum = this.getPosBitNum(Max_X - Min_X + 1, Max_Y - Min_Y + 1)
  var isNewSatrt = true
  var needDrawColorNum = 0
  var hasColorNum = 0
  var isFirst = true;
  while (startIndex < binStr.length) {
    if (isNewSatrt) {
      if (startIndex + posBitNum > binStr.length - 1) {
        break
      }
      var posInfoStr = binStr.substr(startIndex, posBitNum);
      var posInfoInt = parseInt(posInfoStr, 2);
      if (posInfoInt == 0 && !isFirst) {
        break
      } else {
        isFirst = false
      }
      startIndex += posBitNum;
      var width = 0;
      if (isStartX) {
        width = Max_X - Min_X + 1;
        startXInt = posInfoInt % width + Min_X;
        startYInt = Math.floor(posInfoInt / width) + Min_Y;
      } else {
        width = Max_Y - Min_Y + 1;
        startXInt = Math.floor(posInfoInt / width) + Min_X;
        startYInt = posInfoInt % width + Min_Y;
      }

      isNewSatrt = false

      if (startIndex + colorBitInt > binStr.length) {
        break
      }
      var colorNumStr = binStr.substr(startIndex, colorBitInt);
      needDrawColorNum = parseInt(colorNumStr, 2);
      needDrawColorNum += 1
      startIndex += colorBitInt
    } else {
      hasColorNum++
      colorIndex = parseInt(binStr.substr(startIndex, stepNum), 2)
      startIndex += stepNum
      imageCode.push({
        X: startXInt,
        Y: startYInt,
        R: colorList[colorIndex].R,
        G: colorList[colorIndex].G,
        B: colorList[colorIndex].B,
        A: colorList[colorIndex].A,
      })
      if (isStartX) {
        startXInt += 1
        if (startXInt > Max_X) {
          startXInt = Min_X
          startYInt += 1
        }
      } else {
        startYInt += 1
        if (startYInt > Max_Y) {
          startYInt = Min_Y
          startXInt += 1
        }
      }
      if (hasColorNum == needDrawColorNum) {
        isNewSatrt = true
        needDrawColorNum = 0;
        hasColorNum = 0;
      }
    }
  }
}

// hex 2 bytes
Sprite.prototype.Str2Bytes = function(str) {
  var pos = 0;
  var len = str.length;
  if (len % 2 != 0) {
    return null;
  }
  len /= 2;
  var hexA = new Array();
  for (var i = 0; i < len; i++) {
    var s = str.substr(pos, 2);
    var v = parseInt(s, 16);
    hexA.push(v);
    pos += 2;
  }
  return hexA;
}


Sprite.prototype.getBinStr = function(dec) {
  var binStr = dec.toString(2)
  if (binStr.length < 8) {
    binStr = '0'.repeat(8 - binStr.length) + binStr;
  }
  return binStr;
}


Sprite.prototype.rtrim10 = function(binStr) {
  binStr = binStr.replace(/1(0+)$/, '');
  return binStr
}

Sprite.prototype.getBitNum = function(maxNum) {
  var maxBit = 0;
  for (var i = 1; i <= 20; i++) {
    var res = Math.pow(2, i);
    if (res >= maxNum) {
      maxBit = i;
      break
    }
  }
  if (maxBit == 0) {
    throw "pow is out of 20";
  }
  return maxBit
}


Sprite.prototype.getPosBitNum = function(deltaX, deltaY) {
  var maxpos = deltaX * deltaY;
  var maxBit = 0;
  for (var i = 1; i <= 14; i++) {
    var res = Math.pow(2, i)
    if (res >= maxpos) {
      maxBit = i;
      break
    }
  }
  if (maxBit == 0) {
    throw "maxPos Out of 16,384"
  }
  return maxBit
}

//index to color
Sprite.prototype.getSafeColorByIndex = function(index) {
  /*
  [0,1,2,3,4,5]=>['00','33','66','99','cc','ff'] 
  000  0   #000000
  001  1   #000033
  002  2   #000066
  003  3   #000099
  004  4   #0000cc
  005  5   #0000ff
  010  6   #003300
  555  215 #ffffff
  */
  var offset_3 = Math.floor(index / (6 * 6)) //R
  var offset_2 = Math.floor((index - offset_3 * 6 * 6) / 6) //G
  var offset_1 = index - offset_3 * 6 * 6 - offset_2 * 6 //B
  return {
    R: offset_3 * 51,
    G: offset_2 * 51,
    B: offset_1 * 51,
    A: 255
  }
}

//if colorA equals colorB
Sprite.prototype.colorIsEqual = function(colorA, colorB) {
  return colorA.R == colorB.R && colorA.G == colorB.G && colorA.B == colorB.B && colorA.A == colorB.A
}

Sprite.prototype.colorToHex = function(color) {
  var hex = '#'
  if (color.R == 0) {
    hex += '00'
  } else {
    hex += color.R.toString(16)
  }
  if (color.G == 0) {
    hex += '00'
  } else {
    hex += color.G.toString(16)
  }
  if (color.B == 0) {
    hex += '00'
  } else {
    hex += color.B.toString(16)
  }
  return hex.toLocaleUpperCase();
}
