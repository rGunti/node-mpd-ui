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
    var lastSearch = {};
    var songs = [];
    var renderedItems = 0;

    function renderSongs(startIndex) {
        var header = $('#searchHeaderTemplate').clone();
        $('.result-count', header).text(songs.length);
        header.appendTo('#searchResultRenderTarget').hide().fadeIn(100);

        for (var i = startIndex; i < songs.length; i++) {
            var song = songs[i];
            var item = $('#searchResultItemTemplate').clone();

            $('.result-title', item).text(song.Title || song.file);
            if (song.Artist) {
                $('.result-artist', item).text(song.Artist);
            } else {
                $('.result-artist', item).hide();
            }
            $('.result-length', item).text(formatTimeWithMinutes(song.Time));

            var button = $('.result-actions', item);
            button.data('song', song);
            button.click(onSongClick);
            item.appendTo('#searchResultRenderTarget').hide();

            renderedItems++;
        }
        fadeInHiddenElement();
    }

    function fadeInHiddenElement() {
        console.log('Fade In');
        var item = $('#searchResultRenderTarget .collection-item:hidden:first');
        if (item.length > 0) {
            item.fadeIn(100, fadeInHiddenElement);
        }
    }

    function onSongClick(e) {
        var target = $(e.currentTarget);
        var song = target.data('song');

        $('#selectActionModal .result-title').text(song.Title || song.file);
        $('#selectActionModal .result-artist').text(song.Artist || '');
        $('#selectActionModal').data('song', song);
        $('#selectActionModal').modal('show');
    }

    $('#searchForm').submit(function(e) {
        e.preventDefault();

        var data = {
            title: $('#searchTitle').val(),
            artist: $('#searchArtist').val(),
            album: $('#searchAlbum').val(),
            genre: $('#searchGenre').val()
        };
        lastSearch = data;

        if (!data.title && !data.artist && !data.album && !data.genre) {
            Materialize.toast('No search criteria entered', 2500);
            $('#librarySearchTitle').focus().select();
            return;
        }

        $.ajax({
            url: '/mpd/library/search',
            method: 'post',
            data: data,
            beforeSend: function() {
                LoadingIndicator.show();
                $('#collapseSearchForm button[type=submit]').attr('disabled', true);

                $('#searchResultRenderTarget').empty();
            }
        }).done(function(data, textStatus, jqXHR) {
            //console.log(data);
            if (data.ok) {
                if (data.data && data.data.length >= 1) {
                    songs = data.data;
                    $('.collapsible').collapsible('close', 0);
                    renderSongs(0);

                    //$('#collapseSearchForm').collapse('hide');
                    //$('#collapseSearchResult').collapse('show');
                } else {
                    Materialize.toast('Nothing found', 2500);
                }
            } else {
                Materialize.toast('Error! ' + data.message);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
            $('#collapseSearchForm button[type=submit]').attr('disabled', false);
            LoadingIndicator.hide();
        });
    });

    $('#addEverythingButton').click(function(e) {
        if (confirm('Would you like to add ' + songs.length + ' song(s) to the queue?')) {
            LoadingIndicator.show();
            sendSimpleAjaxRequest('/mpd/queue/addsearch', 'post', lastSearch, function() {
                LoadingIndicator.hide();
                Materialize.toast(songs.length + ' song(s) added to queue.', 2500)
            });
        }
    });

    $('#scrollToTop').click(function() {
        window.scroll({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    });

    //$.get('/mpd/library/genres', function(data) {
    //    $('#librarySearchGenre').typeahead({ source: data.data }, 'json');
    //});

    $('#searchTitle').focus().select();
});
