/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
blnLocRunning = false;
blnInBackground = false;
strHost = "";
intCompNo = 0;
intSeqNo = 0;
strTechID = "";

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        //alert("In receivedEvent");
        console.log("In receivedEvent 01");
        fillvars();
        checkvalues(false);
        console.log('Received Event: ' + id);
    }
};

function onResume() {
    console.log("app resumed");
    blnInBackground = false;
    fillvars();
    checkvalues(false);
    return;
}

function onPause() {
    blnInBackground = true;
    return;
}

function alertDismissed() {
    return;
}

function fillvars() {
    if (localStorage.LocHost)
    {
        strHost = localStorage.LocHost;
        document.getElementById('txtHost').value = strHost;
    }
    if (localStorage.LocCompNo)
    {
        intval = parseInt(localStorage.LocCompNo, 10);
        intCompNo = 0;
        if (intval > 0 && intval < 1000)
        {
            intCompNo = intval;
        }
        if (intCompNo > 0)
        {
            document.getElementById('txtCompNo').value = intCompNo;
        }

    }
    if (localStorage.LocTechID)
    {
        strTechID = localStorage.LocTechID;
        document.getElementById('txtTechID').value = strTechID;
    }
}

function checkvalues(ShowError) {
    blnError = false;
    strError = "";
    lenHost = document.getElementById('txtHost').value.length;
    if (lenHost < 1)
    {
        strError += "Invalid Host or IP address\r\n";
        blnErrro = true;
    }
    intVal = parseInt(document.getElementById('txtCompNo').value, 10);
    if (isNaN(intVal))
    {
        intVal = 0;
    }
    if (intVal < 1 || intVal > 999)
    {
        strError += "Invalid Company number\r\n";
        blnError = true;
    }
    lenTechID = document.getElementById('txtTechID').value.length;
    if (lenTechID < 1)
    {
        strError += "Invalid TechID\r\n";
        blnError = true;
    }
    if (ShowError && blnError)
    {
        navigator.notification.alert(
            strError,
            alertDismissed,
            'Error in input fields',
            'OK'
        );
    }
    if (blnLocRunning)
    {
        document.getElementById('btnStart').disabled = true;
        document.getElementById('btnStop').disabled = false;
        document.getElementById('backstatus').innerHTML = "Broadcasting locations";
    } else {
        document.getElementById('btnStart').disabled = false;
        document.getElementById('btnStop').disabled = true;
        document.getElementById('backstatus').innerHTML = "Not broadcasting location";
    }
    return blnError;
}

