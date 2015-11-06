"use strict";

var injectIndicator= function(tempMessage) {
    var indicatorHTML = "DKIM: " + tempMessage.DKIM + "\n" +
                        "SPF: " + tempMessage.SPF + "\n" +
                        "DMARC: " + tempMessage.DMARC + "\n";
 
    var indicatorHoverover = "<span class='tooltip'>X<span>" +
                             indicatorHTML +
                             "</span></span>";
  
    tempMessage.injectionPoint.insertAdjacentHTML("beforebegin", indicatorHoverover);
}
