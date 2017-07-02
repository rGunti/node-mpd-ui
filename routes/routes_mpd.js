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

const debug = require('debug')('node-mpd-ui:Routes/MPD');
const config = require('../base/config');

var express = require('express');
var router = express.Router();

const ResponseUtil = require('../base/response_utils');
const mpd = require('../base/mpd_utils');

// GET Connected Status
router.get('/', function(req, res, next) {
    ResponseUtil.sendData(res, {
        connected: mpd.isConnected()
    });
});

// GET Current Song
router.get('/status', function(req, res, next) {
    ResponseUtil.sendData(res, mpd.getCachedStatus());

    // Code disabled to reduce strain
    //mpd.getCurrentStatus(function(err, resp, msg) {
    //    if (err) {
    //        ResponseUtil.sendError(
    //            res,
    //            'Error while trying to receive current status.',
    //            { mpdError: err, message: msg }
    //        );
    //    } else {
    //        ResponseUtil.sendData(res, resp);
    //    }
    //});
});

// POST Control Basic Playback
router.post('/control/:action', function(req, res, next) {
    switch (req.params.action) {
        case 'playPause':
        case 'skip':
        case 'prev':
            mpd.controlPlayback(req.params.action, function(err, msg) {
                if (err) {
                    debug('ERROR while trying to control playback using %s', req.params.action);
                    ResponseUtil.sendError(res, 'FAILED to control playback', err);
                } else {
                    ResponseUtil.sendEmptyResponse(res);
                }
            });
            break;
        case 'repeat':
            mpd.setRepeat(req.body.newState);
            res.json({ ok: true });
            break;
        case 'random':
            mpd.setRandom(req.body.newState);
            res.json({ ok: true });
            break;
        default:
            ResponseUtil.sendError(res, 'Unknown Action', req.params.action);
            break;
    }
});

