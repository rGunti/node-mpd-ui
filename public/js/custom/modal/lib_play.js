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
    $('#songActionAddToQueueButton').click(function(e) {
        var modal = $('#selectActionModal');
        var song = modal.data('song');
        modal.modal('hide');
        $.ajax({
            url: '/mpd/queue/add',
            method: 'post',
            data: {
                uri: song.file
            }
        }).done(function(data, textStatus, jqXHR) {
            if (data.ok) {
                $.toaster({
                    title: 'Added to Queue',
                    message: song.Title || song.file
                });
            } else {
                $.toaster({
                    title: 'Error',
                    message: data.message,
                    priority: 'danger'
                });
            }
        });
    });

    $('#songActionAddToPlaylistButton').click(function(e) {
        var modal = $('#selectActionModal');
        var song = modal.data('song');

        $('#addToPlaylistModal').data('song', song).modal('show');

        modal.modal('hide');
    });
});
