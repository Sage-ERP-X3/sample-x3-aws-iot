"use strict";

var path = require("path");

module.exports = {
	application: "syracuse",
	extends: "collaboration",
	entities: {
		aws_iot_connection: require('./entities/aws_iot_connection').entity,
        aws_iot_topic: require('./entities/aws_iot_topic').entity,
        aws_iot_reading: require('./entities/aws_iot_reading').entity
	},
	representations: {},
	searchFacets: {},
	dbMeta: {
	    automaticImport: [path.join(__dirname, "scripts", "aws_iot_menu_entry.json")]
	}
};