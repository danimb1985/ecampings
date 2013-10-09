//Initialize function
var init = function() {
	// TODO:: Do your initialization job
	console.log("init() called");
};
$(document).ready(function() {
	initialize();
	$("#search_address").click(function() {
		buscaGas($("#address").val(), '', cnf['radio']);
	});
	$("#search_location").click(function() {
		navigator.geolocation.getCurrentPosition(function(position) {
			myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			buscaGas('', myLocation, cnf['radio']);
		});
	});
	$("#address").attr("placeholder", lang["search"]);
	$("#op_radio option").each(function() {
		$(this).html($(this).html() + lang['Km']);
	});
	$("#op_radio").selectmenu("refresh", true);
	$("label[for='lang']").html(lang["language"]);
	$("label[for='radio']").html(lang["radius"]);
});