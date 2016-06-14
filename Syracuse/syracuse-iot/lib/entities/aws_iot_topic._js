"use strict"

var datetime = require('syracuse-core/lib/types/datetime');
var adminHelper = require("syracuse-collaboration/lib/helpers").AdminHelper;
var resourceHelpers = require("syracuse-core/lib/resource/util");

exports.entity = {
    $properties: {
        topic: {
            $title: "Topic"
        },
        representationName: {
            $title: "Representation name"
        },
        forceUpper: {
            $title: "Force uppercase on properties",
            $type: "boolean"
        }
    },
    $relations: {
        endpoint: {
            $title: "Endpoint",
            $type: "endPoint",
            $default: function(_) {
                this.endpoint(_, adminHelper.getCollaborationEndpoint(_));
            }
        }
    },
    $functions: {
        onMessage: function(_, topic, payload) {
            var self = this;
            console.log("Got payload on topic", topic, payload.toString());
            try {
                var db = self.endpoint(_).getOrm(_);
                var ent = db.getEntity(_, self.representationName(_), "$edit");
                var inst = ent.createInstance(_, db);
                var pp = JSON.parse(payload.toString());
                Object.keys(pp).forEach_(_, function(_, key) {
					var upkey = self.forceUpper(_) ? key.toUpperCase() : key;
                    var prop = ent.$properties[upkey];
                    var val = pp[key];
                    if (prop) inst[upkey](_, resourceHelpers.parseValue(prop, val));   
                });
                var res = inst.save(_);
            } catch(e) {
                console.error("Error creating payload", e.message, e.stack);
            }
        }
    },
	$services: {
        subscribe: {
            $method: "POST",
            $isMethod: true,
            $title: "Subscribe",
			$execute: function(_, context, instance) {
                instance._parent.subscribe(_, instance);    
                instance.$addDiagnose("info", "Subscribed to " + instance.topic(_));
                console.log("Subscribed", instance.topic(_));
            }
        },
        unsubscribe: {
            $method: "POST",
            $isMethod: true,
            $title: "Unsubscribe",
			$execute: function(_, context, instance) {
                instance._parent.unsubscribe(_, instance);    
                instance.$addDiagnose("info", "Unsubscribed to " + instance.topic(_));
                console.log("Unsubscribed", instance.topic(_));
            }
        },
/*		test: {
            $method: "POST",
            $isMethod: true,
            $title: "Test",
			$execute: function(_, context, instance) {
				var self = instance;
                var db = self.endpoint(_).getOrm(_);
                var ent = db.getEntity(_, self.representationName(_), "$edit");
				console.log("(59)", ent);
                var inst = ent.createInstance(_, db);
				inst.STAMP(_, (new Date()).toISOString());
				inst.TEMPERATURE(_, resourceHelpers.parseValue(ent.$properties.TEMPERATURE, 33));
				inst.HUMIDITY(_, resourceHelpers.parseValue(ent.$properties.TEMPERATURE, 55));
                var res = inst.save(_);
				console.log("(64)", res.$properties.STAMP);
				console.log("(64)", res);
				console.log("(64)", res.$actions.$save);
            }
		}*/
	}
}