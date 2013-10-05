var map;
var hostweb = 'http://ecampings.d228.dinaserver.com/';
var idTabla = document.getElementById("listaregistros");

var directionsService;
var stepDisplay;
var markerArray = [];
var labelArray = [];
var infowindow;
var radio;

var draw_circle = null;

/* Función principal que se encarga de crear el mapa de Google */
function initialize() {
	var myLocation;
	navigator.geolocation.getCurrentPosition(function(position) {
		myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		var mapOptions = {
			zoom : 7,
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			center : myLocation
		};
		map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
		buscaGasC(myLocation, cnf['radio']);
	}, function() {
		var mapOptions = {
			zoom : 7,
			mapTypeId : google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
	});

}

/* Función lanzadoa por el usuario cuando pulsa "Busca a tu alrededor" */
function buscaGas(ciudad, coordenadas, radio) {

	var centro;
	limpiarMapa();
	geocoder = new google.maps.Geocoder();
	if (ciudad == '') {
		crea_puntos(coordenadas, radio);
	} else {
		if (geocoder) {
			geocoder.geocode({
				"address" : ciudad
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					centro = results[0].geometry.location;
					crea_puntos(centro, radio);
				} else {
					alert("La poblacion indicada no puede ser localizada. Perdone por las molestias.");
				}
			});
		}
	}

}

function crea_puntos(centro, radio) {
	map.setCenter(centro);
	var tramos = DrawCircle(radio, centro);
	var aTramos = JSON.stringify(tramos);
	var url = hostweb + "get_registros.php";
	downloadUrl(url, "aTramos=" + aTramos, function(data) {
		var xml = xmlParse(data);
		var markers = xml.getElementsByTagName("marker");
		var newmarkers;
		var aKeys = new Array();
		var aKeys = new Array();
		var aOrden = new Array();
		for ( var i = 0; i < markers.length; i++) {
			var lat = markers[i].getAttribute("lat");
			var lng = markers[i].getAttribute("lng");
			var latlng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
			try {
				var distance = google.maps.geometry.spherical.computeDistanceBetween(centro, latlng);
				aKeys[distance] = i;
				aOrden[i] = distance;
			} catch (err) {

			}
		}
		aOrden.sort(function(a, b) {
			return a - b
		});

		for ( var j = 0; j < aOrden.length; j++) {
			var i = aKeys[aOrden[j]];

			var lat = markers[i].getAttribute("lat");
			var lng = markers[i].getAttribute("lng");
			var icono = markers[i].getAttribute("icono");
			var denominacion = markers[i].getAttribute("nombre");
			var cp = markers[i].getAttribute("cp");
			var localidad = markers[i].getAttribute("localidad");
			var direccion = markers[i].getAttribute("direcc");
			var url = markers[i].getAttribute("url");
			var id = markers[i].getAttribute("id");
			var adaptado_discapacitado = markers[i].getAttribute("disability");
			var telefono = markers[i].getAttribute("telefono");
			var latlng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
			var distance = aOrden[j];
			marker = createMarker(url, denominacion, latlng, cp, direccion, localidad, distance, id, adaptado_discapacitado);
			row = addNewRow(j, url, denominacion, cp, direccion, localidad, distance, id, adaptado_discapacitado, telefono);
		}
	});
}

function DrawCircle(metros, center) {
	var tramos = [];
	draw_circle = new google.maps.Circle({
		center : center,
		radius : parseInt(metros),
		strokeColor : "#FF0000",
		strokeOpacity : 0.8,
		strokeWeight : 2,
		fillColor : "#FF0000",
		fillOpacity : 0.35,
		map : map
	});

	var bounds = draw_circle.getBounds();
	var maxLatTr = bounds.getNorthEast().lat();
	var minLatTr = bounds.getSouthWest().lat();
	var maxLongTr = bounds.getNorthEast().lng();
	var minLongTr = bounds.getSouthWest().lng();
	tramos[0] = [ maxLatTr, maxLongTr, minLatTr, minLongTr ];
	return tramos;
}

/* Encargada de crear la tabla con el listado de registros */
function addNewRow(i, url, denominacion, cp, direccion, localidad, distance, id, adaptado_discapacitado, telefono) {

	$('#campings_list').append("<li data-icon='false'>" + "<a href='#camping' onclick='carga_camping(" + id + ")'>" + "<img src='css/images/show_camping.jpg'/>" + "<h3>" + denominacion + "</h3>" + '<p onclick="document.location.href=\'tel:' + telefono + '\'">' + telefono + "</p>" + "<span class='distancia'>A " + (distance.toFixed(0).replace(".", ",") / 1000).toFixed(1) + " Km<span>" + "</a>" + "</li>");
	try {
		$('#campings_list').listview('refresh');
	} catch (e) {
	}
}

function carga_camping(id) {
	$.post(hostweb + "ajax.php", {
		fun : "getCamping",
		param : new Array(cnf['lang'], id)
	}, function(data) {
		$("#datos_camping").html(data["html"]);
	}, "json");
}

/* Encargada de crear los iconos de cada gasolinera en el mapa */
function createMarker(url, denominacion, latlng, cp, direccion, localidad, distance, id, adaptado_discapacitado) {

	var contenido = "<a href='#camping' onclick='carga_camping(" + id + ")'>" + denominacion + "</a><br>" + direccion + "<br><span style=\"color:#AAA;font-size:11px\">a " + (distance.toFixed(0).replace(".", ",") / 1000).toFixed(1) + " Km</span>";
	if (adaptado_discapacitado == 'S') {
		var marker = new google.maps.Marker({
			icon : {
				url : 'css/images/ico-map-disability.png'
			},
			position : latlng,
			map : map
		});
	} else {
		var marker = new google.maps.Marker({
			position : latlng,
			map : map
		});
	}

	google.maps.event.addListener(marker, "click", function() {
		if (infowindow)
			infowindow.close();
		infowindow = new google.maps.InfoWindow({
			content : contenido
		});
		infowindow.open(map, marker);
	});

	markerArray.push(marker);

	return marker;
}

/* Función para limpiar el mapa de iconos y otros elementos */
function limpiarMapa() {

	for (i = 0; i < markerArray.length; i++) {
		markerArray[i].setMap(null);
		/* labelArray[i].setMap(null); */

	}
	$("#campings_list").html("");
	markerArray = new Array();
	/* labelArray = new Array(); */

	if (draw_circle != null) {
		draw_circle.setMap(null);
	}

}

/** ****************************************************************************** */
/* FUNCIONES QUE NO NECESITARÉ, PROBAR QUE FUNCIONA TODO DESPUES DE ELIMINARLAS */
/** ****************************************************************************** */

/* Funciones necesarias para escribir y borrar cookies */
function setCookie(c_name, value, expiredays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expiredays);
	document.cookie = c_name + "=" + escape(value) + ";path=/" + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString());
}

function getCookie(c_name) {
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1)
				c_end = document.cookie.length;
			return unescape(document.cookie.substring(c_start, c_end));
		}
	}
	return "";
}