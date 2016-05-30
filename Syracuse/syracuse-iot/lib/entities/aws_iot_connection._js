"use strict"

var awsIot = require('aws-iot-device-sdk');
var adminHelper = require("syracuse-collaboration/lib/helpers").AdminHelper;
var proxy = require('proxy-agent');
var globals = require('streamline/lib/globals');
var sessionManager = require('syracuse-session/lib/sessionManager').sessionManager;

function _makeOptions(_, connection) {
    var db =  adminHelper.getCollaborationOrm(_);

    var entity = db.model.getEntity(_, "setting");
    var inst = db.fetchInstance(_, entity,{
        jsonWhere : {
            proxy : true
        }
    });
    var proxyInfo="";
    if( inst ){
        // get proxy and condif
        proxyInfo="http://"+inst.proxyConf(_).user(_);
        proxyInfo=proxyInfo+":"+inst.proxyConf(_).password(_);
        proxyInfo=proxyInfo+"@"+inst.proxyConf(_).host(_);
        proxyInfo=proxyInfo+":"+inst.proxyConf(_).port(_);
    }
    // connect the entity to a awsIot device and link to the topic defined. Then we can
    var options = {
        region : connection.region(_),
        clientId: connection.$uuid,
        secretKey: connection.keySecret(_),
        accessKeyId: connection.accessKey(_),
        protocol: "wss"
    };
/*	if (proxyInfo) {
		options.websocketOptions = {
            agent:proxy(proxyInfo)
        }
	}*/
    return options;
}

function _createSession(_) {
	// create batch session
    var db =  adminHelper.getCollaborationOrm(_);
	var user = db.fetchInstance(_, db.getEntity(_, "user"), {
		jsonWhere: {
			login: "admin"
		}
	});
	var role = db.fetchInstance(_, db.getEntity(_, "role"), {
		jsonWhere: {
			code: "ADMIN"
		}
	});
	var locale = db.fetchInstance(_, db.getEntity(_, "localePreference"), {
		jsonWhere: {
			code: "en-US"
		}
	});
	sessionManager.createBatchSession(_, user, role, locale, []);
}

exports.entity = {
	$titleTemplate: "Aws IOT Connection",
	$descriptionTemplate: "{description}",
    $properties: {
        code: {
            $title: "Code",
            $isMandatory: true,
			$linksToDetails: true
        },
        description: {
            $title: "Description",
            $isLocalized: true,
            $isMandatory: true
        },
        accessKey: {
            $title: "Access key"
        },
        keySecret: {
            $title: "Key secret"
        },
        region: {
            $title: "AWS region",
            $isMandatory: true
        }
    },
    $relations: {
        topics: {
            $type: "aws_iot_topics",
            $title: "Topics",
            $isChild: true
        }
    },
    $functions: {
        connect: function(_) {
			console.log("Connecting");
            var self = this;
            self.device = awsIot.device(_makeOptions(_, self));
            (function(cb) {
                var sent = false;

                self.device.on("error", function(error){
					console.log("Error", error);
                    if( !sent ) {
                        cb(error);
                        sent = true;
                    }
                    self.device.end();
                    self.device = null;
                });
                self.device.on("connect", function(){
					console.log("Connected");
                    if( !sent ) {
                        cb(undefined, self.device);
                        sent = true;
                    }
                });
                self.device.on("message", function(topic, message) {
					(function(_) {
						if (!globals.context.session) _createSession(_);
						self.topics(_).toArray(_).forEach_(_, function(_, topicInst) {
							if (topicInst.topic(_) === topic) topicInst.onMessage(_, topic, message);
						});
					})(_ >> function(err, result) {
						if (err) console.error(err);
					});
                });
            })(~_);
        },
        subscribe: function(_, topic) {
            var self = this;
            if (!self.device) self.connect(_);
            if (!self.device) throw new Error("No device after connect !");
            self.device.subscribe(topic.topic(_));
        }    
    },
    $services: {
        subscribeAll: {
            $method: "POST",
            $isMethod: true,
            $title: "Subscribe to topics",
			$execute: function(_, context, instance) {
                instance.topics(_).toArray(_).forEach_(_, function(_, topic) {
                    instance.subscribe(_, topic);    
                    instance.$addDiagnose("info", "Subscribed to " + topic.topic(_));
                    console.log("Subscribed", topic.topic(_));
                });
            }
        }
    }
}