// POST
router.post('/repeat', function(req, res, next) {
    mpd.setRepeat(req.body.repeat, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to set Repeat', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// POST
router.post('/random', function(req, res, next) {
    mpd.setRandom(req.body.random, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to set Random', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// GET Queue
router.get('/queue', function(req, res, next) {
    mpd.getQueue(function(err, queue, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to get Queue', err);
        } else {
            ResponseUtil.sendData(res, queue);
        }
    });
});

// POST Add Song to Queue
router.post('/queue/add', function(req, res, next) {
    var songUri = req.body.uri;
    mpd.addToQueue(songUri, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to add song to queue', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// POST Add Songs from Search
router.post('/queue/addsearch', function(req, res, next) {
    mpd.addSearchToQueue(req.body, function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to search-add songs', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// POST Play in Queue at Position
router.post('/queue/:queuePos/play', function(req, res, next) {
    var songPos = req.params.queuePos;
    mpd.playAtPosInQueue(songPos, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to play Song at Pos ' + songPos, err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// POST Remove item from Queue
router.post('/queue/:queuePos/remove', function(req, res, next) {
    var songPos = req.params.queuePos;
    mpd.removeItemFromQueue(songPos, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to remove Song from queue at Pos ' + songPos, err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// POST Move item in Queue
router.post('/queue/:queuePos/move/:targetPos', function(req, res, next) {
    var songPos = req.params.queuePos;
    var targetPos = req.params.targetPos;

    if (isNaN(Number(targetPos))) {
        if (targetPos.startsWith('NOW_PLAYING')) {
            var currentStatus = mpd.getCachedStatus();
            if (currentStatus.state !== 'play' && currentStatus.state !== 'pause') {
                targetPos = 0;
            } else {
                var currentPos = Number(currentStatus.mpdObject.song);
                if (targetPos === 'NOW_PLAYING') {
                    targetPos = currentPos;
                } else if (targetPos.startsWith('NOW_PLAYING+')) {
                    var add = targetPos.split('+');
                    var offset = Number(add[1]);
                    if (!isNaN(offset)) {
                        targetPos = currentPos + offset;
                    } else {
                        ResponseUtil.sendError(res, 'Unknown Target Offset for ' + targetPos + ', is NaN or invalid keyword?');
                        return;
                    }
                } else if (targetPos.startsWith('NOW_PLAYING-')) {
                    var sub = targetPos.split('-');
                    var offset = Number(sub[1]);
                    if (!isNaN(offset)) {
                        targetPos = currentPos + offset;
                    } else {
                        ResponseUtil.sendError(res, 'Unknown Target Offset for ' + targetPos + ', is NaN or invalid keyword?');
                        return;
                    }
                } else {
                    ResponseUtil.sendError(res, 'Unknown Target ' + targetPos + ', is NaN or invalid keyword?');
                    return;
                }
            }
        } else {
            ResponseUtil.sendError(res, 'Unknown Target ' + targetPos + ', is NaN or invalid keyword?');
            return;
        }
    }

    if (songPos === targetPos) {
        ResponseUtil.sendData(res, {
            ignored: 'SONG_EQ_TARGET',
            source: songPos,
            target: targetPos
        });
        return;
    }

    mpd.moveItemInQueue(songPos, targetPos, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to move Song at Pos ' + songPos + ' to Pos ' + targetPos, err);
        } else {
            mpd.setPrio(targetPos, 5);
            ResponseUtil.sendData(res, {
                source: songPos,
                target: targetPos
            });
        }
    });
});

// POST Queue to playlist
router.post('/queue/toPlaylist', function(req, res, next) {
    var playlistName = req.body.name;
    mpd.createPlaylistFromQueue(playlistName, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to store queue as playlist', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// POST Load Playlist into Queue
router.post('/queue/fromPlaylist', function(req, res, next) {
    var playlistName = req.body.name;
    var keepQueue = req.body.keepQueue;

    if (!keepQueue) {
        mpd.clearQueue(function(err, msg) {
            if (err) {
                ResponseUtil.sendError(res, 'FAILED to clear the queue before loading the playlist', err);
            } else {
                queue_fromPlaylist_LoadPlaylist(res, playlistName);
            }
        });
    } else {
        queue_fromPlaylist_LoadPlaylist(res, playlistName);
    }
});

function queue_fromPlaylist_LoadPlaylist(res, playlistName) {
    mpd.loadPlaylist(playlistName, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to load playlist', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
}

// POST Clear Queue
router.post('/queue/clear', function(req, res, next) {
    mpd.clearQueue(function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to clear the queue', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// POST Search in Library
router.post('/library/search', function(req, res, next) {
    mpd.search(req.body, function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to search for songs', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// POST Find in Library
router.post('/library/find', function(req, res, next) {
    mpd.find(req.body, function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to find songs', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// GET List of Genres
router.get('/library/genres', function(req, res, next) {
    mpd.getGenreList(function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to get genre list', err);
        } else {
            if (req.query.query) {
                var query = req.query.query.toLowerCase();
                var filtered = [];
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    if (item && item.toLowerCase().match(query)) {
                        filtered.push(item);
                    }
                }
                res.json(filtered);
            } else {
                ResponseUtil.sendData(res, list);
            }
        }
    });
});

// GET List of Artists
router.get('/library/artists', function(req, res, next) {
    mpd.getArtistList(function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to get artist list', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// GET List of Albums
router.get('/library/albums', function(req, res, next) {
    mpd.getAlbumList(function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to get albums list', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// POST Rescan Library
router.post('/rescan', function(req, res, next) {
    mpd.updateLibrary(req.body.rescan || false, function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to update library', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// GET Outputs
router.get('/outputs', function(req, res, next) {
    mpd.getOutputs(function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to get outputs', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// POST Set Output
router.post('/output/:id', function(req, res, next) {
    mpd.setOutput(req.params.id, req.body.state == 'true', function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to set output', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

// GET Playlists
router.get('/playlists', function(req, res, next) {
    mpd.getPlaylists(function(err, list, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to get playlists', err);
        } else {
            ResponseUtil.sendData(res, list);
        }
    });
});

// DELETE Playlist
router.delete('/playlists', function(req, res, next) {
    mpd.deletePlaylists(req.body.name, function(err, msg) {
        if (err) {
            ResponseUtil.sendError(res, 'FAILED to delete playlist', err);
        } else {
            ResponseUtil.sendEmptyResponse(res);
        }
    });
});

module.exports = router;