function start() {
//    if (blnLocRunning)
//    {
//        return;
//    }
    /* If checkvalues returns true then errors were found */
    if (checkvalues(true))
    {
        return;
    }
    strHost = document.getElementById('txtHost').value;
    strCompNo = document.getElementById('txtCompNo').value;
    intCompNo = parseInt(strCompNo, 10);
    strTechID = document.getElementById('txtTechID').value;
    localStorage.setItem("LocHost", strHost);
    localStorage.setItem("LocCompNo", intCompNo);
    localStorage.setItem("LocTechID", strTechID);
    intSeqNo = 0;

    // Your app must execute AT LEAST ONE call for the current position via standard Cordova geolocation,
    //  in order to prompt the user for Location permission.
    window.navigator.geolocation.getCurrentPosition(function(location) {
        console.log('Location from Phonegap');
    });

    backgroundGeolocation = window.backgroundGeolocation || window.backgroundGeoLocation || window.universalGeolocation;

    /**
    * This callback will be executed every time a geolocation is recorded in the background.
    */
    var callbackFn = function(location,blnBackground) {
        var d = new Date();
        if (!blnBackground)
        {
            document.getElementById('backstatus').innerHTML = "Sending broadcasts" + " " + d.toLocaleString();
        }

        console.log('[js] backgroundGeolocation callback:  ' + location.latitude + ',' + location.longitude + " " + d.toLocaleString());
        sendupdate(location);
        // Do your HTTP request here to POST location to your server.
        // jQuery.post(url, JSON.stringify(location));

        /*
        IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
        and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
        IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
        */
        backgroundGeolocation.finish();
    };

    function sendupdate(location) {
        xmlhttp = new XMLHttpRequest();
        if (!xmlhttp)
        {
            console.log("Could not transmit - no xmlhttp");
            return;
        }
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
            {
                var xmlDoc = xmlhttp.responseText;
                console.log("Got post response: " + xmlDoc);
            }
        };

        var d = new Date();
        var strUpdTime = formatdate(d);
        var mph = Math.round(location.speed * 3600 / 1610.3*1000)/1000
        var locupdate = "request-cd=XLOC&comp-no=" + localStorage.LocCompNo +
                       "&tech-id=" + localStorage.LocTechID + "&longitude=" +
                       location.longitude + "&latitude=" + location.latitude +
                       "&accuracy=" + location.accuracy + "&speed=" +
                       mph + "&timestamp=" + strUpdTime +
                       "&resp-page=locupdresult.htm&error-page=" +
                       "locupderr.html";
        var url="https://" + localStorage.LocHost + "/cgi-bin/facshtml.cgi";
        console.log(url);
        console.log(locupdate);
        xmlhttp.open("POST",url,true);
        xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xmlhttp.responseType = "text";
        xmlhttp.send(locupdate);
    }

    var failureFn = function(error) {
        console.log('BackgroundGeolocation error');
    };

    // BackgroundGeolocation is highly configurable. See platform specific configuration options
    backgroundGeolocation.configure(callbackFn, failureFn, {
        desiredAccuracy: 10,
        stationaryRadius: 100,
        distanceFilter: 30,
        debug: true,
        pauseLocationUpdates: false,
        startOnBoot: true,
        startForeground: true,
        locationProvider: 0,
        interval: 1000
    });

    console.log("Start Tracking");
    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
    backgroundGeolocation.start();
    console.log("Tracking Started");

    blnLocRunning = true;

    checkvalues(false);
    // If you wish to turn OFF background-tracking, call the #stop method.
    // backgroundGeolocation.stop();

//    alert("Start Tracking");
}

function formatdate(dt) {
	strYear = dt.getFullYear().toString();
	var mth = dt.getMonth() + 1;
	var str = mth.toString();
	strMonth = pad(str, 2, '0', STR_PAD_LEFT);
	str = dt.getDate().toString();
	strDay = pad(str, 2, '0', STR_PAD_LEFT);
	var hrs = dt.getHours().toString();
	var mins = dt.getMinutes().toString();
	var strTime = pad(hrs, 2, '0', STR_PAD_LEFT) + ":" +
	              pad(mins,2, '0', STR_PAD_LEFT);
	return strYear + "-" + strMonth + "-" + strDay + " " + strTime;
}

/**
 *
 * Javascript string pad http://www.webtoolkit.info/
 *
 */

var STR_PAD_LEFT = 1;
var STR_PAD_RIGHT = 2;
var STR_PAD_BOTH = 3;

function pad(str, len, pad, dir) {
	if (str == undefined) {
		return;
	}
	if (typeof (len) == "undefined") {
		var len = 0;
	}
	if (typeof (pad) == "undefined") {
		var pad = ' ';
	}
	if (typeof (dir) == "undefined") {
		var dir = STR_PAD_RIGHT;
	}

	if (len + 1 >= str.length) {

		switch (dir) {

		case STR_PAD_LEFT:
			str = Array(len + 1 - str.length).join(pad) + str;
			break;

		case STR_PAD_BOTH:
			var right = Math.ceil((padlen = len - str.length) / 2);
			var left = padlen - right;
			str = Array(left + 1).join(pad) + str + Array(right + 1).join(pad);
			break;

		default:
			str = str + Array(len + 1 - str.length).join(pad);
			break;

		} // switch

	}

	return str;

}

function stop() {
    if (!blnLocRunning)
    {
        return;
    }
    backgroundGeolocation.stop();
    blnLocRunning = false;
    checkvalues(false);
}
