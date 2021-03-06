//GLOBALS
var	CANVAS_WIDTH = 1600,
	CANVAS_HEIGHT = 1200,
	CANVAS_X,
	CANVAS_Y,
	CANVAS_active = false,
	CANVAS_panning = false,
	CANVAS_cursorM = false,
	CANVAS_xOnPan,
	CANVAS_yOnPan,
	MOUSE_xOnPan,
	MOUSE_yOnPan,
	MOUSE_curr,
	MOUSE_hist = new Point( 0, 0 ),
	MOUSE_velocity = new Point( 0, 0 ),
	DRAW_interval = 0,
	DRAW_minDensity = 20,
	DRAW_maxDensity = 600,
	DRAW_skew = false,
	KEYDN_space = false,
	KEYDN_shift = false,
	KEYDN_ctrl = false,
	UI_active = false,
	GUI_bottom = 265,
	A_old = 0;
//	SAVE_current = true;

var	sketch = new Drawing();

var	canvas = document.getElementById( 'sketch' );
	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;
	
	canvas.addEventListener( 'mousedown', onCanvasMousedown, false );
		
var	ctx = canvas.getContext( '2d' );
	ctx.line = drawLine;
	ctx.lineWidth = 0.5;
	ctx.fillStyle = 'rgb(255, 255, 255)';
	ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
	
//link UI
	skewing = document.getElementById( 'skewing' );
	skewing.addEventListener( 'mousedown', onSkewMousedown, false );
	
//numeric UI
var	currOpacity = document.getElementById( 'current-opacity' ),
	currDensity = document.getElementById( 'current-density' ),
	currCache = document.getElementById( 'current-cache' ),
    currColor = document.getElementById( 'current-color' );
	currCache.innerHTML = '0';
    currColor.innerHTML = "Black";

// Color Events
var colorListItems = document.getElementById( 'sketch-color' ).getElementsByTagName('ul')[0].children;

var colorLinks = [];
for(var i = 0; i < colorListItems.length; i++)
{
    colorLinks.push(colorListItems[i].children[0]);
}

console.log("Color Links: "+colorLinks.length);

for(var i = 0; i < colorLinks.length; i++)
{
    colorLinks[i].removeEventListener("click");
    colorLinks[i].addEventListener("click", onClickColorChange, false);
}

//graphic UI
var	uiDensity = document.getElementById( 'sketch-density' ),
	uiOpacity = document.getElementById( 'sketch-opacity' );
	
var ui_initialA = 3*Math.PI/4;
	uiOpacity.opacity = map( ui_initialA, 0, Math.PI, 1, 0 );

	uiDensity.bottomPos = GUI_bottom;
	uiDensity.leftPos = 20;
	uiDensity.radius = 60;
	uiDensity.density =  map( 60, 15, 80, DRAW_minDensity, DRAW_maxDensity );
	uiDensity.render = drawCircle;
	uiDensity.render();
	
var	uix = uiDensity.leftPos, 
	uiy = uiDensity.bottomPos;
	uiOpacity.xpos = uix + 60 * Math.sin( ui_initialA );
	uiOpacity.ypos = uiy + 60 * Math.cos( ui_initialA );
	uiOpacity.render = drawSwivel;
	uiOpacity.render();

	uiOpacity.addEventListener( 'mousedown', onUiOpacityMousedown, false );
	
//document listeners	
	document.addEventListener( 'mouseup', onDocumentMouseup, false );
	document.addEventListener( 'mousemove', onDocumentMousemove, false );
	document.addEventListener( 'keydown', onDocumentKeydown, false );
	document.addEventListener( 'keyup', onDocumentKeyup, false );
	
//event handlers	
function onClickColorChange( e ) {
    e.preventDefault();
    currColor.innerHTML = e.target.innerHTML;
    return false;
}

function onCanvasMousedown( e ) {
	e.preventDefault();
	
	if( KEYDN_space ){
		CANVAS_panning = true;
		
		MOUSE_xOnPan = e.clientX;
		MOUSE_yOnPan = e.clientY;
		CANVAS_xOnPan = canvas.offsetLeft;
		CANVAS_yOnPan = canvas.offsetTop;

		return false;
	}
	
	renderPoint( e, 0 );
	CANVAS_active = true;
    return false;
}

function onUiOpacityMousedown( e ){
	e.preventDefault();
	UI_active = true;
}

