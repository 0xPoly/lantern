"use strict";

/* Constants
 */
var AUTH_HEADERS_REGEX = /(DKIM|SPF|DMARC)=([a-z]+)/i;

/**
 * `mail` is a class that represents a single SMTP message.
 *
 * Security indicators:
 * The DKIM, SPF and DMARC fields are represented using a
 * integer. There are 5 possible values:
 *
 *  3: Pass
 *  2: Neutral/Not configured
 *  1: Error/Misconfiguration
 *  0: Failure
 *
 *  4: Not specified
 *
 * With multiple records Lantern is fail-safe: 
 * If multiple records are found for the same field, only 
 * the lowest value (most severe warning) is considered.
 */
function Message() {
    // DOM element to inject visual indicator into
    this.injectionPoint;

    // Initialize raw message headers
    this.headers = "";

    this.parsedHeaders = null;

    this.DKIM = 4;
    // Sender Policy Framework - RFC 7208
    this.SPF = 4;
    this.DMARC = 4;
    this.encrypt = 4;
}

Message.prototype._parseHeaders = function(rawHeaders) {
    self.headers = rawHeaders;

    // Only read headers, discard message body
    var bodyRegex = /^Content-Type: /im;
    var bodyPos = self.headers.indexOf(bodyRegex.exec(self.headers));
    var headerLines = self.headers.substring(0, bodyPos);

    // now determine the present headers and store them in an object
    var headers = new Object();
    var headerRegExp = /^(.+?): ((.|\r\n\s)+)\r\n/mg;
    var h;
    while (h = headerRegExp.exec(headerLines))
        headers[h[1]] = h[2];

    self.parsedHeaders = headers;
}

/**
 * '_decideSecurity()' accepts a message class with parsed
 * headers and decides which security indicators should be
 * displayed to the user.
 */
Message.prototype._decideSecurity = function() {
    var authHeaders = self.parsedHeaders["Authentication-Results"];
    authHeaders = authHeaders.split('\n');

    // parse auth headers line by line
    for(var i = 0; i < authHeaders.length; i++) {
        var individualResult = AUTH_HEADERS_REGEX.exec(authHeaders[i]);
        if (individualResult != null) {
        var type = individualResult[1];
        var result = individualResult[2];

            switch(type) {
                // different-case intentional fallthroughs
                case "spf":
                case "SPF":
                    if (this.SPF > securityLevel(result))
                        this.SPF = securityLevel(result);
                    break;
                case "dkim":
                case "DKIM":
                    if (this.DKIM > securityLevel(result))
                        this.DKIM = securityLevel(result);
                    break;
                case "dmarc":
                case "DMARC":
                    if (this.DMARC > securityLevel(result))
                        this.DMARC = securityLevel(result);
                    break;
            }
            debugger;
        }
    }
}

var securityLevel = function(result) {
    switch (result) {
        case "pass":
        case "PASS":
            return 3;
            break;
        case "none":
        case "neutral":
        case "NONE":
        case "NEUTRAL":
            return 2;
            break;
        case "temperror":
        case "permerror":
        case "TEMPERROR":
        case "PERMERROR":
            return 1;
            break;
        case "fail":
        case "softfail":
        case "hardfail":
        case "policy":
        case "FAIL":
        case "SOFTFAIL":
        case "HARDFAIL":
        case "POLICY":
            return 0;
            break;
    }
}

var createMessage = function(injectionPoint, headers) {
    var tempMessage = new Message();

    tempMessage.injectionPoint = injectionPoint;
    tempMessage._parseHeaders(headers);
    tempMessage._decideSecurity();

    return tempMessage;
}

var collectHeaders = function() {
    var unProcessedMessages = new Array();
    var mailHost = getMailHost();
    switch (mailHost) {
        case "gmail":
            unProcessedMessages = gmail.findMessages();
            return unProcessedMessages;
            break;
        default:
            // errors thrown earlier should halt script before reaching here
            throw "This error should never fire. Something has gone terribly wrong.";
    }

    return unProcessedMessages;
}

var getMailHost = function () {
    var URL = getURL();
    if (URL.includes("mail.google.com"))
        return "gmail";
    else {
        console.err("URL: " + URL + " does not match any supported webmail.");
        throw "Unsupported webmail service";
    }
}

var getURL = function() {
    return document.URL;
}

var getSource = function() {
    return document.documentElement.outerHTML;
}

var lantern = function() {
    collectHeaders().then(function(messages) {
        for (var i = 0; i < messages.length; i++) {
            var tempMessage = createMessage(messages[i][0], messages[i][1]);
            injectIndicator(tempMessage);
        }
    });
};

/**
 * Entry point for SMTP-Lantern.
 */
var main = function() {
    document.addEventListener("click", lantern);
}

main();
