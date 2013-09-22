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
	});
	myLocation = new google.maps.LatLng(43.367426685403, -8.4069229453665);
	var mapOptions = {
		zoom : 7,
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		center : myLocation
	};
	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
}

/* Función lanzadoa por el usuario cuando pulsa "Busca a tu alrededor" */
function buscaGas(ciudad, radio) {

	var centro;

	limpiarMapa();

	document.getElementById('listaregistros').style.display = 'block';

	geocoder = new google.maps.Geocoder();

	if (geocoder) {
		geocoder.geocode({
			"address" : ciudad
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				centro = results[0].geometry.location;
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
						var adaptado_discapacitado = markers[i].getAttribute("adaptado_discapacitado");
						var latlng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
						var distance = aOrden[j];
						marker = createMarker(url, denominacion, latlng, cp, direccion, localidad, distance);
						row = addNewRow(j, url, denominacion, cp, direccion, localidad, distance, id, adaptado_discapacitado);
					}
					$("[id^=camping_]").click(function() {
						var id = $(this).attr("id").substring(8);
						$.post(hostweb + "ajax.php", {
							fun : "getCamping",
							param : new Array("es", id)
						}, function(data) {
							$("#camping_data").html(data["html"]);
						}, "json");
					});

				});

			} else {
				alert("La poblacion indicada no puede ser localizada. Perdone por las molestias.");
				setCookie("ciudad", "", 365);
			}
		});
	}

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
function addNewRow(i, url, denominacion, cp, direccion, localidad, distance, id, adaptado_discapacitado) {
	var TABLE = idTabla;
	var newRow = TABLE.insertRow(-1);
	// newRow.setAttribute("onclick","openMarker("+i+");return false");

	var newCell = newRow.insertCell(newRow.cells.length);
	newCell.setAttribute("style", "width:100%;");
	newCell.innerHTML = denominacion;

	var newCell = newRow.insertCell(newRow.cells.length);
	newCell.setAttribute("style", "color:#AAA;text-align:right;padding-right:10px;min-width:95px;");
	newCell.innerHTML = distance.toFixed(0).replace(".", ",") + " metros";

	var newCell = newRow.insertCell(newRow.cells.length);
	newCell.setAttribute("style", "min-width:95px;");
	newCell.innerHTML = "<a href='#camping' style='color:blue;cursor:pointer;' id='camping_" + id + "'> ver >> </a>";

}

/* Encargada de crear los iconos de cada gasolinera en el mapa */
function createMarker(url, denominacion, latlng, cp, direccion, localidad, distance) {

	/*
	 * var image = new google.maps.MarkerImage( "/img/registros/"+icono, new
	 * google.maps.Size(30,27), new google.maps.Point(0,0), new
	 * google.maps.Point(15,27) );
	 * 
	 * var shadow = new google.maps.MarkerImage(
	 * "/img/registros/ico-sombra.png", new google.maps.Size(48,27), new
	 * google.maps.Point(0,0), new google.maps.Point(15,27) ); var marker = new
	 * google.maps.Marker({position: latlng, map: map,icon: image,shadow:
	 * shadow});
	 */

	var contenido = "<a href=" + url + ">" + denominacion + "</a><br>" + direccion + "<br><span style=\"color:#AAA;font-size:11px\">a " + distance.toFixed(0).replace(".", ",") + " metros</span>";
	var marker = new google.maps.Marker({
		position : latlng,
		map : map
	});

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

function openMarker(i) {
	google.maps.event.trigger(markerArray[i], "click");
};

/* Función para limpiar el mapa de iconos y otros elementos */
function limpiarMapa() {

	for (i = 0; i < markerArray.length; i++) {
		markerArray[i].setMap(null);
		/* labelArray[i].setMap(null); */
		idTabla.deleteRow(idTabla.rows.length - 1);
	}
	markerArray = new Array();
	/* labelArray = new Array(); */

	if (draw_circle != null) {
		draw_circle.setMap(null);
	}

}

$(document).ready(function() {
	initialize();
});

/* window.onload=initialize; */
/* initialize(); */

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