function onSkewMousedown( e ){
	if ( DRAW_skew ){
		this.innerHTML = "velocity skewing disabled";
		this.className = "disabled";
		this.href = "#/  X(";
		DRAW_skew = false;
	} else {
		this.innerHTML = "velocity skewing enabled";
		this.className = "enabled";
		this.href = "#/  <|:{";
		DRAW_skew = true;
	}
}

function onDocumentMouseup( e ) {
	CANVAS_panning = false;
	CANVAS_active = false;
	UI_active = false;
}

function onDocumentMousemove( e ) {
	if ( CANVAS_panning ) {
		canvas.style.left = ( e.clientX - MOUSE_xOnPan + CANVAS_xOnPan ) + 'px';
		canvas.style.top = ( e.clientY - MOUSE_yOnPan + CANVAS_yOnPan ) + 'px';
	}
	
	if ( KEYDN_space && CANVAS_panning && !CANVAS_cursorM ){
		canvas.style.cursor = 'move';
		CANVAS_cursorM = true;
	} else if ( !CANVAS_panning && CANVAS_cursorM ){
		canvas.style.cursor = 'crosshair';
		CANVAS_cursorM = false;
	}
	
	if( CANVAS_active ){
		
		if( DRAW_interval <= 0 ){
			renderPoint( e, 1 );
			DRAW_interval = 3;
			//if( SAVE_current ) SAVE_current = false;
		}
		
		DRAW_interval--;
	}
	
	if( UI_active ){
		
		var	lmx = e.clientX, 
			lmy = e.clientY, 
			uix = uiDensity.leftPos, 
			uiy = window.innerHeight - uiDensity.bottomPos,
			newA = Math.atan2( lmy - uiy, lmx - uix ) + Math.PI/2,
			newR = linear_distance( lmx, lmy, uix, uiy );
		
		
		if( newR > 15 && newR < 80 ){			
			uiDensity.radius = newR;
			uiDensity.density = map( newR, 15, 80, DRAW_minDensity, DRAW_maxDensity );
		}
		if( newR < 15 ) newR = 15;
		if( newR > 80 ) newR = 80;
		if( newA > 0 && newA < Math.PI && !KEYDN_shift  ){
			uiOpacity.xpos = uix + newR * Math.sin( newA );
			uiOpacity.ypos = uiDensity.bottomPos + newR * Math.cos( newA );
			uiOpacity.opacity = map( newA, 0, Math.PI, 1, 0 );
			A_old = newA;
		} else {
			uiOpacity.xpos = uix + newR * Math.sin( A_old );
			uiOpacity.ypos = uiDensity.bottomPos + newR * Math.cos( A_old );
		}
		uiDensity.render();
		uiOpacity.render();
		
	}

}

function renderPoint( e, skew ){
	CANVAS_X = e.clientX - canvas.offsetLeft;
	CANVAS_Y = e.clientY - canvas.offsetTop;
	
	np = new Point( CANVAS_X, CANVAS_Y,  uiDensity.density );
	MOUSE_curr = np;
	
	if( skew ) setVelocity( e );
	else MOUSE_velocity.mult( 0 );
	
	sketch.addPoint( np );
	currCache.innerHTML = sketch.pointCache.length;
	sketch.render();
	MOUSE_hist = MOUSE_curr;
}

function setVelocity( e ){
	MOUSE_velocity = Point.prototype.subt( MOUSE_curr, MOUSE_hist );
}

function onDocumentKeydown( e ) {
	switch( e.keyCode ){
		case 32 : // SPACE BAR
			KEYDN_space = true;
			break;
		case 16 : // SHIFT
			KEYDN_shift = true;
			break;
		case 17 : // CTRL
			KEYDN_ctrl = true;
			break;
		case 83 : // S
			if( KEYDN_ctrl && KEYDN_shift ) saveDrawing();
			break;
		case 8 : // BACKSPACE
		case 46 : // DELETE
			if( KEYDN_ctrl ){
				sketch.dumpCache();
				sketch.drawnP = 0;
				currCache.innerHTML = sketch.pointCache.length;
			}
			break;
	}
}

function onDocumentKeyup( e ) {
	switch( e.keyCode ){
		case 32 : // SPACE BAR
			KEYDN_space = false;
			break;
		case 16 : // SHIFT
			KEYDN_shift = false;
			break;
		case 17 : // CTRL
			KEYDN_ctrl = false;
			break;
	}
}

