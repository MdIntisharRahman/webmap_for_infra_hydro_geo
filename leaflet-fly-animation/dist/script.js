var startPoint = [5.922044619883305, 24.345703125];
var map = L.map('map').setView(startPoint, 3);

//var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
var googleTerrain = new L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);
var first = false;
var points = [
	{
		"point": [32.329106, 15.813050],
		"zoom": 5
	},{
		"point": [-33.445448, 22.590827],
		"zoom": 5
	},{
		"point": startPoint,
		"zoom": 3
	}
];

var duration = 3;
var index = 0;
googleTerrain.on('load', function(e) {
  
	if(first) return;
	first=true;
	animation();
});

function animation(){
	if(index >= points.length) return ;
	console.log(index);
	var timeout = (index == 0) ? 500 : duration * 1000 + 850;
	console.log("timeout",timeout);
	var point = points[index].point;
	var zoom = points[index].zoom;
	setTimeout(function(){
		fly(point,zoom);
	},timeout);

	index++;
}

function fly(position,zoom){
  console.log('flyyy');
  //map.flyTo(position,zoom,{pan:{easeLinearity: 1}});
  map.flyTo(position, zoom, {duration: duration,easeLinearity: 1});
  animation();
}