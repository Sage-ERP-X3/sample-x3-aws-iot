"use strict"

exports.entity = {
	$titleTemplate: "Aws IOT Reading",
	$descriptionTemplate: "IOT Reading",
    $properties: {
        temperature: {
            $title: "Temperature",
            $type: "real"
        },
        humidity: {
            $title: "Humidity",
            $type: "real"
        },
        stamp: {
            $title: "Stamp",
            $type: "datetime"
        }
    }
}