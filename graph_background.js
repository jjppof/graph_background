        
function graph_background(canvas_id, input_obj){
	var canvas = document.getElementById(canvas_id);
	canvas.style.margin = 0;
	canvas.style.padding = 0;
	canvas.style.display = "block";
	canvas.style.position = "fixed";
	canvas.style.top = 0;
	canvas.style.left = 0;
	canvas.style.zIndex = -1;
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	canvas.style.backgroundColor = "black";

	function range(a, b, c){
		if(typeof b ==='undefined'){
			b = a;
			a = 0;
		}
		c = typeof c === 'undefined' ? 1 : c;
		c = a > b ? -c : c;
		var range_list = [a];
		for(var i = 1; i < (b-a)/c; i++){
			range_list.push(range_list[range_list.length - 1] + c)
		}
		return range_list;
	}

	function sample(array, n){
		n = typeof n === 'undefined' ? 1 : n;
		var samples = [];
		var len_array = array.length;
		for(var i = 0; i < n; i++){
			var pos = Math.floor(Math.random() * len_array);
			samples.push(array[pos]);
		}
		return samples.length == 1 ? samples[0] : samples;
	}

	function is_connected(item, array){
		var result = array.filter(function(a){
			return (item.start == a.start && item.end == a.end) || (item.start == a.end && item.end == a.start);
		});
		return Boolean(result.length);
	}

	function linspace(a, b, n) {
		if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
		if(n < 2){ 
			return n === 1 ? [a] : []; 
		}
		var i,ret = Array(n);
		n--;
		for(i = n; i >= 0; i--){
			ret[i] = (i*b+(n-i)*a)/n;
		}
		return ret;
	}

	function cauchy_space(start, end, qtd){
		var x = linspace(start, end, qtd);
		var cdf = [];
		var z = []; 
		for(var i = 0; i < qtd; i++){
			cdf.push(1/Math.PI * Math.atan(x[i] - (end + start)/2)+ 1/2);
			if(end > start)
				z.push(cdf[i]*(end-start) + start)
		}
		if(start > end){
			for(var i = qtd - 1; i >= 0; i--){
				z.push(cdf[i]*(end-start) + start)
			}
		}
		z[0] = start;
		z[z.length - 1] = end;
		return z;
	}

	function distance(x0, y0, x1, y1){
		return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
	}

	var input_obj = typeof input_obj === 'undefined' ? {} : input_obj;

	var x0 = window.innerWidth/2;
	var y0 = window.innerHeight/2;
	var spreadx = window.innerWidth;
	var spready = window.innerHeight;
	var dot_qtd =  typeof input_obj.dot_number === 'undefined' ? 800 : input_obj.dot_number;
	var my_linspacex = linspace(-spreadx/2, spreadx/2, spreadx);
	var my_linspacey = linspace(-spready/2, spready/2, spready);
	var connections = typeof input_obj.connections_number === 'undefined' ? 5 : input_obj.connections_number;
	var circles = [];
	var circles_reference = [];
	var lines = [];
	var mouse_x = 0;
	var mouse_y = 0;
	var circles_delta = [];
	var delta_spread = [20, 40];
	var fps = 60;
	var range_limit = 10;
	var max_opacity = typeof input_obj.max_opacity === 'undefined' ? 0.5 : input_obj.max_opacity;
	var max_dot_radius = typeof input_obj.max_dot_radius === 'undefined' ? 5 : input_obj.max_dot_radius;
	var discovered_area_radius = typeof input_obj.discovered_area_radius === 'undefined' ? 150 : input_obj.discovered_area_radius;
	var opacity_range = linspace(max_opacity, 0, range_limit);
	var opacity_radius = linspace(0, discovered_area_radius, range_limit);
	var dot_radius_range = linspace(max_dot_radius, 0.5, range_limit);
	var dot_delay_base = typeof input_obj.dot_delay_factor === 'undefined' ? 1.5 : input_obj.dot_delay_factor;
	var transition_time = range(dot_qtd);
	transition_time.forEach(function(element, index, array){ array[index] = dot_delay_base + Math.random()/2 });
	var color_line = typeof input_obj.line_color === 'undefined' ? "white" : input_obj.line_color;
	var color_dot = typeof input_obj.dot_color === 'undefined' ? "white" : input_obj.dot_color;

    window.addEventListener('resize', resizeCanvas, false);
    
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var x_ratio = (window.innerWidth/2)/x0;
      var y_ratio = (window.innerHeight/2)/y0;
      x0 = window.innerWidth/2;
	  y0 = window.innerHeight/2;
	  for(var i = 0; i < dot_qtd; i++){ 
	  	circles_reference[i].x0 = x0 + circles_reference[i].x_shift * x_ratio;
	  	circles_reference[i].y0 = y0 + circles_reference[i].y_shift * y_ratio;
	  	circles_reference[i].x_shift *= x_ratio;
	  	circles_reference[i].y_shift *= y_ratio;
	  }
    }
    
    function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }
    
    window.addEventListener('mousemove', function(evt) {
      var mousePos = getMousePos(canvas, evt);
      mouse_x = mousePos.x;
      mouse_y = mousePos.y;
    }, false);
    
    function init(){
    	context = canvas.getContext('2d');
    	context.clearRect(0,0,window.innerWidth,window.innerHeight);
    	for(var i = 0; i < dot_qtd; i++){ 
	        var x_shift = sample(my_linspacex);
	        var y_shift = sample(my_linspacey);
	        context.beginPath();
	        var x_pos = x0 + x_shift;
	        var y_pos = y0 + y_shift;
	    	context.arc(x_pos, y_pos, 0, 0, Math.PI * 2, false);
	        context.fill();
	        circles.push({x0 : x_pos, y0 : y_pos});
	        circles_reference.push({
	        	x0 : x_pos, 
	        	y0 : y_pos, 
	        	x_shift : x_shift,
	        	y_shift : y_shift
	        });
	    }
	    for(var i = 0; i < dot_qtd; i++){ 
	      	var distances = [];
	      	for(var k = 0; k < dot_qtd; k++){
	      		distances.push({
	      			index: k,
	      			distance: distance(circles[i].x0, circles[i].y0, circles[k].x0, circles[k].y0)
	      		});
	      	}
	      	distances = distances.sort(function(a, b){
	      		return a.distance - b.distance; 
	      	});
	      	var distance_index_shift = 0;
	        for(var j = 0; j < connections; j++){
	          context.beginPath();
	          var index = distances[j + 1].index;
	     	  while(is_connected({ start : i, end : index }, lines)){
	     	  	if(j + 1 + distance_index_shift == distances.length)
	     	  		break;
	     	  	distance_index_shift++;
	     	  	index = distances[j + 1 + distance_index_shift].index;
	     	  }
	          context.moveTo(circles[i].x0, circles[i].y0);
	          context.lineTo(circles[index].x0, circles[index].y0);
	          lines.push({ start : i, end : index });
	          context.stroke();
	        }
	        circles_delta[i] = {
	        	goal : { x : circles[i].x0, y : circles[i].y0 },
	        	range_x : [],
	        	range_index_x : 0,
				range_y : [],
	        	range_index_y : 0
	        }
	    }
	    resizeCanvas();
	    window.requestAnimationFrame(drawStuff);
    }
    
    init();
    
    function drawStuff() {
    	context = canvas.getContext('2d');
    	context.clearRect(0,0,window.innerWidth,window.innerHeight);
		for(var i = 0; i < dot_qtd; i++){
			if(circles_delta[i].goal.x == circles[i].x0){
				var new_goal = circles_reference[i].x0 + sample([1, -1]) * sample(range(delta_spread[0], delta_spread[1]));
				circles_delta[i].goal.x = new_goal;
				circles_delta[i].range_x = cauchy_space(circles[i].x0, new_goal, Math.round(fps*transition_time[i]));
				circles_delta[i].range_index_x = 0;
			}
			if(circles_delta[i].goal.y == circles[i].y0){
				var new_goal = circles_reference[i].y0 + sample([1, -1]) * sample(range(delta_spread[0], delta_spread[1]));
				circles_delta[i].goal.y = new_goal;
				circles_delta[i].range_y = cauchy_space(circles[i].y0, new_goal, Math.round(fps*transition_time[i]));
				circles_delta[i].range_index_y = 0;
			}

			context.beginPath();
			circles[i].x0 = circles_delta[i].range_x[circles_delta[i].range_index_x];
			circles_delta[i].range_index_x++;
			circles[i].y0 = circles_delta[i].range_y[circles_delta[i].range_index_y];
			circles_delta[i].range_index_y++;
			context.globalAlpha = 0;
			var dot_radius = 0;
			for(var k = 1; k < opacity_radius.length; k++){
				var mouse_dist = distance(circles[i].x0, circles[i].y0, mouse_x, mouse_y);
				if(mouse_dist < opacity_radius[k] && mouse_dist >= opacity_radius[k - 1]){
					context.globalAlpha = opacity_range[k - 1];
					dot_radius = dot_radius_range[k - 1];
					break;
				}
			}
			context.arc(circles[i].x0, circles[i].y0, dot_radius, 0, Math.PI * 2, false);
			context.fillStyle = color_dot;
			context.fill();
			context = canvas.getContext('2d');
			context.globalAlpha = 0;
			for(var j = 0; j < connections; j++){
			  var index = i * connections + j;
			  for(var k = 1; k < opacity_radius.length; k++){
				var mouse_dist = distance(circles[lines[index].start].x0, circles[lines[index].start].y0, mouse_x, mouse_y);
				if(mouse_dist < opacity_radius[k] && mouse_dist >= opacity_radius[k - 1])
					context.globalAlpha = opacity_range[k - 1];
			  }
			  context.beginPath();
			  context.moveTo(circles[lines[index].start].x0, circles[lines[index].start].y0);
			  context.lineTo(circles[lines[index].end].x0, circles[lines[index].end].y0);
			  context.strokeStyle = color_line;
			  context.stroke();
			}
		}
		window.requestAnimationFrame(drawStuff);
    }
}