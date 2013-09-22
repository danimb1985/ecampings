database = openDatabase("ecampings", "1.0", "ecampings", 1024 * 1024);
database.transaction(function(t) {
	t.executeSql("CREATE TABLE IF NOT EXISTS config(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value TEXT, UNIQUE (name))");
	t.executeSql("INSERT IGNORE INTO config (name,value) VALUES('lang','es')");
	t.executeSql("INSERT IGNORE INTO config (name,value) VALUES('radio','5000')");
});
function executeSQL(query, params) {
	database.transaction(function(t) {
		t.executeSql(query, params);
	});
}
function resultSQL(query, params) {
	database.transaction(function(t) {
		t.executeSql(query, params, function(t, r) {
			return r;
		});
	});
}
var config = database.transaction(function(t) {
	t.executeSql("select * from config;", [], function(t, r) {
		var conf = [];
		for ( var i = 0; i < r.rows.length; i++) {
			conf[r.rows.item(i).name] = r.rows.item(i).value;
		}
		return conf;
	});
});
$(document).ready(function() {
	/*
	$("#op_radio option[value='" + window.config['radio'] + "']").attr("selected", "selected");
	$("#op_lang option[value='" + window.config['lang'] + "']").attr("selected", "selected");
	$("#op_lang").selectmenu("refresh", true);
	$("#op_radio").selectmenu("refresh", true);
	*/
	$("#op_lang").change(function() {
		database.transaction(function(t) {
			t.executeSql("update config set value = ? where name = 'lang';", [ $("#op_lang").val() ], function() {
				window.config['lang'] = $("#op_lang").val();
			});
		});
	});
	$("#op_radio").change(function() {
		database.transaction(function(t) {
			t.executeSql("update config set value = ? where name = 'radio';", [ $("#op_radio").val() ]);
		});
	});

});