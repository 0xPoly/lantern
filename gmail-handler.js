/**
 * gmail-parser.js
 * Handles gmail-specific tasks
 */
"use strict";

/* Constants
 */
var GMAIL_EXPANDED_HEADER_CLASS = "gE iv gt";
var GMAIL_MESSAGE_CLASS = "G3 G2";
var GMAIL_MESSAGE_ID_CLASS = "ii gt adP";
var GMAIL_ORIGINAL_MESSAGE_URL = "https://mail.google.com/?view=om";
var GMAIL_USER_ID_PREFIX = "&ik=";
var GMAIL_MESSAGE_ID_PREFIX = "&th=";
var GMAIL_MESSAGE_ID_REGEX = /m[a-f0-9]{16}/i;
var GMAIL_USER_ID = null;
var GMAIL_USER_ID_REGEX = /"[a-f0-9]{10}"/i;

var gmail = {};

/**
 * Finds email header elements currently displayed on screen.
 * Note that these bear no relation to SMTP headers, these are the
 * aesthetic headers used by GMail.
 * Returns array of type `message`.
 */
gmail.findMessages = function() {
    var allMsgsSettled = new Array();
    var messageElements = document.getElementsByClassName(GMAIL_MESSAGE_CLASS);

    for (var x = 0; x < messageElements.length; x++) {
        try {
            var injection = fetchInjectPoint(messageElements[x]);
            var headers = fetchRawHeaders(messageElements[x]);

            var messageFullfilled = [injection, headers];
            var messagePromise = Promise.all(messageFullfilled);

            allMsgsSettled.push(messagePromise);
        } catch (error) {
            console.warn("Could not parse message. Error: " + error);
        }
    }

    return Promise.all(allMsgsSettled);
};


var fetchInjectPoint = function(messageElement) {
    return new Promise(function(resolve, reject) {
        var result = messageElement.getElementsByClassName("gH")[0];

        if (result == undefined) {
            reject("Could not find injection point");
        }

        resolve(result);
    });
}

var fetchRawHeaders = function(messageElement) {
    return new Promise(function(resolve, reject) {
        if (GMAIL_USER_ID == null) {
            GMAIL_USER_ID = fetchUserID();
        }
        
        var messageID = fetchMessageID(messageElement);

        var request = new XMLHttpRequest();
        var messageURL = GMAIL_ORIGINAL_MESSAGE_URL
                 + GMAIL_USER_ID_PREFIX
                 + GMAIL_USER_ID
                 + GMAIL_MESSAGE_ID_PREFIX
                 + messageID;

        request.open("GET", messageURL, true);
        request.onload = function(e) {
            if (request.status==200) resolve(request.responseText);
            else reject("Error executing XMLHttpRequest call to fetch OM");
        }
        request.onerror = reject;
        request.send(null)
    });
}

/**
 * Unique user ID can only be extracted from source code.
 * Seems to be consistent throughout session.
 */
var fetchUserID = function() {
    var source = getSource();
    var base = source.indexOf("var GLOBALS=[");
    if (base > -1) {
        // somewhere towards begining of GLOBALS array
        var slice = source.slice(base, base + 300);
        var result = GMAIL_USER_ID_REGEX.exec(slice).toString();
        // remove surrounding qoutes
        result = result.slice(1,-1);
        return result;
    } else {
        throw "Fatal: Unable to find globals array in page source."
    }
}

var fetchMessageID = function(messageElement) {
    var IDContainer = messageElement.getElementsByClassName(GMAIL_MESSAGE_ID_CLASS)[0];
    if (IDContainer == undefined) 
        throw "Could not find message ID class";
    var className = IDContainer.className;
    var messageID = GMAIL_MESSAGE_ID_REGEX.exec(className).toString();
    if (messageID != null) {
        return messageID.slice(1);
    } else {
        throw "Could not find message ID";
    }
}
