/*********************************************************************************** *
 * MIT License
 *
 * Copyright (c) 2017 Raphael "rGunti" Guntersweiler
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ********************************************************************************* */

function pad(num) {
    return ("0"+num).slice(-2);
}

function formatTimeWithMinutes(secs) {
    var minutes = Math.floor(secs / 60);
    secs = secs % 60;
    return minutes + ":" + pad(secs);
}

function formatTimeWithHours(secs) {
    var minutes = Math.floor(secs / 60);
    secs = secs % 60;
    var hours = Math.floor(minutes/60);
    minutes = minutes % 60;
    return hours + ":" + pad(minutes) + ":" + pad(secs);
}

function autoFormatTime(secs) {
    if (secs >= 3600) { // >= 1h / 60min
        return formatTimeWithHours(secs);
    } else { // < 1h / 60min
        return formatTimeWithMinutes(secs);
    }
}

function generateFunctionColumnOutput(items) {
    if (!items) return '-';
    //var returnVal = '<div class="row">';
    for (var i = 0; i < items.length; i++) {
        //returnVal += '<div class="col-xs-6">';
        returnVal += items[i];
        //returnVal += '</div>';
    }
    //returnVal += '</div>';
    return returnVal;
}

function sendSimpleAjaxRequest(url, method, data, callback, errorCallback) {
    $.ajax({ method: method, url: url, data: data }).done(function(res) {
        if (!res.ok) {
            console.error(res, url, method);
            if (errorCallback) errorCallback({
                url: url,
                method: method,
                data: data,
                response: res
            });
            else $.toaster({
                title: 'Error in AJAX Request',
                message: 'An error occurred while sending the following AJAX request:<br>' +
                    '<pre>' + method + ' ' + url + '</pre>',
                priority: 'danger'
            });
        } else if (callback) {
            callback(res);
        }
    });
}

function iOSLinkFixer() {
    $('a[target!=_blank]').each(function() {
        var href = $(this).attr('href');
        $(this).attr('onclick', "window.location='" + href + "'")
            .removeAttr('href');
    });
}

var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
}

// Datatables Plugin: page.jumpToData()
// Source: https://datatables.net/plug-ins/api/page.jumpToData()
jQuery.fn.dataTable.Api.register( 'page.jumpToData()', function ( data, column ) {
    var pos = this.column(column, {order:'current'}).data().indexOf( data );

    if ( pos >= 0 ) {
        var page = Math.floor( pos / this.page.info().length );
        this.page( page ).draw( false );
    }

    return this;
});

// -
function closeToast(e) {
    console.log(e);
}

$(document).ready(function() {
    // Hide when a Nav item has been clicked
    $('nav .nav a').on('click', function(e) { if (!$(e.currentTarget).hasClass('dropdown-toggle')) $('.navbar-toggle').click(); });

    // Pre-Set Toaster Settings
    $.toaster({
        settings: {
            timeout: 5000,
            toast: {
                template:
                '<div class="alert alert-%priority% alert-dismissible" role="alert">' +
                    '<button type="button" class="close" data-dismiss="alert" onclick="closeToast">' +
                        '<span aria-hidden="true">&times;</span>' +
                        '<span class="sr-only">Close</span>' +
                    '</button>' +
                    '<span class="title"></span>: <span class="message"></span>' +
                '</div>'
            }
        }
    });

    // Hide when clicked outside of the nav menu
    $(document).click(function (event) {
        var clickover = $(event.target);
        var _opened = $(".navbar-collapse").hasClass("navbar-collapse in");
        if (_opened === true && !clickover.hasClass("navbar-toggle")) {
            $("button.navbar-toggle").click();
        }
    });

    // Full Screen Apps throw you out into Safari on iOS if you click a regular <a> link
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (iOS) iOSLinkFixer();
});
