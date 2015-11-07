"use strict";

/* Constants
 */
var HELP_PAGE_URL = "https://github.com/0xPoly/lantern/docs/explain.md";

var injectIndicator= function(tempMessage) {
    var indicatorHTML = " \
            <table style='text-align:left; table-layout: fixed; width: 100%; vertical-align: top;'> \
              <tr> \
                <th>Sender Identity (SPF)</th> \
                <td></td> \
              </tr> \
              <tr> \
                <td colspan='2'>" +
                 SPFStatustoIcon(tempMessage.SPF) + 
                "</td> \
              </tr> \
              <tr> \
                <th>Message Signature (DKIM)</th> \
                <td></td> \
              </tr> \
              <tr> \
                <td colspan='2'>" +
                DKIMCodetoIcon(tempMessage.DKIM) +
                "</td> \
              </tr> \
              <tr> \
                <th>Security Policy (DMARC)</th> \
                <td></td> \
              </tr> \
              <tr> \
                <td colspan='2'>" +
                DMARCCodetoIcon(tempMessage.DMARC) +
                "</td> \
              </tr> \
            </table> \
            <a href=\"" + HELP_PAGE_URL + "\"> What do these mean?</a>";

    var indicatorHoverover = "<span class='tooltip'><img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABPklEQVRIie3VvytFcRjH8ddNKT+i1B2UskhWgxJ2o1L+AIvYLGJTd1DKJJtB4j/wY2K4E4MMMsigTIqBusMlcg3fc1Onc+85172jTz116vs8n/f3fM95ni/pasMENnCDaxQwhlyG+kT1Yg77eEYFZZxGz9V4wi5m0JlmOoRlnOEjMnjGHmbRFeVVakQZJ1jEQNKOq4l32MSUcDxx1QLEIxFQSHvNZgFr/4B/QFbAR7yoDV/YahHgManwQejEVgCKSYXbKKGjBYCVpMLxaHGpScAnBmsVXwjn190E4KDe7qajpJ0/AsoYrgcgjOdvYcY3ClhPMydcHJd4w2gDgHO0ZwFAHvd4xWQGwJXQrA2pH7d4x3wdQBE9jZpX1Ydjv39HPmZ+KMNdnKYcVoX58hIZl7DQrHFcI8KHPFKnkeL6AcB+5jJF7xy1AAAAAElFTkSuQmCC'/><span>" +
                             indicatorHTML +
                             "</span></span>";
  
    tempMessage.injectionPoint.insertAdjacentHTML("beforebegin", indicatorHoverover);
}

