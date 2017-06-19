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

const debug = require('debug')('mpd-ui:MPDUtils');
const config = require('./config');
const mpd = require('mpd');
const cmd = mpd.cmd;

const mpdConfig = {
    host: config.getValue(config.KEYS.MPD_HOST),
    port: config.getValue(config.KEYS.MPD_PORT)
};

debug('Connecting to MPD host %s:%s ...', mpdConfig.host, mpdConfig.port);
var client = mpd.connect(mpdConfig);

var MpdUtils = {
    MpdClient: client,
    KeepAlive: null,
    Commands: {
        PING: "ping",
        STATUS: "status",
        CURRENT_SONG: "currentsong",
        SKIP: "next",
        PREV: "previous",
        PAUSE: "pause",
        PLAY: "play",
        LIST_QUEUE: "playlistinfo"
    },
    CachedData: {
        Status: {
            mpd: null,
            state: null,
            currentTimestamp: 0,
            currentTimestampString: '00:00:00',
            songLength: 0,
            songLengthString: '00:00:00',
            currentSong: null
        },
        StatusInterval: null
    },
    getPadded: function(num) { return ("0"+num).slice(-2); },
    getTimestampHHMMSS: function(secs) {
        var minutes = Math.floor(secs / 60);
        secs = secs%60;
        var hours = Math.floor(minutes/60)
        minutes = minutes%60;
        return MpdUtils.getPadded(hours)
            + ":" + MpdUtils.getPadded(minutes)
            + ":" + MpdUtils.getPadded(secs)
        ;
    },
    getTimestampMMSS: function(sec) {
        var minutes = Math.floor(secs / 60);
        secs = secs % 60;
        return MpdUtils.getPadded(minutes)
            + ":" + MpdUtils.getPadded(secs)
        ;
    },
    isConnected: function() { return !!client; },
    sendCommand: function(cmd, callback) {
        MpdUtils.MpdClient.sendCommand(cmd, callback);
    },
    parseResponseLine: function(line, targetObject) {
        var splitData = line.split(/(.*)(: )(.+)/);
        targetObject[splitData[1]] = splitData[3];
        return targetObject;
    },
    parseSongList: function(msg) {
        var lines = msg.split('\n');
        var songs = [];
        var currentSong = null;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.startsWith('file:') || line.startsWith('directory:')) {
                if (currentSong) songs.push(currentSong);
                currentSong = {};
            }
            MpdUtils.parseResponseLine(line, currentSong);
        }
        songs.push(currentSong);
        return songs;

    },
    ping: function(callback) {
        debug('PING...');
        MpdUtils.sendCommand(
            MpdUtils.Commands.PING,
            function(err, msg) {
                if (err) debug('ERROR while PING!');
                else debug('...PONG!');

                if (callback) callback(err, msg);
            }
        );
    },
    getCurrentStatus: function(callback) {
        MpdUtils.sendCommand(
            MpdUtils.Commands.STATUS,
            function(err, msg) {
                //debug(msg);

                var resp = {
                    mpdObject: null,
                    state: null,
                    currentTimestamp: 0,
                    currentTimestampString: MpdUtils.getTimestampHHMMSS(0),
                    songLength: 0,
                    songLengthString: MpdUtils.getTimestampHHMMSS(0),
                    currentSong: null
                };
                if (err) {
                    debug('ERROR while getting current status');
                    if (callback) callback(err, resp, msg);
                } else {
                    var mpdObject = { };

                    var lines = msg.split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        MpdUtils.parseResponseLine(lines[i], mpdObject);
                    }
                    resp.mpdObject = mpdObject;

                    if (mpdObject.state) {
                        var state = mpdObject.state;
                        resp.state = mpdObject.state;

                        if (state === 'play' || state === 'pause') {
                            var timestamps = mpdObject.time.split(':');
                            resp.currentTimestamp = Number(timestamps[0]);
                            resp.currentTimestampString = MpdUtils.getTimestampHHMMSS(resp.currentTimestamp);
                            resp.songLength = Number(timestamps[1]);
                            resp.songLengthString = MpdUtils.getTimestampHHMMSS(resp.songLength);

                            MpdUtils.sendCommand(
                                MpdUtils.Commands.CURRENT_SONG,
                                function (err, msg) {
                                    if (err) {
                                        debug('FAILED while trying to receive current song.');
                                        if (callback) callback(err, resp, msg);
                                    } else {
                                        var lines = msg.split('\n');
                                        var currentSong = {};
                                        for (var i = 0; i < lines.length; i++) {
                                            MpdUtils.parseResponseLine(lines[i], currentSong);
                                        }

                                        resp.currentSong = currentSong;
                                        if (callback) callback(err, resp, msg);
                                    }
                                }
                            )
                        } else if (state === 'stop') {
                            if (callback) callback(err, resp, msg);
                        }
                    }
                }
            }
        );
    },
    getCachedStatus: function() { return MpdUtils.CachedData.Status; },
    controlPlayback: function(action, callback) {
        switch (action) {
            case 'playPause':
                var state = MpdUtils.CachedData.Status.state;
                var command;
                if (state === 'play') command = cmd(MpdUtils.Commands.PAUSE, [ 1 ]);
                else if (state === 'pause') command = cmd(MpdUtils.Commands.PAUSE, [ 0 ]);
                else command = MpdUtils.Commands.PLAY;

                MpdUtils.sendCommand(
                    command,
                    function (err, msg) {
                        if (err) debug('ERROR while trying to play / pause song');
                        if (callback) callback(err, msg);
                    }
                );
                break;
            case 'skip':
                MpdUtils.sendCommand(
                    MpdUtils.Commands.SKIP,
                    function(err, msg) {
                        if (err) debug('ERROR while trying to skip song');
                        if (callback) callback(err, msg);
                    }
                );
                break;
            case 'prev':
                MpdUtils.sendCommand(
                    MpdUtils.Commands.PREV,
                    function(err, msg) {
                        if (err) debug('ERROR while trying to skip to previous song');
                        if (callback) callback(err, msg);
                    }
                );
                break;
            default:
                if (callback) callback({ error: 'UNKNOWN_ACTION' }, null);
        }
    },
    getQueue: function(callback) {
        MpdUtils.sendCommand(
            MpdUtils.Commands.LIST_QUEUE,
            function(err, msg) {
                debug(msg);

                var queue = [];
                if (err) {
                    debug('ERROR while requesting Queue (current playlist)');
                } else {
                    queue = MpdUtils.parseSongList(msg);
                }

                if (callback) callback(err, queue, msg);
            }
        );
    }
};

client.on('ready', function() {
    debug('Connected to MPD!');
    MpdUtils.KeepAlive = setInterval(
        MpdUtils.ping,
        15000
    );
    MpdUtils.CachedData.StatusInterval = setInterval(
        function() {
            MpdUtils.getCurrentStatus(function(err, status, msg) {
                if (err) {
                    debug('ERROR in Status Interval!');
                } else {
                    MpdUtils.CachedData.Status = status;
                }
            });
        },
        250
    );

    MpdUtils.ping();
});

module.exports = MpdUtils;
