var canvas;
var ctx;
var w = 0;
var h = 0;

var timer;
var touches = [];
var touchStart = true;
var connection;


function animate() {
    requestAnimationFrame(animate);
    update();
}

function update() {
    ctx.save();
    var dpr = window.devicePixelRatio;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    // ctx.fillStyle = '#666';			
    // ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'red';
    ctx.fillText(connection && connection.status, 10, 20);

    ctx.beginPath();
    ctx.arc(remoteMouseX * w, remoteMouseY * h, 5, 0, 2 * Math.PI, true);
    ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
    ctx.fill();

    if (!touchStart) return ctx.restore();

    var i, len, px, py, touch;
    for (i=0, len = touches.length; i<len; i++) {
        touch = touches[i];
        px = touch.clientX;
        py = touch.clientY;

        ctx.beginPath();
        ctx.arc(px, py, 20, 0, 2 * Math.PI, true);

        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.stroke();
    }

    if (window.ss_canvas) {
        ctx.drawImage(ss_canvas, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
}

function start() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas = document.createElement('canvas');

    var dpr = window.devicePixelRatio;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style = 'position: absolute; z-index: 10'
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx = canvas.getContext('2d');

    document.body.appendChild(canvas);

    window.addEventListener('touchend', function(event) {
        if (event.touches.length==0)
        touchStart = false;
        touches = event.touches;
    }, false);

    window.addEventListener('touchmove', function(event) {
        touches = event.touches;
    }, false);

    window.addEventListener('touchstart', function(event) {
        touches = event.touches;
        touchStart = true;
    }, false);

    window.addEventListener('resize', function(event) {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
    }, false);

    animate();
}

activateTouch();
start();