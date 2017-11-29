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
    var playlists = [];
    var renderedItems = 0;
    var PAGE_SIZE = 10;

    function sortPlaylists(a, b){
        if (a.playlist < b.playlist) return -1;
        else if(a.playlist > b.playlist) return 1;
        else return 0;
    }

    function renderPlaylists(startIndex) {
        playlists.sort(sortPlaylists);

        renderedItems = startIndex;
        for (var i = startIndex; i < startIndex + PAGE_SIZE && i < playlists.length; i++) {
            var playlist = playlists[i];

            // Song can be null (for some reason)
            if (!playlist) {
                playlists.splice(i, 1);
                continue;
            }

            var item = $('#playlistItemTemplate').clone();
            item.attr('id', '');

            $('.result-name', item).text(playlist.playlist);

            var button = $('.result-actions', item);
            button.click(onPlaylistClick);
            button.data('playlist', playlist);

            item.appendTo('#playlistRenderTarget').hide();
            renderedItems++;
        }
        fadeInHiddenElement();
        $('.playlistPositionIndicator').text((startIndex + 1) + '-' + renderedItems + '/' + playlists.length);
    }

    function fadeInHiddenElement() {
        //console.log('Fade In');
        var item = $('#playlistRenderTarget .collection-item:hidden:first');
        if (item.length > 0) {
            item.fadeIn(100, fadeInHiddenElement);
        }
    }

    function fadeOutVisibleElements(callback) {
        //console.log('Fade Out');
        var item = $('#playlistRenderTarget .collection-item:visible:last');
        if (item.length > 0) {
            item.fadeOut(50, function() {
                item.remove();
                fadeOutVisibleElements(callback);
            });
        } else {
            if (callback) callback();
        }
    }

    function onPlaylistClick(e) {
        var target = $(e.currentTarget);
        var playlist = target.data('playlist');

        $('#selectActionModal .result-name').text(playlist.playlist);
        $('#selectActionModal input.result-name').val(playlist.playlist);
        $('#selectActionModal').data('playlist', playlist).modal('open');
    }

    $('.playlistLoadMoreButton').click(function(e) {
        var target = renderedItems;
        reloadPlaylistData(function(d,o) {
            //console.log(d.length, o.length, renderedItems);
            if (d.length === o.length && target === o.length) {
                Materialize.toast("You've reached the end of your playlists.", 2500);
                return;
            }
            if (d.length <= target) {
                target = d.length - 1;
                var mod = target % PAGE_SIZE;
                if (mod > 0) {
                    target -= mod;
                } else {
                    target -= PAGE_SIZE;
                }
            }
            fadeOutVisibleElements(function() {
                renderPlaylists(target);
            });
        });
    });

    $('.playlistReloadButton').click(function(e) {
        var target = renderedItems - (renderedItems % PAGE_SIZE);
        if (target === renderedItems) target -= PAGE_SIZE;
        reloadPlaylistData(function(d) {
            //console.log(renderedItems, target, d.length);

            if (d.length < target) {
                target = d.length - 1;
                var mod = target % PAGE_SIZE;
                if (mod > 0) {
                    target -= mod;
                } else {
                    target -= PAGE_SIZE;
                }
            }

            fadeOutVisibleElements(function() {
                renderPlaylists(Math.max(0, target));
            });
        });
    });

    $('.playlistLoadLessButton').click(function(e) {
        var target = renderedItems - PAGE_SIZE;
        var mod = target % PAGE_SIZE;
        if (mod > 0) {
            target -= mod;
        } else {
            target -= PAGE_SIZE;
        }
        //console.log(renderedItems, mod, target);

        reloadPlaylistData(function(d, o) {
            //console.log(d.length);

            if (d.length < target) {
                target = d.length - 1;
                mod = target % PAGE_SIZE;
                if (mod > 0) {
                    target -= mod;
                } else {
                    target -= PAGE_SIZE;
                }
            }

            fadeOutVisibleElements(function() {
                renderPlaylists(Math.max(0, target));
            });
        });
    });

    $('#selectActionModal .result-actions').click(function(e) {
        var playlist = $('#selectActionModal').data('playlist');
        var action = $(e.currentTarget).data('action');
        //console.log(song, action);

        if (!action) { return; }

        switch (action) {
            case "load-playlist":
                LoadingIndicator.show();
                sendSimpleAjaxRequest(
                    '/mpd/queue/fromPlaylist',
                    'post',
                    { name: playlist.playlist },
                    function (d) {
                        LoadingIndicator.hide();
                        $('.playlistReloadButton:first').click();

                        Materialize.toast('Playlist "' + playlist.playlist + '" loaded', 2500)
                    },
                    function() {
                        LoadingIndicator.hide();
                    }
                );
                break;
            case "delete-playlist":
                LoadingIndicator.show();
                sendSimpleAjaxRequest(
                    '/mpd/playlists',
                    'delete',
                    { name: playlist.playlist },
                    function (d) {
                        LoadingIndicator.hide();
                        $('.playlistReloadButton:first').click();

                        Materialize.toast('Playlist "' + playlist.playlist + '" deleted', 2500);
                    },
                    function() {
                        LoadingIndicator.hide();
                    }
                );
                break;
            default:
                break;
        }
        $('#selectActionModal').modal('close');
    });

    function reloadPlaylistData(renderCallback) {
        $.ajax({
            url: '/mpd/playlists',
            method: 'get',
            beforeSend: function() {
                LoadingIndicator.show();
                $('.playlistNavigationButtons').attr('disabled', true);
            }
        }).done(function(data, textStatus, jqXHR) {
            if (data.ok) {
                var oldPlaylists = playlists;
                if (data.data && data.data.length >= 1) {
                    playlists = data.data;
                    renderCallback(playlists, oldPlaylists);
                } else {
                    Materialize.toast('No playlists found', 2500);
                    playlists = [];
                    renderCallback([], oldPlaylists);
                }
            } else {
                Materialize.toast('Error! ' + data.message);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            Materialize.toast('Error! Something went horribly wrong here D:<br>Some more detail for you:<br>' + textStatus);
        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
            LoadingIndicator.hide();
            $('.playlistNavigationButtons').attr('disabled', false);
        });
    }

    reloadPlaylistData(function(data) {
        renderPlaylists(0);
    });
});
