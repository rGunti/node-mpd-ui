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

$(document).ready(function() {
    var DEFAULT_CALLBACK = function() {
        LOADING_INDICATOR.fadeOut();
    };

    var DEFAULT_ERROR_TOAST = function() {
        $.toaster({
            title: 'Error',
            message: 'Something went terribly wrong here D:',
            priority: 'danger'
        });
    };
    var DEFAULT_SERVER_ERROR_TOAST = function(d) {
        $.toaster({
            title: 'Error',
            message: d.message,
            priority: 'danger'
        });
    };

    var ACTIONS = {
        'mpd-rescan-library': function(callback) {
            sendSimpleAjaxRequest('/mpd/rescan', 'post', null, function(d) {
                $.toaster({
                    title: 'Update requested',
                    message: 'Server is updating the library...',
                    priority: 'info'
                });
                if (callback) callback();
            }, function() {
                DEFAULT_ERROR_TOAST();
                if (callback) callback();
            });
        }
    };
    var CONFIRMS = {
        'mpd-rescan-library': {
            title: 'Update Library',
            message: 'Would you like to start the update process? Depending on your library size ' +
                'this might take a while.'
        }
    };
    var CONFIRM_MODAL = $('#confirmActionModal');
    var LOADING_INDICATOR = $('#actionLoadingIndicator').hide();

    $('.settings-action').click(function(e) {
        var source = $(e.currentTarget);
        var action = source.data('action');
        var needConfirm = source.data('need-confirm');

        if (needConfirm) {
            var confirmData = CONFIRMS[action];
            CONFIRM_MODAL.data('action', action);
            $('.confirm-title', CONFIRM_MODAL).text(confirmData.title);
            $('.confirm-message', CONFIRM_MODAL).text(confirmData.message);
            CONFIRM_MODAL.modal('show');
        } else {
            LOADING_INDICATOR.fadeIn();
            ACTIONS[action](DEFAULT_CALLBACK);
        }
    });

    $('.confirm-yes', CONFIRM_MODAL).click(function(e) {
        var action = CONFIRM_MODAL.data('action');
        ACTIONS[action](DEFAULT_CALLBACK);
        CONFIRM_MODAL.modal('hide').data('action', '');
    });

    $('.confirm-no', CONFIRM_MODAL).click(function(e) {
        CONFIRM_MODAL.modal('hide').data('action', '');
    });
});