var SPFStatustoIcon = function(statusCode) {
    switch(statusCode) {
        case 3: // pass
            return "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABuUlEQVRIibWUO0hcQRSG/wSDMWAwghDSWKQQSRViGcgWotydMzNnhFuIMVgEIeTRhmCzVhZpUkggEJIuxYJz5qqshYWFWNqJhZCAndU2ErBIsinihrB4H7nuHjjNPP5vzpmZH0gJFewyCbdy8qcW5jSNzFCJMQUALSX8rBQAAEh4t6eAyueF62pT3crKqBH1lwbodX1PeRdnZSR8t5R41Ij6Sfhrz1qkvXvV00s2ibmjgp3MhXg3VwrQDvLuILMC78YvBdDCsxmn95cS/1uF8AsSPu3ofWDhoa4AACCqxyMU7BMlvFhNzETXhNM+WK1Wu1r+tI3oJgW7SsLfUp5mQAtXAEAJf1TevY3r8UAh8QcfFq+R8H7GyzmersfDAEDePW+P62C3CgG08HyG+A/t3UMAMIm5T8Jn/85r7x7lAkj4XRpAe7d0Lj5IwkcXrHlTpIL3KYDt9sUq4S8Xrgl2pSzgpFqPbwOADvZpagtLAn5p4Sngj32T8PfuAs436Q19g4QPM42vBGCvslPpAwDy7lOus/4noFldmxkFACX8OFe8KEAF+5qEmxSsAwCTmLFOo0u1buGXnXq/AQIPQJxcSQF8AAAAAElFTkSuQmCC'/> The server that sent this message appears authorized to do so.";
            break;
        case 2: // neutral
        case 4: // unconfigured, fallthrough on purpose
            return "<img src=\"" + chrome.extension.getURL('img/neutral.png') + "\"> "+
                    "Sender identity verification is not enabled by the sending server.";
            break;
        case 1: // error
            return "<img src=\"" + chrome.extension.getURL('img/warn.png') + "\"> "+
                    "A technical error occured when trying to verify the sender's identity.";
            break;
        case 0: // fail
            return "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABjUlEQVRIibXUPShFYRgH8D+RjyKUki7u+7ynJJMYFYOUgRjOeV6fGaTkY5UsTHewGGSS0ai7GYwy2mRQlM1kkTLgb7g+8nHOPY5733qW8779f70f5wFCBlU2qcI89czAjoZlRA46MxIDIFUWEgE5RE6KC8ymKznRWh9ZQ15FcmDc66QaP7o8myx8yKugmquiHRGdXSnqJdO1NDOQgRjAZCLgA1I5jwbaOv4HBDIeGh7I4b/CP3dhlqhy/xUwWY6m6woCAAB9r5FqZ+jsPJ30FC447AfbQGny0EmvloHsUOX69/M3WQIlAECVPQZ2i36qKl74fHc5Vc4iXs4N/VQDANCZxc8LN0fxAGemI8Kf6Etvbp3XRZXHL/N+ui8/oLIdDph1AOBIew1VLn95tmtxgN0Q4Pj9YunkIGRNJilwSz/dlJs3cxFHmAh4oZpB4L19y0OhgQwAcLi5mmov8jS+PwOn7O8ve/u+H6Oz/gm444RpAwAGZipGeEzAySpV7ujsGADQN+0/G11Y2eXvea9TW3G9XTseHAAAAABJRU5ErkJggg=='/>The server that sent this message is NOT allowed to do so. <strong>This message may be FORGED.</strong>"
            break;
        default:
            return "not implemented";
            break;
    }
}

var DKIMCodetoIcon = function(statusCode) {
    switch(statusCode) {
        case 3: // pass
            return "<img src=\"" + chrome.extension.getURL('img/DKIM-pass.png') + "\"> "+
                    "This email has not been modified on " +
                    "its way from the sending server.";
            break;
        case 2: // neutral
        case 4: // unconfigured, fallthrough on purpose
            return "<img src=\"" + chrome.extension.getURL('img/neutral.png') + "\"> "+
                    "This email is not signed by the sending server.";
            break;
        case 1: // error
            return "<img src=\"" + chrome.extension.getURL('img/warn.png') + "\"> "+
                    "An error occured when trying to verify the signature.";
        case 0: // fail
            return "<img src=\"" + chrome.extension.getURL('img/DKIM-fail.png') + "\"> "+
                    "The email does NOT match the signature.<strong> This message may" + 
                    "have been FORGED or MODIFIED.</strong>";
            break;
        default:
            return "not implemented";
            break;
    }
}

var DMARCCodetoIcon = function(statusCode) {
    switch(statusCode) {
        case 3: // pass
            return "<img src=\"" + chrome.extension.getURL('img/DMARC-pass.png') + "\"> "+
                    "This email has passed security checks specified by the sender";
            break;
        case 2: // neutral
        case 4: // unconfigured, fallthrough on purpose
            return "<img src=\"" + chrome.extension.getURL('img/neutral.png') + "\"> "+
                    "No security policy was found from the sending server.";
            break;
        case 1: // error
            return "<img src=\"" + chrome.extension.getURL('img/warn.png') + "\"> "+
                    "An error occured when retreiving or processing the security" +
                    "policy.";
        case 0: // fail
            return "<img src=\"" + chrome.extension.getURL('img/DMARC-fail.png') + "\"> "+
                    "The email does NOT sender's security policy. <strong>This email may" +
                    "have been strong FORGED or MODIFIED.</strong>";
            break;
        default:
            return "not implemented";
            break;
    }
}
