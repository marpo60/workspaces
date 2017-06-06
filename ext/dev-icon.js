'use strict';

const drawDevIcon = () => {
  var canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  var ctx = canvas.getContext('2d');

  var image = new Image();
  image.src = chrome.runtime.getManifest().browser_action.default_icon;
  image.onload = function() {
    ctx.drawImage(image, 0, 0);

    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128, 30);
    ctx.lineTo(30, 128);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'red';
    ctx.fill();

    chrome.browserAction.setIcon({
      imageData: ctx.getImageData(0, 0, 128, 128)
    });
  };
};

chrome.management.getSelf((self) => {
  if (self.installType === 'development') {
    drawDevIcon();
  }
});
