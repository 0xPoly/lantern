"use strict";

/* Constants
 */
var AUTH_HEADERS_REGEX = /(DKIM|SPF|DMARC)=([a-z]+)/i;
var DOMAIN_REGEX = /[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,14}? /i;
var FROM_REGEX = /(from)/i;
var TO_REGEX = /(to|by)/i;
var TLS_REGEX = /(TLS|SSL|Encrypt|cipher)/i;

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
 *
 */
function Message() {
    // DOM element to inject visual indicator into
    this.injectionPoint;

    // Initialize raw message headers
    this.headers = "";

    this.parsedHeaders = null;

    this.DKIM = 4;
    this.SPF = 4;
    this.DMARC = 4;
    this.encrypt = true;
}

Message.prototype._parseHeaders = function(rawHeaders) {
    self.headers = rawHeaders;

    // Only read headers, discard message body
    var bodyRegex = /^Content-Type: /im;
    var bodyPos = self.headers.indexOf(bodyRegex.exec(self.headers));
    var headerLines = self.headers.substring(0, bodyPos);

    // now determine the present headers and store them in an object
    var headers = new Object();
    headers["Received"] = new Array();
    var headerRegExp = /^(.+?): ((.|\r\n\s)+)\r\n/mg;
    var h;
    while (h = headerRegExp.exec(headerLines)) {
        if (h[1] == "Received") {
            headers[h[1]].push(h[2]);
        }
        else {
            headers[h[1]] = h[2];
        }
    }

    self.parsedHeaders = headers;
}

Message.prototype._decideEncryption = function() {
    var rHeaders = self.parsedHeaders["Received"];
    debugger;
    for(var i = 0; i < rHeaders.length; i++) {
        var fromDomain = undefined;
        var toDomain = undefined;
        var TLS = false;

        var lines = rHeaders[i].split('\n');

        for(var x = 0; x < lines.length; x++) {
            if (FROM_REGEX.test(lines[x]) == true) {
                if (DOMAIN_REGEX.exec(lines[x]) != null)
                    fromDomain = DOMAIN_REGEX.exec(lines[x])[0];
            }
            else if (TO_REGEX.test(lines[x]) == true) {
                if (DOMAIN_REGEX.exec(lines[x]) != null)
                    toDomain = DOMAIN_REGEX.exec(lines[x])[0];
            }
            else if (TLS == false) {
                TLS = TLS_REGEX.test(lines[x]);
            }
        }

        if (fromDomain != toDomain && !TLS && fromDomain != undefined &&
            toDomain != undefined) {
            this.encrypt = false;
            return;
        }
    }
    
    this.encrypt = true;
}

/**
 * '_decideSecurity()' accepts a message class with parsed
 * headers and decides which authentication indicators should be
 * displayed to the user.
 */
Message.prototype._decideAuthentication = function() {
    var authHeaders = self.parsedHeaders["Authentication-Results"];

    if (authHeaders == undefined) 
        throw "no authentication headers found";

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
    tempMessage._decideAuthentication();
    tempMessage._decideEncryption();

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
            // this should never fire -errors thrown earlier should halt
            // script before reaching here
            throw "Some bugs have names \n Others inscrutable numbers \n \
            Yours has not even that."
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

var clearOld = function() {
    var paras = document.getElementsByClassName('tooltip');

    while(paras[0]) {
            paras[0].parentNode.removeChild(paras[0]);
    }
}

var lantern = function() {
    collectHeaders().then(function(messages) {
        clearOld();
        for (var i = 0; i < messages.length; i++) {
            try {
                var tempMessage = createMessage(messages[i][0], messages[i][1]);
                injectIndicator(tempMessage);
            } catch (error) {
                // TODO message has no authentication headers?
            }
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