//Drawing Object
function Drawing(){
	this.pointCache = new Array();
	this.drawnP = 0;
	this.addPoint = function( p ){
		this.pointCache.push( p );
		this.drawnP ++;
	}
	this.render = function() {
		dp = this.drawnP;
		pc = this.pointCache;
		if( dp > 0 ){
			p = pc[ dp-1 ];
			p.connect( pc );
		}
	}
	this.dumpCache = function(){
		this.pointCache.length = 0;
	}
}

//Point Object
function Point( tx, ty, tmd ){
	this.x = tx;
	this.y = ty;
	this.maxDist = tmd;
}

Point.prototype.connect = function( assocPoints ){
	var ps = assocPoints.length;
	if( ps > 1) {
		for( i = 0; i < ps; i++ ){
			p = assocPoints[ i ];
			p_dist = linear_distance( p.x, p.y, this.x, this.y );
			p.tempDist = p_dist;
		}
		
		//sort associated points in order of distance form current point
		assocPoints.sort( comparePointDists );
		
		var	totDist = 0,
			maxDist = this.maxDist;
		for( i = 0; i < ps; i++ ){
			p = assocPoints[ i ];
			var drawDist = p.tempDist;
			totDist += drawDist;
			if( totDist < maxDist*5 && drawDist < maxDist ){
				ctx.strokeStyle = currentStrokeStyle();
				ctx.line( this.x, this.y, p.x, p.y );
			} else { break; }
		}
	}
}

function comparePointDists( a, b ){
	return a.tempDist - b.tempDist;
}

function currentStrokeStyle() {
    var curr_color = currColor.innerHTML;
    var red = 0, green = 0, blue = 0;
    switch(curr_color) {
        case "Red": red = 255; break;
        case "Green": green = 255; break;
        case "Blue": blue = 255; break;
    };
    return 'rgba( ' + red + ',' + green + ',' + blue + ','+ uiOpacity.opacity +' )';
}

//Point vector manipulations
Point.prototype.subt = function( v1, v2 ){
	if( v2 ){
		v3 = new Point( v1.x - v2.x, v1.y - v2.y );
		return v3;
	} else {
		this.x = this.x - v1.x;
		this.y = this.y - v1.y;
	}
}
Point.prototype.mult = function( s ){
	this.x = this.x * s;
	this.y = this.y * s;
}

//Canvas line method
function drawLine( x1, y1, x2, y2 ){
	this.beginPath();
	this.moveTo( x1, y1 );
	if( DRAW_skew ){
		cp1x = x1 + MOUSE_velocity.x;
		cp1y = y1 + MOUSE_velocity.y;
		cp2x = x2 + MOUSE_velocity.x;
		cp2y = y2 + MOUSE_velocity.y;
		this.bezierCurveTo( cp1x, cp1y, cp2x, cp2y, x2, y2 );
	} else {
		this.lineTo( x2, y2 );
	}
	this.stroke();
}

//GUI rendering
function drawCircle(){
	var r = this.radius;
	this.style.bottom = this.bottomPos - r+'px';
	this.style.left = -r+this.leftPos+'px';
	this.style.width = 2*r+'px';
	this.style.height = 2*r+'px';
	this.style.borderRadius = r+'px';
	this.style.MozBorderRadius = r+'px';
	this.style.WebkitBorderRadius = r+'px';
	this.style.background = 'rgba( 0,0,0,'+ uiOpacity.opacity +' )';
	currDensity.innerHTML = Math.round( uiDensity.density );
}

function drawSwivel(){
	var x = this.xpos, y = this.ypos;
	this.style.left = x-12+'px';
	this.style.bottom = y-12+'px';
	currOpacity.innerHTML = Math.round( uiOpacity.opacity*100 );
}

//export canvas data to image in new window
function saveDrawing() {
	//SAVE_current = true;
	window.open( canvas.toDataURL( 'image/png' ), 'mywindow' );
}

//basic functions
function linear_distance( x2, y2, x1, y1 ){
	return Math.abs( Math.sqrt( Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1, 2 ) ) );
}

function map(value, istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

/*alert user if image has not been saved (or at least opened in a new window)*/
window.onbeforeunload = function( e ){
	if( !SAVE_current ) return 'If you leave without saving, your sketch will be lost forever!';
}
