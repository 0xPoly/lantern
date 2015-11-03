/**
 * `mail` is a class that represents a single SMTP message.
 */
function message() {
    // DOM element to inject visual indicator into
    this.injectionPoint;

    // Initialize raw message headers
    this.headers = "";

    // Initialize security properties
    this.DKIM = false;
    this.SPF = false;
    this.DMARC = false;
    this.encrypt = false;
    this.strongEncrypt = false;
}

var createMessages = function() {
}

var injectIndicator = function(message) {
}

var processHeaders = function(message) {
}

var collectHeaders = function() {
    var unProcessedMessages = new Array();
    var mailHost = getMailHost();
    switch (mailHost) {
        case "gmail":
            unProcessedMessages = gmail.findMessages();
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
    var messages = collectHeaders();
    for (var i = 0; i < messages.length; i++) {
        processHeaders(messages[i]);
        injectIndicator(messages[i]);
    }
};

/**
 * Entry point for SMTP-Lantern.
 */
var main = function() {
    addEventListener("click", lantern());
}

main();
