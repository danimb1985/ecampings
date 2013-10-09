var cnf = [];
var lang = [];
database = openDatabase("ecampings", "1.0", "ecampings", 1024 * 1024);
database.transaction(function(t) {
	t.executeSql("CREATE TABLE IF NOT EXISTS config(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value TEXT, UNIQUE (name));");
	t.executeSql("INSERT INTO config (name,value) VALUES ('lang','es');");
	t.executeSql("INSERT INTO config (name,value) VALUES ('radio','5000');");
});
database.transaction(function(t) {
	t.executeSql("select * from config;", [], function(t, r) {
		for ( var i = 0; i < r.rows.length; i++) {
			cnf[r.rows.item(i).name] = r.rows.item(i).value;
		}
		var script = document.createElement('script');
		script.src = "js/lang_" + cnf['lang'] + ".js";
		document.getElementsByTagName('script')[0].parentNode.appendChild(script);
	});
});
$(document).on("pageinit", "#settings", function() {
	$("#op_radio option[value='" + cnf['radio'] + "']").attr("selected", "selected");
	$("#op_lang option[value='" + cnf['lang'] + "']").attr("selected", "selected");
	$("#op_lang").selectmenu("refresh", true);
	$("#op_radio").selectmenu("refresh", true);
	$("#op_lang").change(function() {
		database.transaction(function(t) {
			t.executeSql("update config set value = ? where name = 'lang';", [ $("#op_lang").val() ], function() {
				cnf['lang'] = $("#op_lang").val();
				document.location.href = "index.html";
			});
		});
	});
	$("#op_radio").change(function() {
		database.transaction(function(t) {
			t.executeSql("update config set value = ? where name = 'radio';", [ $("#op_radio").val() ]);
			cnf['radio'] = $("#op_radio").val();
			map.setZoom(zoom[cnf['radio']]);
		});
	});
	$("#op_radio option").each(function() {
		$(this).html($(this).html() + lang['Km']);
	});
	$("#op_radio").selectmenu("refresh", true);
	$("label[for='lang']").html(lang["language"]);
	$("label[for='radio']").html(lang["radius"]);
});