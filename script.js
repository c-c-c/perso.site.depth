   var MAX_BLUR = 70,
                BLUR_TYPE = 1, // 0 = triangle, 1 = lens
                BLUR_QUALITY = .4,
                DRIFT = 300,
                FOCUS_SPEED = .8,
                INVERT = true;
        
            var index = [{
                src: 'img/2a_logo_two.png',
                x: .5,
                y: .5,
                z: 0,
                caption: ''
            }, {
                src: 'img/creatives.jpg',
                x: .8,
                y: .3,
                z: .3,
                caption: "Typographic hoarding used to protect a closed down building." 
            }, {
                src: 'img/cube.jpg',
                x: .1,
                y: .1,
                z: .9,
                caption: "3D printed poster for a talk called Because, starring Tom Uglow, creative director of Google Creative Labs." 
            }, {
                src: 'img/ourtam.png',
                x: .1,
                y: .8,
                z: .2,
                caption: "Art direction for Grace and Faith Hawthorne's debut collection."
            }, /*{
                src: 'img/mf.png',
                x: .45,
                y: .9,
                z: .6,
                caption: "Creative exploration for Moral Fibre Food."
            },*/ {
                src: 'img/pencil.png',
                x: .45,
                y: .9,
                z: .6,
                caption: "Record sleeve for The Chemical Brothers 'Let Forever Be', exhibited by Secret 7 at Somerset House. In collaboration with Ben Swanson"
            }, {
                src: 'img/25yrs.png',
                x: .95,
                y: .7,
                z: 1,
                caption: "Branding for Take Shape exhibition at Dray Walk Gallery. In collaboration with a group of Kingston graduates"
            }, {
                src: 'img/fullwidth1.jpg',
                x: .5,
                y: 0,
                z: .7,
                caption: "Poster featured in charity exhibition, 'Glory Glory', about football chants."
            }];
            
            function loadImage (obj, callback) {
                var el = new Image();
                el.onload = function () { if(callback) callback(obj) };
                el.src = obj.src;
                obj.el = el;
                return obj;
            }
            
            function loadImageSequence (array, callback, allDone) {
                var done = 0, len = array.length, ret = [];
                for (var i = 0; i < len; i++) {
                    ret.push( loadImage(array[i], function (obj) {
                        if (callback) callback(obj);
                        if (allDone && ++done === len) allDone(obj);
                    }));
                }
                return ret;
            }
            
            function loadImageQueue(array, callback, allDone, i){
                var i = i === undefined ? 0 : i;
                if(i == array.length) return allDone();
                loadImage(array[i], function(obj){
                    callback(obj);
                    loadImageQueue(array, callback, allDone, ++i);
                });
            }
            
            function extendImage (image, radius, scale) {
                
                var canvas = document.createElement('canvas');
                
                var w = image.width,
                    sw = w * scale,
                    h = image.height,
                    sh = h * scale,
                    sr = radius * scale;
                
                canvas.width = sw + sr + sr;
                canvas.height = sh + sr + sr;
                var ctx = canvas.getContext('2d');
                
                ctx.fillStyle = "rgba(255,255,255,0.004)"
                ctx.fillRect(0,0,canvas.width,canvas.height);
                
                //Main image
                ctx.drawImage(image, sr, sr, sw, sh);
                
                ctx.globalAlpha = 0.004;
                
                if(BLUR_TYPE === 1){
                    // Borders
                    // Top left
                    ctx.drawImage(image, 0,0,1,1, 0,0,sr,sr);
                    // Top
                    ctx.drawImage(image, 0,0,w,1, sr,0,sw,sr);
                    // Top right
                    ctx.drawImage(image, w-1,0,1,1, sr+sw,0,sr,sr);
                    // Left
                    ctx.drawImage(image, 0,0,1,h, 0,sr,sr,sh);
                    // Right
                    ctx.drawImage(image, w-1,0,1,h, sr+sw,sr,sr,sh);
                    // Bottom left
                    ctx.drawImage(image, 0,h-1,1,1, 0,sr+sh,sr,sr);
                    // Bottom
                    ctx.drawImage(image, 0,h-1,w,1, sr,sh+sr,sw,sr);
                    // Bottom right
                    ctx.drawImage(image, w-1,h-1,1,1, sw+sr,sh+sr,sr,sr);
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'
                    ctx.fillRect(0,0,canvas.width, canvas.height);
                }
                
                ctx.globalAlpha = 1;

                return canvas;
            }
            
            function blurTo(obj, radius){
                
                var radius = Math.min(radius * BLUR_QUALITY, MAX_BLUR);

                if (radius === obj.blur) return;
                obj.blur = radius;
                
                if (radius < 1) return;
                
                if(BLUR_TYPE === 1){
                    obj.canvas.draw(obj.texture).lensBlur(radius * BLUR_QUALITY, 0.5, 0).update();
                } else {
                    obj.canvas.draw(obj.texture).triangleBlur(radius * BLUR_QUALITY).update();
                }
                
            }
            
            function findRadius(depth){
                return MAX_BLUR * Math.abs(depth - focus.pos);
            }
            
            function position(obj, x, y){
                
                var w = obj.el.width + MAX_BLUR * 2,
                    h = obj.el.height + MAX_BLUR * 2;
                
                if (obj.blur === 0) {
                    mainCtx.drawImage(obj.el, x + MAX_BLUR, y + MAX_BLUR);
                } else if (obj.blur < 1 / BLUR_QUALITY) {
                    mainCtx.drawImage(obj.el, x + MAX_BLUR, y + MAX_BLUR);
                    mainCtx.globalAlpha = obj.blur / (1/BLUR_QUALITY);
                    mainCtx.drawImage(obj.canvas, x, y, w, h);
                    mainCtx.globalAlpha = 1;
                } else {
                    mainCtx.drawImage(obj.canvas, x, y, w, h);
                }
                
                obj.hitbox.x = x + MAX_BLUR;
                obj.hitbox.y = y + MAX_BLUR;
                obj.hitbox.r = obj.hitbox.x + obj.el.width;
                obj.hitbox.b = obj.hitbox.y + obj.el.height;
            }
            
            var mainCanvas, mainCtx, mousex = window.innerWidth / 2, mousey = window.innerHeight / 2;
            
            function init(callback){
                
                loadImageSequence(index, function(obj){
                    
                    var canvas = fx.canvas();
                    
                    var img = extendImage(obj.el, MAX_BLUR, BLUR_QUALITY)
                    
                    obj.texture = canvas.texture(img);
                    
                    obj.canvas = canvas;
                    
                    obj.hitbox = {
                        x: 0,
                        y: 0,
                        r: 0,
                        b: 0
                    }
                    
                }, function(){
                    
                    mainCanvas = document.createElement('canvas');
                
                    mainCtx = mainCanvas.getContext('2d');
                    
                    mainCanvas.width = window.innerWidth;
                    mainCanvas.height = window.innerHeight;
                    
                    window.addEventListener('resize', function(){
                        mainCanvas.width = window.innerWidth;
                        mainCanvas.height = window.innerHeight;
                    });
                    
                    document.body.appendChild(mainCanvas);
                    
                    index.sort(function(a, b){
                        if(a.z > b.z) return 1;
                        return -1;
                    });
                    
                    callback();
                    
                });
                
                window.addEventListener('mousemove', function(e){
                    mousex = e.clientX;
                    mousey = e.clientY;
                });
                
                window.addEventListener('touchstart', function(e){
                    mousex = e.touches[0].clientX;
                    mousey = e.touches[0].clientY;
                });
                
                document.getElementById('huh').onclick = function(){
                    
                    if(!about){
                        focusTo(2);
                        document.getElementById('about').className = 'active';
                        about = true;
                        
                    } else {
                        focusTo(0)
                        document.getElementById('about').className = '';
                        about = false;
                        
                    }
                }
                
            }
            
            function calcFocus(){
                
                if(now > focus.endTime) {
                    focus.pos = focus.endPos;
                    return;
                }
                
                var progress = (now - focus.startTime) / (focus.endTime - focus.startTime);
                
                progress = progress*(2-progress);
                
                focus.pos = focus.startPos + ((focus.endPos - focus.startPos) * progress);
                
            }
            
            function focusTo(depth){
                if(depth == focus.pos) return;
                var delta = depth - focus.pos;
                var duration = FOCUS_SPEED * Math.abs(delta) * 1000;
                focus = {
                    startPos: focus.pos,
                    endPos: depth,
                    startTime: now,
                    endTime: now + duration,
                    pos: focus.pos
                }
            }
            
            var focus = {
                startPos: 0,
                endPos: 0,
                startTime: 0,
                endTime: 0,
                pos: 0
            }
            
            var now, then, about = false;
            
            function loop(){
                
                now = Date.now(),
                then = then || now,
                
                mainCtx.clearRect(0,0,mainCanvas.width, mainCanvas.height);
                
                calcFocus();
                
                var driftX = ((mousex/window.innerWidth) * 2 - 1) * DRIFT,
                    driftY = ((mousey/window.innerHeight) * 2 - 1) * DRIFT
                    
                if(INVERT){
                    driftX = -driftX;
                    driftY = -driftY;
                }
                
                for(var i = 0; i < index.length; ++i){
                    
                    var obj = index[i];
                    
                    var x = (window.innerWidth * obj.x) - MAX_BLUR - (obj.el.width / 2) + (driftX * obj.z),
                        y = (window.innerHeight * obj.y) - MAX_BLUR - (obj.el.height / 2) + (driftY * obj.z);
                    
                    position(obj, x, y);
                    
                    blurTo(obj, findRadius(obj.z));
                    
                }
                
                if(!about){
                    
                    var hovered = false;
                    
                    for(var i = index.length - 1; i >= 0; --i){
                        
                        var obj = index[i],
                            box = index[i].hitbox;
                        if(
                            mousex > box.x &&
                            mousex < box.r &&
                            mousey > box.y &&
                            mousey < box.b
                        ){
                            hovered = true;
                            focusTo(obj.z);
                            
                            $('#caption').text(obj.caption).fadeIn(1000);
                            
                            break;
                        }
                        
                        
                        
                    }
                    
                    if(!hovered) $('#caption').text('').fadeOut(1);
                    
                } else {
                    
                    $('#caption').fadeOut(1000);
                    
                }
                
                window.requestAnimationFrame(loop);
            };
            
            window.onload = function() {
                
                init(loop);
                
            };
            
		  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
		
		  ga('create', 'UA-59367328-1', 'auto');
		  ga('send', 'pageview');