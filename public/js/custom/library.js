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
    $('#queueLoading').hide();

    var ITEM_TEMPLATES = {
        artists: '#libraryBrowserArtistTemplate',
        albums: '#libraryBrowserAlbumTemplate',
        genres: '#libraryBrowserGenreTemplate',
        songs: '#libraryBrowserSongsTemplate'
    };
    var RENDER_TARGETS = {
        artists: '#libraryBrowserArtistRenderTarget',
        albums: '#libraryBrowserAlbumRenderTarget',
        genres: '#libraryBrowserGenreRenderTarget',
        songs: '#libraryBrowserSongsRenderTarget'
    };

    var PAGE_SIZE = 10;

    var prefilteredItems = [];
    var renderedPrefilteredItems = 0;

    var songRestrictions = {};
    var songItems = [];
    var renderedSongItems = 0;

    function renderPrefilterItems(type, startIndex) {
        renderedPrefilteredItems = startIndex;
        for (var i = startIndex; i < startIndex + PAGE_SIZE && i < prefilteredItems.length; i++) {
            var itemObject = prefilteredItems[i];

            var item = $(ITEM_TEMPLATES[type]).clone();
            item.removeAttr('id');
            switch (type) {
                case 'artists':
                    $('.result-artist', item).text(itemObject || '<none>');
                    item.data('artist', itemObject);
                    item.click(onArtistClick);
                    break;
                case 'albums':
                    $('.result-album', item).text(itemObject || '<none>');
                    item.data('album', itemObject);
                    item.click(onAlbumClick);
                    break;
                case 'genres':
                    $('.result-genre', item).text(itemObject || '<none>');
                    item.data('genre', itemObject);
                    item.click(onGenreClick);
                    break;
            }

            item.appendTo(RENDER_TARGETS[type]).hide();
            renderedPrefilteredItems++;
        }
        fadeInHiddenElement(RENDER_TARGETS[type]);
        $(RENDER_TARGETS[type])
            .parent()
            .find('.libraryBrowserPositionIndicator')
            .text((startIndex + 1) + '-' + renderedPrefilteredItems + '/' + prefilteredItems.length);
    }

    function renderSongItems(startIndex) {
        renderedSongItems = startIndex;
        for (var i = startIndex; i < startIndex + PAGE_SIZE && i < songItems.length; i++) {
            var song = songItems[i];
            var item = $('#libraryBrowserSongsTemplate').clone();
            item.removeAttr('id');
            $('.result-title', item).text(song.Title || song.file);
            if (song.Artist) {
                $('.result-artist', item).text(song.Artist);
            } else {
                $('.result-artist', item).hide();
            }
            $('.result-length', item).text(formatTimeWithMinutes(song.Time));

            item.data('song', song);
            item.click(onSongClick);
            item.appendTo('#libraryBrowserSongsRenderTarget').hide();
            renderedSongItems++;
        }

        fadeInHiddenElement('#libraryBrowserSongsRenderTarget');
        $('#collapseLibraryBrowserSongs .libraryBrowserPositionIndicator')
            .text((startIndex + 1) + '-' + renderedSongItems + '/' + songItems.length);
    }

    function fadeInHiddenElement(target) {
        //console.log('Fade In');
        var item = $(target + ' .list-group-item:hidden:first');
        if (item.length > 0) {
            item.fadeIn(100, function() { fadeInHiddenElement(target) });
        }
    }

    function fadeOutVisibleElements(target, callback) {
        //console.log('Fade Out');
        var item = $(target + ' .list-group-item:visible:last');
        if (item.length > 0) {
            item.fadeOut(50, function() {
                item.remove();
                fadeOutVisibleElements(target, callback);
            });
        } else {
            if (callback) callback();
        }
    }

    function loadPrefilterItems(type, renderCallback) {
        $.ajax({
            url: '/mpd/library/' + type,
            method: 'get',
            beforeSend: function() {
                $('#queueLoading').fadeIn();
                $('.libraryBrowserNavigationButtons').attr('disabled', true);
            }
        }).done(function(data, textStatus, jqXHR) {
            if (data.ok) {
                if (data.data && data.data.length >= 1) {
                    data.data.splice(0, 0, '');
                    var oldList = prefilteredItems;
                    prefilteredItems = data.data;
                    renderCallback(type, prefilteredItems, oldList);
                } else {
                    $.toaster({
                        title: 'No Items found',
                        message: 'Maybe try something else.',
                        priority: 'info'
                    });
                }
            } else {
                $.toaster({
                    title: 'Error',
                    message: data.message,
                    priority: 'danger'
                });
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.toaster({
                title: 'Error',
                message: 'Something went horribly wrong while getting that list!',
                priority: 'danger'
            });
        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
            $('#queueLoading').fadeOut();
            $('.libraryBrowserNavigationButtons').attr('disabled', false);
        });
    }

    function loadSongItems(data, renderCallback) {
        $.ajax({
            url: '/mpd/library/find',
            method: 'post',
            data: data,
            beforeSend: function() {
                $('#queueLoading').fadeIn();
                $('.librarySongBrowserNavigationButtons').attr('disabled', true);
            }
        }).done(function(data, textStatus, jqXHR) {
            if (data.ok) {
                if (data.data && data.data.length >= 1) {
                    var oldList = songItems;
                    songItems = data.data;
                    renderCallback(songItems, oldList);
                } else {
                    $.toaster({
                        title: 'No Items found',
                        message: 'Maybe try something else.',
                        priority: 'info'
                    });
                }
            } else {
                $.toaster({
                    title: 'Error',
                    message: data.message,
                    priority: 'danger'
                });
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.toaster({
                title: 'Error',
                message: 'Something went horribly wrong while getting that list!',
                priority: 'danger'
            });
        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
            $('#queueLoading').fadeOut();
            $('.librarySongBrowserNavigationButtons').attr('disabled', false);
        });
    }

    $('#collapseLibrarySection button').click(function(e) {
        var filter = $(e.currentTarget).data('library-filter');
        var goToBrowser = null;
        switch (filter) {
            case 'artists':
                goToBrowser = 'collapseLibraryBrowserArtist';
                break;
            case 'albums':
                goToBrowser = 'collapseLibraryBrowserAlbum';
                break;
            case 'genres':
                goToBrowser = 'collapseLibraryBrowserGenre';
                break;
            default:
                $.toaster({
                    title: 'Unknown Filter',
                    message: filter,
                    priority: 'danger'
                });
                return;
        }

        $('#collapseLibrarySection').collapse('hide');
        $('#' + goToBrowser).collapse('show');

        loadPrefilterItems(filter, function(type, items) {
            renderPrefilterItems(type, 0)
        });
    });

    $('.selectLibraryFilterButton').click(function(e) {
        var source = $(e.currentTarget).data('source');
        var dataType = $(e.currentTarget).data('type');

        if (dataType === 'songs') {
            var fromSource = $(e.currentTarget).data('from-source');

            songItems = [];
            renderedSongItems = 0;

            $('#libraryBrowserSongsRenderTarget').empty();
            $('#collapseLibraryBrowserSongs .libraryBrowserPositionIndicator').text('...');
            $(fromSource).collapse('show');
            $('#collapseLibraryBrowserSongs').collapse('hide');
        } else {
            prefilteredItems = [];
            renderedPrefilteredItems = 0;

            $(RENDER_TARGETS[dataType]).empty();
            $(source).collapse('hide');
            $('#collapseLibrarySection').collapse('show');
        }
    });

    $('.libraryBrowserLoadLessButton').click(function(e) {
        var dataType = $(e.currentTarget).data('type');

        var baseNumber = (dataType === 'songs' ? renderedSongItems : renderedPrefilteredItems);

        var target = baseNumber - PAGE_SIZE;
        var mod = target % PAGE_SIZE;
        if (mod > 0) {
            target -= mod;
        } else {
            target -= PAGE_SIZE;
        }

        if (dataType === 'songs') {
            loadSongItems(songRestrictions, function(d, o) {
                if (d.length < target) {
                    target = d.length - 1;
                    mod = target % PAGE_SIZE;
                    if (mod > 0) {
                        target -= mod;
                    } else {
                        target -= PAGE_SIZE;
                    }
                }

                fadeOutVisibleElements(RENDER_TARGETS.songs, function() {
                    renderSongItems(Math.max(0, target));
                });
            });
        } else {
            loadPrefilterItems(dataType, function(type, d) {
                if (d.length < target) {
                    target = d.length - 1;
                    mod = target % PAGE_SIZE;
                    if (mod > 0) {
                        target -= mod;
                    } else {
                        target -= PAGE_SIZE;
                    }
                }

                fadeOutVisibleElements(RENDER_TARGETS[type], function() {
                    renderPrefilterItems(type, Math.max(0, target));
                });
            });
        }
    });

    $('.libraryBrowserReloadButton').click(function(e) {
        var dataType = $(e.currentTarget).data('type');

        var baseNumber = (dataType === 'songs' ? renderedSongItems : renderedPrefilteredItems);

        var target = baseNumber - (baseNumber % PAGE_SIZE);
        if (target === baseNumber) target -= PAGE_SIZE;

        if (dataType === 'songs') {
            loadSongItems(songRestrictions, function(d, o) {
                if (d.length < target) {
                    target = d.length - 1;
                    var mod = target % PAGE_SIZE;
                    if (mod > 0) {
                        target -= mod;
                    } else {
                        target -= PAGE_SIZE;
                    }
                }

                fadeOutVisibleElements(RENDER_TARGETS.songs, function() {
                    renderSongItems(Math.max(0, target));
                });
            });
        } else {
            loadPrefilterItems(dataType, function(type, d) {
                if (d.length < target) {
                    target = d.length - 1;
                    var mod = target % PAGE_SIZE;
                    if (mod > 0) {
                        target -= mod;
                    } else {
                        target -= PAGE_SIZE;
                    }
                }

                fadeOutVisibleElements(RENDER_TARGETS[type], function() {
                    renderPrefilterItems(type, Math.max(0, target));
                });
            });
        }
    });

    $('.libraryBrowserLoadMoreButton').click(function(e) {
        var dataType = $(e.currentTarget).data('type');
        var target = (dataType === 'songs' ? renderedSongItems : renderedPrefilteredItems);

        if (dataType === 'songs') {
            loadSongItems(songRestrictions, function(d, o) {
                if (d.length === o.length && target === o.length) {
                    $.toaster({
                        title: 'Info',
                        message: 'You\'ve reached the end of the list.',
                        priority: 'info'
                    });
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
                fadeOutVisibleElements(RENDER_TARGETS.songs, function() {
                    renderSongItems(target);
                });
            });
        } else {
            loadPrefilterItems(dataType, function(type, d, o) {
                if (d.length === o.length && target === o.length) {
                    $.toaster({
                        title: 'Info',
                        message: 'You\'ve reached the end of the list.',
                        priority: 'info'
                    });
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
                fadeOutVisibleElements(RENDER_TARGETS[type], function() {
                    renderPrefilterItems(type, target);
                });
            });
        }
    });

    $('#addSearchResultToQueue').click(function() {
        if (confirm('Would you like to add ' + songItems.length + ' song(s) to the queue?')) {
            $('#queueLoading').fadeIn();
            sendSimpleAjaxRequest('/mpd/queue/addsearch', 'post', songRestrictions, function() {
                $('#queueLoading').fadeOut();
                $.toaster({
                    title: 'Added to queue',
                    message: songItems.length + ' song(s) added to queue.'
                });
            });
        }
    });

    function onArtistClick(e) {
        var artist = $(e.currentTarget).data('artist');
        console.log('Artist: ', artist);

        $('#collapseLibraryBrowserSongs .selectLibraryFilterButton').data('from-source', '#collapseLibraryBrowserArtist');
        $('#collapseLibraryBrowserArtist').collapse('hide');
        $('#collapseLibraryBrowserSongs').collapse('show');

        songRestrictions = { artist: artist, emptySearch: 'artist' };
        loadSongItems(songRestrictions, function(songs, oldSongs) {
            renderSongItems(0);
        });
    }

    function onAlbumClick(e) {
        var album = $(e.currentTarget).data('album');
        console.log('Album: ', album);

        $('#collapseLibraryBrowserSongs .selectLibraryFilterButton').data('from-source', '#collapseLibraryBrowserAlbum');
        $('#collapseLibraryBrowserAlbum').collapse('hide');
        $('#collapseLibraryBrowserSongs').collapse('show');

        songRestrictions = { album: album, emptySearch: 'album' };
        loadSongItems(songRestrictions, function(songs, oldSongs) {
            renderSongItems(0);
        });
    }

    function onGenreClick(e) {
        var genre = $(e.currentTarget).data('genre');
        console.log('Genre: ', genre);

        $('#collapseLibraryBrowserSongs .selectLibraryFilterButton').data('from-source', '#collapseLibraryBrowserGenre');
        $('#collapseLibraryBrowserGenre').collapse('hide');
        $('#collapseLibraryBrowserSongs').collapse('show');

        songRestrictions = { genre: genre, emptySearch: 'genre' };
        loadSongItems(songRestrictions, function(songs, oldSongs) {
            renderSongItems(0);
        });
    }

    function onSongClick(e) {
        var song = $(e.currentTarget).data('song');

        $('#selectActionModal .result-title').text(song.Title || song.file);
        $('#selectActionModal .result-artist').text(song.Artist || '');
        $('#selectActionModal').data('song', song);
        $('#selectActionModal').modal('show');
    }
});
