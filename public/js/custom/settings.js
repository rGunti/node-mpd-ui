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
        Materialize.toast('Something went terribly wrong here D:', Infinity, 'red');
    };

    var ACTIONS = {
        'mpd-rescan-library': function(callback) {
            sendSimpleAjaxRequest('/mpd/rescan', 'post', null, function(d) {
                Materialize.toast('Rescan has been requested, this might take a minute.', 2500);
                if (callback) callback();
            }, function() {
                DEFAULT_ERROR_TOAST();
                if (callback) callback();
            });
        },
        'mpd-clear-queue': function(callback) {
            sendSimpleAjaxRequest('/mpd/queue/clear', 'post', null, function(d) {
                Materialize.toast('Queue cleared', 2500);
                if (callback) callback();
            }, function() {
                DEFAULT_ERROR_TOAST();
                if (callback) callback();
            });
        },
        'mpd-generate-full-playlist': function(callback) {
            $('#processingModal').modal({
                backdrop: 'static',
                keyboard: false
            });
            sendSimpleAjaxRequest('/mpd/playlists/create_full', 'post', {
                name: 'All Tracks'
            }, function(d) {
                Materialize.toast('Full Playlist created');
                $('#processingModal').modal('hide');
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
        },
        'mpd-clear-queue': {
            title: 'Clear Queue',
            message: 'Would you like to clear the queue?'
        },
        'mpd-generate-full-playlist': {
            title: 'Generate Full Playlist',
            message: 'Would you like to generate a playlist with all songs? This might take a few seconds.'
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
