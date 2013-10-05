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
});